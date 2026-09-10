#!/usr/bin/env python3
"""Make the welcome screen's hero image.

    python designs/make-hero.py

Reads   apps/native/assets/images/icon.png          (1024px ink drawing of Musashi)
Writes  apps/native/assets/images/hero-musashi.jpg

The drawing is black ink on white. The app is ink-dark only, so it is
inverted to light lines on ink, tinted with the palette's indigo-cast white
(a duotone, so nothing off-palette appears), and faded into ink.base at the
bottom. The fade is baked in so the screen needs no gradient library and the
image meets the page with no seam: ink.base is the only ground the app has.

The icon is the only image in the repo large enough to fill a phone's
width. It is Vagabond artwork (Takehiko Inoue), the same open risk as the
icon itself. Replacing the icon means re-running this with the new source.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "apps" / "native" / "assets" / "images"
SOURCE = IMAGES / "icon.png"
OUT = IMAGES / "hero-musashi.jpg"

# apps/native/theme/tokens.ts
INK_BASE = (0x10, 0x10, 0x12)  # ink.base
LINE = (0xE4, 0xE2, 0xF4)  # between text.secondary and text.primary

# The source has a hairline rule along its top edge; inverted it would be a
# bright line under the status bar.
TRIM_TOP = 10

# Fractions of the output height.
FADE_START = 0.52  # the bottom fade begins here...
TOP_SHADE = 0.14  # ...and the top is darkened this far down, under the clock


def main() -> int:
    if not SOURCE.exists():
        raise SystemExit(f"{SOURCE} not found")

    image = Image.open(SOURCE).convert("L")
    w, h = image.size
    image = image.crop((0, TRIM_TOP, w, h))
    w, h = image.size

    # Ink becomes light, paper becomes the app's ground.
    inverted = ImageOps.invert(image)
    toned = ImageOps.colorize(inverted, black=INK_BASE, white=LINE).convert("RGB")

    # Knock the lines back a little so the drawing is atmosphere behind the
    # title, not a second headline.
    ground = Image.new("RGB", (w, h), INK_BASE)
    toned = Image.blend(ground, toned, 0.82)

    # Alpha mask: opaque in the middle, fading to ink at the bottom and
    # shaded at the top.
    mask = Image.new("L", (w, h), 255)
    px = mask.load()
    fade_from = int(h * FADE_START)
    shade_to = int(h * TOP_SHADE)
    for y in range(h):
        if y >= fade_from:
            t = (y - fade_from) / (h - fade_from)
            a = int(255 * (1 - t) ** 1.6)
        elif y < shade_to:
            t = y / shade_to
            a = int(255 * (0.55 + 0.45 * t))
        else:
            a = 255
        for x in range(w):
            px[x, y] = a

    hero = Image.composite(toned, ground, mask)
    hero.save(OUT, "JPEG", quality=84, optimize=True, progressive=True)

    print(f"  {SOURCE.name} {w}x{h + TRIM_TOP} -> {OUT.name} {hero.size[0]}x{hero.size[1]}, "
          f"{OUT.stat().st_size // 1024}KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
