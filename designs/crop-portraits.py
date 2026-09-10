#!/usr/bin/env python3
"""Cut square face crops out of the Master portraits.

    python designs/crop-portraits.py

Reads   apps/native/assets/images/portraits/master-*.png   (the supplied images)
Writes  apps/native/assets/images/portraits/avatar-*.png   (what the app ships)

The supplied portraits are all different shapes — Sun Tzu is 1:2 with his
face in the top third, Curie is 120x176 — so a centred square crop at runtime
shows Sun Tzu's torso and cuts Curie's forehead. Each crop box here is chosen
per portrait, around the face, and the result is written once. The app then
only ever renders squares, which a round mask handles cleanly at any size.

Output is capped at 256px and never upscaled. Upscaling a small source adds
blur without adding detail; it is better to let the device scale it and to
know, from the report below, which sources are too small.

Mandela is withdrawn from the app (D-006), so no avatar is cut for him; his
source image is kept.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PORTRAITS = ROOT / "apps" / "native" / "assets" / "images" / "portraits"

MAX = 256

# slug -> (source file, crop box as (left, top, right, bottom) in source pixels)
#
# Boxes were set by looking at each image. Keep them square — the component
# assumes it.
CROPS: dict[str, tuple[str, tuple[int, int, int, int]]] = {
    # 320x320. Face in profile, centre-right; trims the empty top-left.
    "musashi": ("master-musashi.png", (30, 10, 320, 300)),
    # 447x447 marble bust. Face centred; trims shoulders and background.
    "seneca": ("master-seneca.png", (40, 10, 420, 390)),
    # 120x176 photograph. Face in the upper two thirds.
    "curie": ("master-curie.png", (0, 8, 120, 128)),
    # 128x256 painted portrait. Face and hat in the top half; a centred crop
    # would show his robe.
    "sun-tzu": ("master-suntzu.png", (0, 6, 128, 134)),
}


def main() -> int:
    if not PORTRAITS.exists():
        raise SystemExit(f"{PORTRAITS} not found")

    for slug, (name, box) in CROPS.items():
        source = PORTRAITS / name
        if not source.exists():
            print(f"  {slug:8} SKIP — {name} missing")
            continue

        left, top, right, bottom = box
        if right - left != bottom - top:
            raise SystemExit(f"{slug}: crop box is not square: {box}")

        image = Image.open(source).convert("RGB")
        w, h = image.size
        if right > w or bottom > h:
            raise SystemExit(f"{slug}: crop box {box} exceeds {name} ({w}x{h})")

        face = image.crop(box)
        side = face.size[0]
        if side > MAX:
            face = face.resize((MAX, MAX), Image.LANCZOS)

        out = PORTRAITS / f"avatar-{slug}.png"
        face.save(out, optimize=True)

        note = "" if side >= 192 else "  <- soft above ~64pt on a 3x screen; a larger source would help"
        print(f"  {slug:8} {w}x{h} -> {face.size[0]}px  {out.name}{note}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
