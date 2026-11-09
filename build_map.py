"""Builds world.js, the World Map for Map Mode. Called by build_data.py.

Borders come from Natural Earth (public domain), simplified so the file stays small.
For every Country it also works out, ahead of time, the parts of the Hit Area:
its Home Parts, the shape wrapped around them (for the sea between islands), and the
circle that makes small Countries forgiving.
"""
import json
import math
import urllib.request

MAP_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"

# Natural Earth codes that differ from the quiz's. Somaliland and Northern Cyprus are
# drawn as part of the Country the world recognises.
MAP_CODES = {"SDS": "SSD", "SOL": "SOM", "CYN": "CYP", "KOS": "UNK", "PSX": "PSE",
             "SAH": "ESH", "ALD": "ALA"}

SIMPLIFY_DEGREES = 0.02     # drop detail smaller than about 2 km
SMALLEST_ISLAND = 0.03      # leave out islands narrower than this (degrees), unless nothing else is left
LOWEST_LATITUDE = -60       # Antarctica isn't asked, so it's left off the map
HOME_PART_KM = 500          # a part within this distance of another Home Part is a Home Part too
HIT_CIRCLE_TIMES = 4        # the hit circle is this many times the Country's size across...
HIT_CIRCLE_MAX_KM = 300     # ...but never wider than this
EARTH_KM = 6371


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "FlagGame-build"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def distance_km(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * EARTH_KM * math.asin(min(1, math.sqrt(h)))


def simplify(ring, tolerance):
    """Douglas-Peucker: keep only the points that change the shape by more than the tolerance."""
    if len(ring) < 4:
        return ring
    keep = [False] * len(ring)
    keep[0] = keep[-1] = True
    stack = [(0, len(ring) - 1)]
    while stack:
        first, last = stack.pop()
        (x1, y1), (x2, y2) = ring[first], ring[last]
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 1e-12
        furthest, index = 0, None
        for i in range(first + 1, last):
            x, y = ring[i]
            gap = abs(dy * (x - x1) - dx * (y - y1)) / length if (dx or dy) else math.hypot(x - x1, y - y1)
            if gap > furthest:
                furthest, index = gap, i
        if index is not None and furthest > tolerance:
            keep[index] = True
            stack += [(first, index), (index, last)]
    return [point for point, kept in zip(ring, keep) if kept]


def area_km2(ring):
    """Rough area of a ring, good enough to compare parts of one Country."""
    total = 0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        total += (x2 - x1) * (y2 + y1) / 2
    middle = sum(y for _, y in ring) / len(ring)
    return abs(total) * 111.32 ** 2 * math.cos(math.radians(middle))


def bounds(ring):
    xs, ys = [x for x, _ in ring], [y for _, y in ring]
    return min(xs), min(ys), max(xs), max(ys)


def parts_apart_km(a, b):
    """Shortest distance between two outlines (vertex to vertex), skipping far-apart pairs early."""
    ax1, ay1, ax2, ay2 = bounds(a)
    bx1, by1, bx2, by2 = bounds(b)
    lat_gap = max(0, by1 - ay2, ay1 - by2) * 111.32
    if lat_gap > HOME_PART_KM:
        return lat_gap
    return min(distance_km(p, q) for p in a for q in b)


def convex_hull(points):
    points = sorted(set(points))
    if len(points) < 3:
        return points

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def home_parts(polygons):
    """The largest landmass, plus every part within HOME_PART_KM of a Home Part."""
    outlines = [polygon[0] for polygon in polygons]
    home = {max(range(len(outlines)), key=lambda i: area_km2(outlines[i]))}
    added = set(home)
    while added:
        newly = set()
        for i in range(len(outlines)):
            if i not in home and any(parts_apart_km(outlines[i], outlines[j]) <= HOME_PART_KM for j in added):
                newly.add(i)
        home |= newly
        added = newly
    return sorted(home)


def hit_area(polygons, home):
    """The wrapped shape and the forgiving circle for a Country's Home Parts."""
    points = [p for i in home for p in polygons[i][0]]
    # A Country that straddles the 180th meridian (Russia) is measured with its far-east
    # part moved to the other side, so it isn't wrapped around the whole world
    lons = [x for x, _ in points]
    wraps = max(lons) - min(lons) > 180
    if wraps:
        points = [(x + 360 if x < 0 else x, y) for x, y in points]

    total, centre_x, centre_y = 0, 0, 0
    for i in home:
        outline = [(x + 360 if wraps and x < 0 else x, y) for x, y in polygons[i][0]]
        area = area_km2(outline)
        total += area
        centre_x += area * sum(x for x, _ in outline) / len(outline)
        centre_y += area * sum(y for _, y in outline) / len(outline)
    centre_x, centre_y = centre_x / total, centre_y / total
    if centre_x > 180:
        centre_x -= 360

    size_km = math.sqrt(total)
    radius_km = min(HIT_CIRCLE_TIMES * size_km, HIT_CIRCLE_MAX_KM) / 2
    hull = [[round(x, 2), round(y, 2)] for x, y in convex_hull(points)]
    return hull, [round(centre_x, 2), round(centre_y, 2)], round(radius_km)


def flat(ring):
    return [n for point in ring for n in (round(point[0], 2), round(point[1], 2))]


def write_world_map(output_file, country_codes, asked_codes, all_codes):
    """country_codes: Countries to work out Hit Areas for; asked_codes: the Countries Map Mode
    asks, which must all be on the map; all_codes: every Flag Entry."""
    print("Downloading World Map...")
    features = json.loads(download(MAP_URL))["features"]

    shapes = {}
    for feature in features:
        code = feature["properties"]["ADM0_A3"]
        code = MAP_CODES.get(code, code)
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        for polygon in polygons:
            if max(y for _, y in polygon[0]) < LOWEST_LATITUDE:
                continue
            rings = [[tuple(p) for p in simplify(ring, SIMPLIFY_DEGREES)] for ring in polygon]
            if len(rings[0]) >= 4:
                shapes.setdefault(code, []).append(rings)

    unmatched = sorted(code for code in shapes if code not in all_codes)
    print("Map shapes with no Flag Entry (drawn as land only): " + ", ".join(unmatched))
    missing = sorted(code for code in country_codes if code not in shapes)
    print("Countries too small for the World Map: " + ", ".join(missing))
    if any(code in asked_codes for code in missing):
        raise SystemExit("Map Mode asks Countries that have no shape on the World Map")

    countries = []
    for code, polygons in sorted(shapes.items()):
        # Leave out the tiniest islands, keeping at least the largest part
        largest = max(polygons, key=lambda polygon: area_km2(polygon[0]))
        polygons = [polygon for polygon in polygons if polygon is largest or
                    max(bounds(polygon[0])[2] - bounds(polygon[0])[0],
                        bounds(polygon[0])[3] - bounds(polygon[0])[1]) >= SMALLEST_ISLAND]
        country = {"code": code, "parts": [[flat(ring) for ring in polygon] for polygon in polygons]}
        if code in country_codes:
            home = home_parts(polygons)
            hull, centre, radius = hit_area(polygons, home)
            country.update({"home": home, "hull": hull, "centre": centre, "hitRadius": radius})
        countries.append(country)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("// Generated by build_map.py - do not edit by hand.\n")
        f.write("// Borders: Natural Earth (naturalearthdata.com), public domain.\n")
        f.write("const WORLD_MAP = [\n")
        for country in countries:
            f.write("    " + json.dumps(country, separators=(",", ":")) + ",\n")
        f.write("];\n")
    points = sum(len(ring) // 2 for c in countries for polygon in c["parts"] for ring in polygon)
    print(f"Wrote world.js: {len(countries)} shapes, {points} points")
