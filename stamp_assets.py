"""Tags each script and stylesheet link in index.html with its file's version.

Run before every commit:  python stamp_assets.py

GitHub Pages lets browsers keep a file for 10 minutes, so after an update a browser could
load the new index.html with the old script.js, and buttons would call code that isn't there.
A link like script.js?v=1a2b3c4d changes whenever the file does, so the browser fetches it again.
"""
import hashlib
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "index.html")


def version(path):
    with open(os.path.join(HERE, path), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def main():
    with open(PAGE, encoding="utf-8") as f:
        page = f.read()
    stamped = re.sub(r'(src|href)="([\w/.-]+\.(?:js|css))(?:\?v=\w+)?"',
                     lambda m: f'{m[1]}="{m[2]}?v={version(m[2])}"', page)
    with open(PAGE, "w", encoding="utf-8") as f:
        f.write(stamped)
    for link in re.findall(r'(?:src|href)="([^"]+\?v=\w+)"', stamped):
        print(link)


if __name__ == "__main__":
    main()
