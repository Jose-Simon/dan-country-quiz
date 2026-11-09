"""Builds countries.js, world.js and the flags/ folder for the Flag Game.

Run once (needs internet):  python build_data.py
Re-download every flag too:  python build_data.py --refresh-flags

Country data comes from a copy of the REST Countries v3.1 dataset kept in the
RESTCountries.NET project on GitHub (the public API now needs a key). Flags come
from flagcdn.com. Hand-made fixes live in overrides.py.
"""
import hashlib
import json
import os
import re
import sys
import urllib.request

from build_map import write_world_map
from overrides import (CAPITAL_OTHER_NAMES, CAPITALS, CURRENCIES, CURRENCY_NAMES,
                       CURRENCY_OTHER_NAMES, DISPLAY_NAMES, EXTRA_COUNTRIES, ISLAND_NEIGHBOURS,
                       OTHER_NAMES, SAME_FLAG_AS_COUNTRY, TERRITORY_OWNERS)

SOURCE_URL = "https://raw.githubusercontent.com/egbakou/RESTCountries.NET/main/src/RESTCountries.NET/Services/data.json"
FLAG_URL = "https://flagcdn.com/{}.svg"
HERE = os.path.dirname(os.path.abspath(__file__))
FLAGS_DIR = os.path.join(HERE, "flags")
OUTPUT_FILE = os.path.join(HERE, "countries.js")

EXPECTED_COUNTRIES = 197

# Names that read better with "the" in front ("Belongs to the United Kingdom")
NAMES_WITH_THE = {"USA", "GBR", "NLD", "ARE", "PHL", "BHS", "GMB", "CAF", "DOM",
                  "COG", "MDV", "MHL", "SLB", "SYC", "COM"}


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "FlagGame-build"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def population_text(population):
    if population == 0:
        return "Uninhabited"
    if population >= 1_000_000_000:
        return f"about {population / 1_000_000_000:.1f} billion"
    if population >= 10_000_000:
        return f"about {round(population / 1_000_000)} million"
    if population >= 1_000_000:
        return f"about {population / 1_000_000:.1f} million".replace(".0 ", " ")
    # Round to two significant figures: 882 -> 880, 75,348 -> 75,000
    digits = len(str(population)) - 2
    rounded = round(population, -digits) if digits > 0 else population
    return f"about {rounded:,}"


def add_svg_size(path):
    """A few flags (e.g. Bangladesh) give only a viewBox. Without a width and height the
    browser can't size the flag on the page, so add them in the viewBox's shape."""
    with open(path, encoding="utf-8") as f:
        svg = f.read()
    tag = svg[:svg.index(">")]
    match = re.search(r'viewBox="-?[\d.]+ -?[\d.]+ ([\d.]+) ([\d.]+)"', tag)
    if " width=" in tag or not match:
        return
    view_width, view_height = (float(n) for n in match.groups())
    width, height = 1000, round(1000 * view_height / view_width)
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg.replace("<svg ", f'<svg width="{width}" height="{height}" ', 1))


def saint_variants(name):
    if name.startswith("Saint "):
        rest = name[len("Saint "):]
        return ["St " + rest, "St. " + rest]
    return []


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    refresh_flags = "--refresh-flags" in sys.argv

    print("Downloading country data...")
    source = json.loads(download(SOURCE_URL))
    by_code = {c["cca3"]: c for c in source}

    problems = []
    for table_name, table in [("EXTRA_COUNTRIES", EXTRA_COUNTRIES), ("DISPLAY_NAMES", DISPLAY_NAMES),
                              ("OTHER_NAMES", OTHER_NAMES), ("TERRITORY_OWNERS", TERRITORY_OWNERS),
                              ("ISLAND_NEIGHBOURS", ISLAND_NEIGHBOURS),
                              ("SAME_FLAG_AS_COUNTRY", SAME_FLAG_AS_COUNTRY), ("CAPITALS", CAPITALS),
                              ("CAPITAL_OTHER_NAMES", CAPITAL_OTHER_NAMES), ("CURRENCIES", CURRENCIES)]:
        for code in table:
            if code not in by_code:
                problems.append(f"{table_name}: unknown code {code}")

    def display_name(code):
        return DISPLAY_NAMES.get(code, by_code[code]["name"]["common"])

    def with_the(code):
        return ("the " if code in NAMES_WITH_THE else "") + display_name(code)

    def is_country(c):
        return c["unMember"] or c["cca3"] in EXTRA_COUNTRIES

    countries = sorted((c for c in source if is_country(c)), key=lambda c: -c["population"])
    rank_of = {c["cca3"]: rank for rank, c in enumerate(countries, start=1)}
    if len(countries) != EXPECTED_COUNTRIES:
        problems.append(f"Expected {EXPECTED_COUNTRIES} Countries, found {len(countries)}")

    capital_owner = {}
    currency_codes = set()
    entries = []
    for c in sorted(source, key=lambda c: display_name(c["cca3"])):
        code = c["cca3"]
        name = display_name(code)

        if not is_country(c):
            owner = TERRITORY_OWNERS.get(code)
            if owner is None:
                problems.append(f"Territory {code} ({name}) has no entry in TERRITORY_OWNERS")
                neighbour = ""
            elif owner in by_code:
                neighbour = "Belongs to " + with_the(owner)
            else:
                neighbour = owner
        elif c["borders"]:
            biggest = max(c["borders"], key=lambda b: by_code[b]["population"] if b in by_code else -1)
            neighbour = "Shares a border with " + with_the(biggest)
        elif code in ISLAND_NEIGHBOURS:
            neighbour = "Nearest neighbour across the sea: " + with_the(ISLAND_NEIGHBOURS[code])
        else:
            problems.append(f"Country {code} ({name}) has no land border and no entry in ISLAND_NEIGHBOURS")
            neighbour = ""

        other_names = list(OTHER_NAMES.get(code, []))
        if name != c["name"]["common"]:
            other_names.append(c["name"]["common"])
        for n in [name] + other_names:
            other_names += saint_variants(n)
        other_names = [n for n in dict.fromkeys(other_names) if n != name]

        flag_file = c["cca2"].lower() + ".svg"
        entry = {
            "code": code,
            "name": name,
            "otherNames": other_names,
            "flag": "flags/" + flag_file,
            "kind": "country" if is_country(c) else "territory",
            "rank": rank_of.get(code),
            "continent": " / ".join(c["continents"]),
            "population": population_text(c["population"]),
            "populationCount": c["population"],
            "neighbour": neighbour,
        }
        if is_country(c):
            capitals = CAPITALS.get(code, c.get("capital") or [])
            if not capitals:
                problems.append(f"Country {code} ({name}) has no capital - add it to CAPITALS")
            for city in capitals:
                if city in capital_owner:
                    problems.append(f"{city} is the capital of both {capital_owner[city]} and {code} - keep one in CAPITALS")
                capital_owner[city] = code
            capital_names = list(CAPITAL_OTHER_NAMES.get(code, []))
            for n in capitals + capital_names:
                capital_names += saint_variants(n)
            entry["capitals"] = capitals
            entry["capitalOtherNames"] = [n for n in dict.fromkeys(capital_names) if n not in capitals]
            currencies = CURRENCIES.get(code) or [(currency_code, currency["name"], currency.get("symbol", ""))
                                                  for currency_code, currency in (c.get("currencies") or {}).items()]
            if not currencies:
                problems.append(f"Country {code} ({name}) has no currency - add it to CURRENCIES")
            entry["currencies"] = [{"code": currency_code,
                                    "name": CURRENCY_NAMES.get(currency_code, currency_name),
                                    "symbol": symbol.strip(),
                                    "otherNames": CURRENCY_OTHER_NAMES.get(currency_code, [])}
                                   for currency_code, currency_name, symbol in currencies]
            currency_codes.update(currency_code for currency_code, _, _ in currencies)
        entries.append(entry)

    for table_name, table in [("CURRENCY_NAMES", CURRENCY_NAMES), ("CURRENCY_OTHER_NAMES", CURRENCY_OTHER_NAMES)]:
        for currency_code in table:
            if currency_code not in currency_codes:
                problems.append(f"{table_name}: no Country uses currency {currency_code}")

    if problems:
        print("\nPlease fix these in overrides.py:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)

    os.makedirs(FLAGS_DIR, exist_ok=True)
    downloaded = 0
    for entry in entries:
        path = os.path.join(HERE, entry["flag"])
        if refresh_flags or not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(download(FLAG_URL.format(os.path.basename(path)[:-4])))
            downloaded += 1
        add_svg_size(path)
    print(f"Flags: {downloaded} downloaded, {len(entries) - downloaded} already present")

    # Leave out Territories that fly their Country's flag - the player couldn't tell them apart
    def flag_hash(entry):
        with open(os.path.join(HERE, entry["flag"]), "rb") as f:
            return hashlib.sha1(f.read()).hexdigest()

    country_flags = {flag_hash(e) for e in entries if e["kind"] == "country"}
    left_out = [e for e in entries if e["kind"] == "territory" and
                (e["code"] in SAME_FLAG_AS_COUNTRY or flag_hash(e) in country_flags)]
    entries = [e for e in entries if e not in left_out]
    print("Left out (same flag as their Country): " + ", ".join(e["name"] for e in left_out))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("// Generated by build_data.py - do not edit by hand. Make changes in overrides.py.\n")
        f.write("const FLAG_ENTRIES = [\n")
        for entry in entries:
            f.write("    " + json.dumps(entry, ensure_ascii=False) + ",\n")
        f.write("];\n")

    territories = sum(e["kind"] == "territory" for e in entries)
    print(f"Wrote countries.js: {len(entries)} Flag Entries ({len(countries)} Countries, {territories} Territories)")

    # Map Mode asks the 100 Countries with the best Population Rank
    country_codes = {e["code"] for e in entries if e["kind"] == "country"}
    asked_codes = {e["code"] for e in entries if e["kind"] == "country" and e["rank"] <= 100}
    write_world_map(os.path.join(HERE, "world.js"), country_codes, asked_codes, {e["code"] for e in entries})


if __name__ == "__main__":
    main()
