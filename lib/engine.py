#!/usr/bin/env python3
"""Rewrite vertical metrics per ADR 0001 and 0003. Outlines stay unchanged."""

from __future__ import annotations

import json
import sys
from collections.abc import Callable
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTCollection, TTFont

USE_TYPO_METRICS = 1 << 7
Progress = Callable[[int, str], None]


def emit(progress: Progress | None, percent: int, phase: str) -> None:
    if progress:
        progress(min(100, max(0, percent)), phase)


def skip_reason(path: str, font: TTFont | None = None) -> str | None:
    if path.lower().endswith(".ttc"):
        return "TTC collections are skipped in v1"
    opened = font
    close = False
    if opened is None:
        opened = TTFont(path, lazy=True)
        close = True
    try:
        if "fvar" in opened:
            return "variable fonts are skipped in v1"
    finally:
        if close:
            opened.close()
    return None


def open_font(path: str) -> TTFont:
    if path.lower().endswith(".ttc"):
        ttc = TTCollection(path)
        for font in ttc.fonts:
            sub = font["name"].getDebugName(2) or ""
            if sub in ("Regular", "Roman"):
                return font
        return ttc.fonts[0]
    return TTFont(path)


def glyph_y(font: TTFont, names: list[str]) -> tuple[int, int] | None:
    gs = font.getGlyphSet()
    for name in names:
        if name not in gs:
            continue
        pen = BoundsPen(gs)
        try:
            gs[name].draw(pen)
        except Exception:
            continue
        if pen.bounds:
            return round(pen.bounds[1]), round(pen.bounds[3])
    return None


def measure_bbox(font: TTFont, progress: Progress | None = None) -> tuple[int, int]:
    gs = font.getGlyphSet()
    y_min, y_max = font["head"].yMin, font["head"].yMax
    names = font.getGlyphOrder()
    total = max(len(names), 1)
    step = max(1, total // 40)
    for index, name in enumerate(names):
        if name not in gs:
            continue
        pen = BoundsPen(gs)
        try:
            gs[name].draw(pen)
        except Exception:
            continue
        if not pen.bounds:
            continue
        y_min = min(y_min, round(pen.bounds[1]))
        y_max = max(y_max, round(pen.bounds[3]))
        if progress and index % step == 0:
            emit(progress, 8 + int(74 * index / total), "analyzing")
    return y_min, y_max


def units_percent(units: float, upm: int) -> float:
    """CSS ascent-override / descent-override: |units| as a percent of the em."""
    if upm <= 0:
        return 0.0
    return round(abs(units) / upm * 100, 1)


def snapshot(font: TTFont, cap: int, x_height: int) -> dict:
    upm = font["head"].unitsPerEm
    hhea = font["hhea"]
    above = hhea.ascent - cap
    below = -hhea.descent
    offset = (above - below) / 2
    content = hhea.ascent + below
    imbalance = abs(above - below) / content if content else 1
    offset_pm = offset / upm * 1000
    centered = max(0, min(100, round((1 - imbalance) * 100)))
    grade = "Great" if abs(offset_pm) < 40 else "Bad"
    return {
        "upm": upm,
        "ascent": hhea.ascent,
        "descent": hhea.descent,
        "lineGap": hhea.lineGap,
        "cap": cap,
        "xHeight": x_height,
        "above": round(above / upm * 1000, 1),
        "below": round(below / upm * 1000, 1),
        "offset": round(offset_pm, 1),
        "centered": centered,
        "ascentOverride": units_percent(hhea.ascent, upm),
        "descentOverride": units_percent(hhea.descent, upm),
        "grade": grade,
    }


ITALIC = 1 << 0
OBLIQUE = 1 << 9


def face_style(font: TTFont) -> str:
    selection = int(getattr(font["OS/2"], "fsSelection", 0))
    if selection & ITALIC:
        return "italic"
    if selection & OBLIQUE:
        return "oblique"
    subfamily = (font["name"].getDebugName(2) or "").lower()
    if "italic" in subfamily:
        return "italic"
    if "oblique" in subfamily:
        return "oblique"
    return "normal"


def face_weight(font: TTFont) -> int:
    weight = int(getattr(font["OS/2"], "usWeightClass", 400) or 400)
    return weight


def set_name_suffix(font: TTFont, suffix: str = " Normalized") -> None:
    name = font["name"]
    for rec in list(name.names):
        if rec.nameID not in (1, 4, 6):
            continue
        try:
            text = rec.toUnicode()
        except Exception:
            continue
        if rec.nameID == 6:
            new = text if "Normalized" in text else f"{text}-Normalized"
        else:
            new = text if suffix.strip() in text else text + suffix
        name.setName(new, rec.nameID, rec.platformID, rec.platEncID, rec.langID)


def target_line_box(
    cap: int,
    extra: int,
    old_ascent: int,
    old_descent: int,
    old_line_gap: int,
) -> tuple[int, int, int]:
    """ADR 0003: center in the old content box when it already fits.

    Do not invent lineGap. Spend existing table gap only when content must grow
    into it. Grow used height only when even that is not enough.
    """
    extra = int(round(extra))
    needed = cap + 2 * extra
    old_content = old_ascent + abs(old_descent)
    used_before = old_content + old_line_gap
    if needed <= old_content:
        pad = old_content - cap
        above = pad // 2
        below = pad - above
        return cap + above, -below, old_line_gap
    if needed <= used_before:
        return cap + extra, -extra, used_before - needed
    return cap + extra, -extra, 0


def tables_off(
    font: TTFont,
    ascent: int,
    descent: int,
    win_ascent: int,
    win_descent: int,
    line_gap: int,
) -> bool:
    hhea = font["hhea"]
    os2 = font["OS/2"]
    return not (
        hhea.ascent == ascent
        and hhea.descent == descent
        and hhea.lineGap == line_gap
        and os2.sTypoAscender == ascent
        and os2.sTypoDescender == descent
        and os2.sTypoLineGap == line_gap
        and bool(os2.fsSelection & USE_TYPO_METRICS)
        and os2.usWinAscent == win_ascent
        and os2.usWinDescent == win_descent
    )


def normalize(font: TTFont, progress: Progress | None = None) -> dict:
    emit(progress, 6, "analyzing")
    h = glyph_y(font, ["H", "uni0048"])
    x = glyph_y(font, ["x", "uni0078"])
    adieresis = glyph_y(font, ["Adieresis", "uni00C4"])
    p = glyph_y(font, ["p", "uni0070"])
    g = glyph_y(font, ["g", "uni0067"])
    y = glyph_y(font, ["y", "uni0079"])
    os2 = font["OS/2"]
    cap = h[1] if h else getattr(os2, "sCapHeight", None) or 700
    ex = x[1] if x else getattr(os2, "sxHeight", None) or round(cap * 0.7)
    bbox_y_min, bbox_y_max = measure_bbox(font, progress)
    mins = [bbox_y_min, font["head"].yMin]
    for pair in (p, g, y):
        if pair:
            mins.append(pair[0])
    descender_depth = -min(mins)
    accent_typical = max(0, adieresis[1] - cap) if adieresis else 0
    extra = max(descender_depth, accent_typical, 0)
    hhea = font["hhea"]
    ascent, descent, line_gap = target_line_box(
        cap, extra, hhea.ascent, hhea.descent, hhea.lineGap
    )
    win_ascent = max(ascent, bbox_y_max, 0)
    win_descent = max(-descent, -bbox_y_min, 0)
    off = tables_off(font, ascent, descent, win_ascent, win_descent, line_gap)
    before = snapshot(font, cap, ex)

    emit(progress, 85, "rewriting")
    font["hhea"].ascent = ascent
    font["hhea"].descent = descent
    font["hhea"].lineGap = line_gap
    os2.sTypoAscender = ascent
    os2.sTypoDescender = descent
    os2.sTypoLineGap = line_gap
    os2.fsSelection |= USE_TYPO_METRICS
    os2.usWinAscent = win_ascent
    os2.usWinDescent = win_descent
    if os2.version < 4:
        os2.version = 4
    os2.sCapHeight = cap
    os2.sxHeight = ex
    set_name_suffix(font)

    after = snapshot(font, cap, ex)
    family = font["name"].getDebugName(1) or "Font"
    return {
        "family": family.replace(" Normalized", ""),
        "weight": face_weight(font),
        "style": face_style(font),
        "before": before,
        "after": after,
        "off": off,
    }


def save_font(font: TTFont, dest: str) -> str:
    flavor = font.flavor
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    if flavor in ("woff", "woff2"):
        try:
            font.flavor = flavor
            font.save(dest)
        except Exception:
            font.flavor = None
            dest = str(Path(dest).with_suffix(".otf" if "CFF " in font else ".ttf"))
            font.save(dest)
    else:
        font.save(dest)
    return dest


def parse_args(argv: list[str]) -> tuple[bool, bool, bool, list[str]]:
    inspect = False
    progress = False
    skip_if_good = False
    positional: list[str] = []
    for arg in argv[1:]:
        if arg == "--inspect":
            inspect = True
        elif arg == "--progress":
            progress = True
        elif arg == "--skip-if-good":
            skip_if_good = True
        elif arg in ("-h", "--help"):
            print(
                "usage: engine.py [--inspect] [--progress] [--skip-if-good] <input> [output]",
                file=sys.stderr,
            )
            raise SystemExit(0)
        else:
            positional.append(arg)
    return inspect, progress, skip_if_good, positional


def make_progress(enabled: bool) -> Progress | None:
    if not enabled:
        return None

    def progress(percent: int, phase: str) -> None:
        print(json.dumps({"event": "progress", "percent": percent, "phase": phase}), file=sys.stderr, flush=True)

    return progress


def main() -> None:
    inspect, want_progress, skip_if_good, positional = parse_args(sys.argv)
    if inspect:
        if len(positional) != 1:
            print("usage: engine.py --inspect <input>", file=sys.stderr)
            raise SystemExit(2)
        src, dest = positional[0], None
    elif len(positional) == 2:
        src, dest = positional
    else:
        print("usage: engine.py <input> <output>", file=sys.stderr)
        raise SystemExit(2)

    progress = make_progress(want_progress)
    emit(progress, 2, "analyzing")
    reason = skip_reason(src)
    if reason:
        print(json.dumps({"skip": reason}))
        return

    font = open_font(src)
    reason = skip_reason(src, font)
    if reason:
        print(json.dumps({"skip": reason}))
        return

    result = normalize(font, progress)
    already_good = not result["off"]
    if dest and not inspect and not (skip_if_good and already_good):
        emit(progress, 90, "writing")
        result["output"] = save_font(font, dest)
    emit(progress, 100, "done")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
