// ---- World Map (Map Mode) ----
//
// Drawn once as an SVG in the Miller projection, which keeps the far north from
// stretching as much as a flat lon/lat map. Everything else on this page works in
// longitude and latitude; only drawing and turning a click into a place use the projection.

const MAP_SEA_KM = 250;          // sea between Home Parts counts up to this far from their coast
const MAP_TAP_PIXELS = 6;        // a press that moves further than this is a drag, not a click
const MAP_MOST_ZOOM = 40;        // how far in the player can zoom (times the whole world)
const MAP_MARK_PIXELS = 6;       // size of the dots marking the player's clicks
const MAP_REVEAL_DEGREES = 40;   // the Reveal shows at least this much of the world across
const CAPITAL_HIT_KM = 150;      // a click this close to a capital counts
const CAPITAL_MARK_TIMES = 1.6;  // capital marks are this much bigger than click marks
const EARTH_KM = 6371;

const mapShapes = new Map(WORLD_MAP.map(shape => [shape.code, shape]));
let mapSvg, mapLand, mapMarks, mapView, mapWorld, mapOnClick;
let mapClicks = [];  // this Question's clicks, as [lon, lat]

function millerY(lat) {
    const phi = lat * Math.PI / 180;
    return -1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi)) * 180 / Math.PI;  // SVG y grows downwards
}

function millerLat(y) {
    return (2.5 * Math.atan(Math.exp(-0.8 * y * Math.PI / 180)) - 0.625 * Math.PI) * 180 / Math.PI;
}

function ringPath(ring) {
    let path = '';
    for (let i = 0; i < ring.length; i += 2) {
        path += `${i ? 'L' : 'M'}${ring[i]},${millerY(ring[i + 1]).toFixed(2)}`;
    }
    return path + 'Z';
}

function svgElement(name, attributes) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}

// Builds the map inside the box once; onClick(lon, lat) is called for each click (not drag)
function setUpWorldMap(box, onClick) {
    if (mapSvg) return;
    mapOnClick = onClick;
    const top = millerY(84), bottom = millerY(-60);
    mapWorld = { x: -180, y: top, w: 360, h: bottom - top };
    mapSvg = svgElement('svg', { class: 'worldMap', role: 'img', 'aria-label': 'World map' });
    mapLand = svgElement('g', {});
    mapMarks = svgElement('g', {});
    WORLD_MAP.forEach(shape => {
        const home = new Set(shape.home || shape.parts.map((_, i) => i));
        [true, false].forEach(isHome => {
            const d = shape.parts.filter((_, i) => home.has(i) === isHome).flat().map(ringPath).join('');
            if (!d) return;
            const path = svgElement('path', { d, class: 'land', 'fill-rule': 'evenodd', 'vector-effect': 'non-scaling-stroke' });
            if (isHome) path.dataset.code = shape.code;
            mapLand.appendChild(path);
        });
    });
    mapSvg.append(mapLand, mapMarks);
    box.prepend(mapSvg);
    listenForMapGestures();
    new ResizeObserver(() => setMapView(mapView || mapWorld)).observe(mapSvg);
    resetMap();
}

// ---- Zooming and moving around ----

function mapPixelsPerUnit() {
    return mapSvg.getBoundingClientRect().width / mapView.w;
}

// A mark's size in map units; on a hidden map it is 0 until setMapView sizes it once shown
function markSize(pixels) {
    const perUnit = mapPixelsPerUnit();
    return perUnit > 0 ? pixels / perUnit : 0;
}

// Shows the given area (in map units), keeping the box's shape and staying over the world
function setMapView(view) {
    const box = mapSvg.getBoundingClientRect();
    if (!box.width || !box.height) { mapView = view; return; }
    const aspect = box.width / box.height;
    let { x, y, w, h } = view;
    const centreX = x + w / 2, centreY = y + h / 2;
    w = Math.min(Math.max(w, h * aspect, mapWorld.w / MAP_MOST_ZOOM), mapWorld.w);
    h = w / aspect;
    x = Math.min(Math.max(centreX - w / 2, mapWorld.x), mapWorld.x + mapWorld.w - w);
    y = h >= mapWorld.h ? mapWorld.y + (mapWorld.h - h) / 2
                        : Math.min(Math.max(centreY - h / 2, mapWorld.y), mapWorld.y + mapWorld.h - h);
    mapView = { x, y, w, h };
    mapSvg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    mapMarks.querySelectorAll('circle').forEach(mark => {
        const size = markSize(MAP_MARK_PIXELS) * (Number(mark.dataset.times) || 1);
        mark.setAttribute('r', size);
        mark.setAttribute('stroke-width', size / 3);
    });
}

function zoomMap(factor, aroundX, aroundY) {
    const { x, y, w, h } = mapView;
    const pointX = aroundX ?? x + w / 2, pointY = aroundY ?? y + h / 2;
    setMapView({ x: pointX - (pointX - x) / factor, y: pointY - (pointY - y) / factor, w: w / factor, h: h / factor });
}

// Shows a box given in longitude and latitude, with a margin round it
function zoomMapTo(west, south, east, north) {
    const top = millerY(Math.min(north, 84)), bottom = millerY(Math.max(south, -60));
    const marginX = (east - west) * 0.15 + 2, marginY = (bottom - top) * 0.15 + 2;
    setMapView({ x: west - marginX, y: top - marginY, w: east - west + 2 * marginX, h: bottom - top + 2 * marginY });
}

function homeBounds(codes) {
    let west = 180, south = 90, east = -180, north = -90;
    codes.forEach(code => {
        const shape = mapShapes.get(code);
        if (!shape) return;
        shape.home.forEach(i => {
            const ring = shape.parts[i][0];
            for (let j = 0; j < ring.length; j += 2) {
                west = Math.min(west, ring[j]); east = Math.max(east, ring[j]);
                south = Math.min(south, ring[j + 1]); north = Math.max(north, ring[j + 1]);
            }
        });
    });
    return [west, south, east, north];
}

// Shows the Country with its surroundings and the player's clicks, so it's clear where it lies
function zoomMapToCountry(code) {
    zoomMapAround(...homeBounds([code]));
}

function zoomMapToCapitals(places) {
    const lons = places.map(([lon]) => lon), lats = places.map(([, lat]) => lat);
    zoomMapAround(Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats));
}

// Shows a box given in longitude and latitude together with the player's clicks, and at
// least MAP_REVEAL_DEGREES across
function zoomMapAround(west, south, east, north) {
    mapClicks.forEach(([lon, lat]) => {
        west = Math.min(west, lon); east = Math.max(east, lon);
        south = Math.min(south, lat); north = Math.max(north, lat);
    });
    const middleLon = (west + east) / 2, middleLat = (south + north) / 2;
    const halfWidth = Math.max((east - west) / 2, MAP_REVEAL_DEGREES / 2);
    const halfHeight = Math.max((north - south) / 2, MAP_REVEAL_DEGREES / 4);
    zoomMapTo(middleLon - halfWidth, middleLat - halfHeight, middleLon + halfWidth, middleLat + halfHeight);
}

// The Countries that lie only on this continent, e.g. "Europe" leaves out Russia and Turkey
function zoomMapToContinent(continent) {
    const names = continent.split(' / ');
    const codes = FLAG_ENTRIES.filter(entry => entry.kind === 'country' && mapShapes.get(entry.code)?.home &&
                                               names.includes(entry.continent)).map(entry => entry.code);
    zoomMapTo(...homeBounds(codes));
}

function resetMap() {
    mapMarks.innerHTML = '';
    mapClicks = [];
    mapLand.querySelectorAll('.found, .missed, .outlined').forEach(path => path.classList.remove('found', 'missed', 'outlined'));
    setMapView(mapWorld);
}

function mapPoint(clientX, clientY) {
    const point = new DOMPoint(clientX, clientY).matrixTransform(mapSvg.getScreenCTM().inverse());
    return { x: point.x, y: point.y };
}

// Drag to move, wheel or pinch to zoom; a press that barely moves is a click
function listenForMapGestures() {
    const pointers = new Map();
    let moved = 0, pinchGap = 0;

    mapSvg.addEventListener('pointerdown', event => {
        mapSvg.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) moved = 0;
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinchGap = Math.hypot(a.x - b.x, a.y - b.y);
            moved = Infinity;  // a pinch is never a click
        }
    });

    mapSvg.addEventListener('pointermove', event => {
        const last = pointers.get(event.pointerId);
        if (!last) return;
        const now = { x: event.clientX, y: event.clientY };
        pointers.set(event.pointerId, now);
        if (pointers.size === 1) {
            moved += Math.hypot(now.x - last.x, now.y - last.y);
            if (moved > MAP_TAP_PIXELS) {
                const scale = mapPixelsPerUnit();
                setMapView({ ...mapView, x: mapView.x - (now.x - last.x) / scale, y: mapView.y - (now.y - last.y) / scale });
            }
        } else if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const gap = Math.hypot(a.x - b.x, a.y - b.y);
            const middle = mapPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
            if (pinchGap) zoomMap(gap / pinchGap, middle.x, middle.y);
            pinchGap = gap;
        }
    });

    const release = event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.delete(event.pointerId);
        if (pointers.size === 0 && moved <= MAP_TAP_PIXELS && event.type === 'pointerup') {
            const point = mapPoint(event.clientX, event.clientY);
            mapOnClick(point.x, millerLat(point.y));
        }
        if (pointers.size < 2) pinchGap = 0;
    };
    mapSvg.addEventListener('pointerup', release);
    mapSvg.addEventListener('pointercancel', release);

    mapSvg.addEventListener('wheel', event => {
        event.preventDefault();
        const point = mapPoint(event.clientX, event.clientY);
        zoomMap(Math.exp(-event.deltaY * 0.002), point.x, point.y);
    }, { passive: false });
}

// ---- Marks and Reveal ----

function markMapClick(lon, lat) {
    mapClicks.push([lon, lat]);
    const size = markSize(MAP_MARK_PIXELS);
    mapMarks.appendChild(svgElement('circle', { cx: lon, cy: millerY(lat), r: size, 'stroke-width': size / 3, class: 'clickMark' }));
}

// Fills the Country's Home Parts: 'found' (green) or 'missed' (red-orange)
function fillMapCountry(code, className) {
    const path = mapLand.querySelector(`path[data-code="${code}"]`);
    if (path) {
        path.classList.add(className);
        mapLand.appendChild(path);  // drawn last, so its border sits on top of its neighbours'
    }
}

// The Outline Clue: shows the Country's border and brings it into view
function outlineMapCountry(code) {
    const path = mapLand.querySelector(`path[data-code="${code}"]`);
    if (path) {
        path.classList.add('outlined');
        mapLand.appendChild(path);
    }
    zoomMapTo(...homeBounds([code]));
}

// Marks each capital, 'found' (green) or 'missed' (red-orange), with the circle a click had to land in
function markCapitals(places, className) {
    places.forEach(([lon, lat]) => {
        const ring = [];
        for (let bearing = 0; bearing < 360; bearing += 5) {
            const [x, y] = pointAway(lon, lat, bearing, CAPITAL_HIT_KM);
            ring.push(`${bearing ? 'L' : 'M'}${x},${millerY(y)}`);
        }
        mapMarks.prepend(svgElement('path', { d: ring.join('') + 'Z', class: `capitalArea ${className}`, 'vector-effect': 'non-scaling-stroke' }));
        const size = markSize(CAPITAL_MARK_TIMES * MAP_MARK_PIXELS);
        const mark = svgElement('circle', { cx: lon, cy: millerY(lat), r: size, 'stroke-width': size / 3, class: `capitalMark ${className}` });
        mark.dataset.times = CAPITAL_MARK_TIMES;
        mapMarks.appendChild(mark);
    });
}

// ---- Hit Area and Nudge ----

// The place this many km from a point along a compass bearing (degrees), on the globe
function pointAway(lon, lat, bearing, km) {
    const rad = Math.PI / 180, angle = km / EARTH_KM;
    const lat1 = lat * rad, turn = bearing * rad;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angle) + Math.cos(lat1) * Math.sin(angle) * Math.cos(turn));
    const lon2 = lon * rad + Math.atan2(Math.sin(turn) * Math.sin(angle) * Math.cos(lat1),
                                        Math.cos(angle) - Math.sin(lat1) * Math.sin(lat2));
    return [lon2 / rad, lat2 / rad];
}

function distanceKm(lon1, lat1, lon2, lat2) {
    const rad = Math.PI / 180;
    const h = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
    return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function inRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const x1 = ring[i], y1 = ring[i + 1], x2 = ring[j], y2 = ring[j + 1];
        if ((y1 > lat) !== (y2 > lat) && lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1) inside = !inside;
    }
    return inside;
}

// A polygon is its outline followed by any holes (e.g. Lesotho inside South Africa)
function inPolygon(lon, lat, polygon) {
    return polygon.reduce((inside, ring) => inRing(lon, lat, ring) ? !inside : inside, false);
}

function landAt(lon, lat) {
    return WORLD_MAP.find(shape => shape.parts.some(polygon => inPolygon(lon, lat, polygon)));
}

function homeVertices(shape, visit) {
    shape.home.forEach(i => {
        const ring = shape.parts[i][0];
        for (let j = 0; j < ring.length; j += 2) visit(ring[j], ring[j + 1]);
    });
}

// Right if inside the Home Parts, inside the circle round the Country, or out at sea
// between its Home Parts (inside the shape wrapped round them and near their coast)
function isMapHit(code, lon, lat) {
    const shape = mapShapes.get(code);
    if (shape.home.some(i => inPolygon(lon, lat, shape.parts[i]))) return true;
    if (distanceKm(lon, lat, shape.centre[0], shape.centre[1]) <= shape.hitRadius) return true;
    if (landAt(lon, lat)) return false;  // another Country's land never counts
    // The wrapped shape of a Country across the 180th meridian (Russia) uses longitudes past 180
    const wrappedLon = lon < 0 && shape.hull.some(([x]) => x > 180) ? lon + 360 : lon;
    if (!inRing(wrappedLon, lat, shape.hull.flat())) return false;
    let nearest = Infinity;
    homeVertices(shape, (x, y) => { nearest = Math.min(nearest, distanceKm(lon, lat, x, y)); });
    return nearest <= MAP_SEA_KM;
}

// A Country with more than one capital counts any of them
function isCapitalHit(places, lon, lat) {
    return places.some(([x, y]) => distanceKm(lon, lat, x, y) <= CAPITAL_HIT_KM);
}

// The compass direction from the click towards the nearest point of the Country
function mapNudge(code, lon, lat) {
    let nearest = Infinity, target;
    homeVertices(mapShapes.get(code), (x, y) => {
        const gap = distanceKm(lon, lat, x, y);
        if (gap < nearest) { nearest = gap; target = [x, y]; }
    });
    return compassTowards(lon, lat, target);
}

function capitalNudge(places, lon, lat) {
    const gap = ([x, y]) => distanceKm(lon, lat, x, y);
    return compassTowards(lon, lat, places.reduce((best, place) => gap(place) < gap(best) ? place : best));
}

// Measured on the globe, so it points the short way round
function compassTowards(lon, lat, target) {
    const rad = Math.PI / 180;
    const lat1 = lat * rad, lat2 = target[1] * rad, deltaLon = (target[0] - lon) * rad;
    const bearing = Math.atan2(Math.sin(deltaLon) * Math.cos(lat2),
                               Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon));
    const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
    return directions[Math.round(((bearing / rad + 360) % 360) / 45) % 8];
}
