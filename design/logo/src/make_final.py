"""Build the final Qalam logo files.

Run:  py -3 design/logo/src/make_final.py   (writes design/logo/final/)

Outputs
  qalam.svg              master, brand green, 256 x 256 canvas
  qalam-gold.svg         for ink / dark backgrounds
  qalam-tight.svg        green, viewBox cropped to the mark (for UI use next to text)
  qalam-small.svg        small-size cut (heavier nib) used for favicon / app icons
and prints the tight path data used by src/components/layout/BrandMark.tsx.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_concepts import f, poly, qalam_parts  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "final"
OUT.mkdir(parents=True, exist_ok=True)

GREEN = "#0b5d45"  # --color-series: the brand green
GOLD = "#f2b035"  # --color-accent: play / continue

TITLE = "Qalam — the platform's mark: a play button drawn with the reed pen"


def svg(d: str, fill: str, view: str = "0 0 256 256", size: tuple[float, float] = (256, 256)) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{f(size[0])}" height="{f(size[1])}" '
        f'role="img" aria-labelledby="title">\n  <title id="title">{TITLE}</title>\n'
        f'  <path fill="{fill}" d="{d}"/>\n</svg>\n'
    )


def path_of(parts, dx: float = 0.0, dy: float = 0.0) -> str:
    return " ".join(poly([(x + dx, y + dy) for x, y in p]) for p in parts)


def main() -> None:
    parts = qalam_parts(nib=50)
    d = path_of(parts)
    (OUT / "qalam.svg").write_text(svg(d, GREEN), encoding="utf-8")
    (OUT / "qalam-gold.svg").write_text(svg(d, GOLD), encoding="utf-8")

    # tight crop: translate so the bbox starts at 0,0 and round the box up to whole units
    xs = [x for p in parts for x, _ in p]
    ys = [y for p in parts for _, y in p]
    x0, y0 = min(xs), min(ys)
    w, h = math.ceil(max(xs) - x0), math.ceil(max(ys) - y0)
    tight = path_of(parts, -x0 + (w - (max(xs) - x0)) / 2, -y0 + (h - (max(ys) - y0)) / 2)
    (OUT / "qalam-tight.svg").write_text(svg(tight, GREEN, f"0 0 {w} {h}", (w, h)), encoding="utf-8")

    # small-size cut: heavier nib so the thin edges stay >= 1.5 px at 16 px; slightly smaller path to keep the hole
    small = qalam_parts(nib=64, half=70)
    (OUT / "qalam-small.svg").write_text(svg(path_of(small), GREEN), encoding="utf-8")

    # app icon / favicon tile: gold small cut on a green rounded square, mark 62 % of the tile height
    sx = [x for p in small for x, _ in p]
    sy = [y for p in small for _, y in p]
    s = 0.62 * 256 / (max(sy) - min(sy))
    tx = 128 - s * (min(sx) + max(sx)) / 2
    ty = 128 - s * (min(sy) + max(sy)) / 2
    tile_path = " ".join(poly([(x * s + tx, y * s + ty) for x, y in p]) for p in small)
    tile = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">'
        f'<rect width="256" height="256" rx="56" fill="{GREEN}"/><path fill="{GOLD}" d="{tile_path}"/></svg>\n'
    )
    (OUT / "qalam-icon.svg").write_text(tile, encoding="utf-8")

    print(f"tight viewBox 0 0 {w} {h}")
    print(tight)


if __name__ == "__main__":
    main()
