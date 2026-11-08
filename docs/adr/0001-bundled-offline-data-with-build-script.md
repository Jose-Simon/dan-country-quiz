# Bundled offline data, rebuilt by a Python script

The game reads country data and flags from files inside the project (`countries.js` and `flags/`) rather than calling a countries API at load time. This lets `index.html` be opened by double-click with no server or internet connection, avoids browsers blocking `fetch` from `file://`, and keeps the population order — and so the Level bands — stable between Quizzes. A small Python script, `build_data.py`, downloads the source data and flags and merges in a hand-edited overrides file (Other Names, island Neighbour Clues, the four non-UN Countries), so corrections are a one-line edit and a rerun rather than editing the generated file.

## Considered Options

- **Live API on every load** — always current, but breaks offline, depends on a third-party service staying up, and lets difficulty order drift.
- **One-off download with no script** — simplest, but every later fix means hand-editing a large generated file with no record of where values came from.
