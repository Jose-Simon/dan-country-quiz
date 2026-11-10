"""Measures how much of each flag is each Flag Color, for Flag Color Mode.

Run by build_data.py (needs Playwright's Chromium:  pip install playwright && playwright install chromium).
Each flag is drawn in a real browser, then every pixel is sorted into one of the Flag Colors
by its hue, saturation and brightness. Pixels that fit none (purple, brown, grey) count for nothing.
Results are kept in flag_colors.json, so a flag is only measured again when its file changes.
"""
import hashlib
import io
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_FILE = os.path.join(HERE, "flag_colors.json")
DRAW_WIDTH = 300
SMALLEST_SHARE = 0.005  # less than this is noise (edges, tiny emblem details) and isn't kept

FLAG_COLORS = ["red", "orange", "yellow", "green", "blue", "white", "black"]


def color_shares(png):
    rgb = np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=float) / 255
    high, low = rgb.max(axis=2), rgb.min(axis=2)
    spread = high - low
    saturation = np.where(high > 0, spread / np.maximum(high, 1e-9), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    safe = np.maximum(spread, 1e-9)
    hue = np.select([high == r, high == g], [((g - b) / safe) % 6, (b - r) / safe + 2], (r - g) / safe + 4) * 60

    vivid = (saturation >= 0.25) & (high >= 0.2)
    found = {
        "black": high < 0.2,
        "white": (saturation < 0.2) & (high > 0.8),
        "red": vivid & ((hue < 15) | (hue >= 340)),
        "orange": vivid & (hue >= 15) & (hue < 40) & (high > 0.6),  # darker is brown
        "yellow": vivid & (hue >= 40) & (hue < 70),
        "green": vivid & (hue >= 70) & (hue < 185),  # Sri Lanka's dark teal-green is 176
        "blue": vivid & (hue >= 185) & (hue < 260),
    }
    shares = {name: round(float(found[name].mean()), 3) for name in FLAG_COLORS}
    return {name: share for name, share in shares.items() if share >= SMALLEST_SHARE}


def measure_flags(flag_paths):
    """Returns {flag path: {color: share of the flag}} for every path, measuring only new or changed flags."""
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)

    def file_hash(path):
        with open(os.path.join(HERE, path), "rb") as f:
            return hashlib.sha1(f.read()).hexdigest()

    hashes = {path: file_hash(path) for path in flag_paths}
    to_measure = [path for path in flag_paths if cache.get(path, {}).get("hash") != hashes[path]]
    if to_measure:
        from playwright.sync_api import sync_playwright
        print(f"Measuring flag colors: {len(to_measure)} flags...")
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            for path in to_measure:
                # Opened as a page of its own, then stretched to a fixed width
                page.goto("file:///" + os.path.join(HERE, path).replace("\\", "/"))
                page.evaluate(f"""() => {{
                    const svg = document.documentElement;
                    const width = svg.width.baseVal.value, height = svg.height.baseVal.value;
                    const ratio = height / width;
                    // Without a viewBox, a new size would crop the flag instead of scaling it
                    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', `0 0 ${{width}} ${{height}}`);
                    svg.setAttribute('preserveAspectRatio', 'none');
                    svg.setAttribute('width', {DRAW_WIDTH});
                    svg.setAttribute('height', Math.round({DRAW_WIDTH} * ratio));
                }}""")
                png = page.locator("svg").first.screenshot()
                cache[path] = {"hash": hashes[path], "colors": color_shares(png)}
            browser.close()

    cache = {path: cache[path] for path in sorted(flag_paths)}
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=1, ensure_ascii=False)
    return {path: cache[path]["colors"] for path in flag_paths}
