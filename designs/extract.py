#!/usr/bin/env python3
"""Turn the standalone design exports into readable per-screen files.

    python designs/extract.py

Reads   designs/raw/*.html   (gitignored: ~27MB of bundler output)
Writes  designs/extracted/   (gitignored: regenerate rather than commit)

The raw exports are Claude Design canvas documents: a single HTML file
holding a JSON-encoded template plus a manifest of gzipped, base64 assets.
Opening one in an editor is useless — the markup is one 13MB line — so this
splits it into one file per screen, which is what an agent can actually read
before building that screen.

The app export lays its screens out as <x-import> artboards, one per phone
frame. The web export is a single flowing document with no artboards, so it
is written whole and sectioned by its headings.

Each extracted file carries the screen's visible text at the top, then its
markup. The text is there because it is what you check copy against; the
markup is there because it is the only place the real hex values live.
"""

from __future__ import annotations

import html as html_lib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT / "extracted"


def decode_template(path: Path) -> str:
    """Pull the JSON-encoded HTML template out of a canvas export."""
    source = path.read_text(encoding="utf-8")
    match = re.search(
        r'<script type="__bundler/template"[^>]*>(.*?)</script>', source, re.S
    )
    if not match:
        raise SystemExit(f"{path.name}: no bundler template found")
    return json.loads(match.group(1))


def visible_text(markup: str) -> str:
    """Strip tags, keeping the reading order."""
    text = html_lib.unescape(re.sub(r"<[^>]+>", "\n", markup))
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def screen_title(text: str, fallback: str) -> str:
    """First substantial line of copy, used to name the file."""
    for line in text.split("\n"):
        if 3 < len(line) < 60 and not line.startswith("@"):
            return line
    return fallback


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (slug or "screen")[:48]


def write_screen(path: Path, title: str, text: str, markup: str) -> None:
    path.write_text(
        f"# {title}\n\n"
        "## Visible copy\n\n"
        f"{text}\n\n"
        "## Markup\n\n"
        "The only place the real hex values, sizes and spacing live. Read this,\n"
        "not the token package, when building this screen.\n\n"
        "```html\n"
        f"{markup}\n"
        "```\n",
        encoding="utf-8",
    )


def extract_artboards(markup: str, prefix: str) -> int:
    """Split an export that uses <x-import> frames — one per screen."""
    body = markup[markup.find("<body") :]
    parts = re.split(r"(?=<x-import )", body)[1:]

    for index, part in enumerate(parts):
        text = visible_text(part)
        title = screen_title(text, f"screen {index:02d}")
        name = f"{prefix}-{index:02d}-{slugify(title)}.md"
        write_screen(OUT / name, title, text, part)

    return len(parts)


def extract_whole(markup: str, prefix: str) -> int:
    """Write an export with no artboards as one document."""
    body = markup[markup.find("<body") :]
    text = visible_text(body)
    write_screen(OUT / f"{prefix}-00-full.md", f"{prefix} (full document)", text, body)
    return 1


def report_values(markup: str, label: str) -> None:
    """Frequency counts, printed rather than written to a file.

    Deliberately not saved as a CENSUS.md. A frequency count is useful for
    noticing what is common and dangerous as a substitute for opening the
    screen you are building: a count cannot tell you that the colour used on
    five screens is missing from your tokens, because it looks rare.
    """
    colours = Counter(m.upper() for m in re.findall(r"#([0-9a-fA-F]{6})\b", markup))
    sizes = Counter(re.findall(r"font-size:\s*(\d+)px", markup))
    radii = Counter(re.findall(r"border-radius:\s*(\d+)px", markup))

    print(f"  {label}: {len(colours)} colours, {len(sizes)} type sizes, {len(radii)} radii")
    print(f"    most used colours: {', '.join('#' + c for c, _ in colours.most_common(6))}")


def main() -> int:
    if not RAW.exists():
        raise SystemExit("designs/raw/ not found — put the standalone exports there")

    OUT.mkdir(exist_ok=True)
    for stale in OUT.glob("*.md"):
        stale.unlink()

    total = 0
    for path in sorted(RAW.glob("*.html")):
        prefix = path.stem
        markup = decode_template(path)
        body = markup[markup.find("<body") :]

        if "<x-import" in body:
            count = extract_artboards(markup, prefix)
        else:
            count = extract_whole(markup, prefix)

        total += count
        print(f"{path.name}: {count} screen(s) -> designs/extracted/{prefix}-*.md")
        report_values(body, prefix)

    print(f"\n{total} file(s) written to designs/extracted/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
