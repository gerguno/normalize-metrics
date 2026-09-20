#!/usr/bin/env python3
"""Extract vertical metrics that drive CSS button centering.

Cap-center offset is ((ascent − H.yMax) − |descent|) / 2, scaled to 1000 UPM.
Negative = the word sits high in a button with equal padding-block.
On macOS, CSS uses hhea for the content area.
"""

from __future__ import annotations

import json
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTCollection, TTFont

FONTS = [
    ("ABC Areal", "/Users/olesgergun/Library/Fonts/ABCAreal-Regular.ttf", "good"),
    ("ABC Camera", "/Users/olesgergun/Library/Fonts/ABCCamera-Regular-Trial.otf", "good"),
    ("ABC Walter", "/Users/olesgergun/Library/Fonts/ABCWalter-AlteNormalgrotesk.otf", "good"),
    (
        "Inter 3.3",
        "/Users/olesgergun/Local Sites/taubman-college/app/public/wp-content/plugins/gravityforms/fonts/inter-regular-webfont.woff",
        "good",
    ),
    ("Helvetica Neue", "/System/Library/Fonts/HelveticaNeue.ttc", "good"),
    ("Roboto", "/Library/Fonts/Roboto-Regular.ttf", "good"),
    ("Neue Haas Unica", "/Library/Fonts/NeueHaasUnicaPro-Regular.ttf", "good"),
    ("KTF Techne", "/Users/olesgergun/Library/Fonts/KTFTechne-Regular.otf", "good"),
    ("Akkurat LL", "/Users/olesgergun/Library/Fonts/AkkuratLL-Regular.otf", "bad"),
    ("Unica77 LL", "/Users/olesgergun/Library/Fonts/Unica77LL-Regular.otf", "bad"),
    ("NeuzeitGroT", "/Library/Fonts/NeuzeGroTReg.ttf", "bad"),
    ("Univers LT CYR", "/Users/olesgergun/Library/Fonts/UniversLTCYR-55Roman.otf", "bad"),
    ("DIN Condensed", "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf", "bad"),
]

GLYPH_CANDIDATES = {
    "H": ["H", "uni0048"],
    "O": ["O", "uni004F"],
    "x": ["x", "uni0078"],
    "p": ["p", "uni0070"],
    "g": ["g", "uni0067"],
    "y": ["y", "uni0079"],
    "Adieresis": ["Adieresis", "A-dieresis", "uni00C4", "Aumlaut"],
    "Aring": ["Aring", "A-ring", "uni00C5"],
}

UNICODES = {
    "H": 0x48,
    "O": 0x4F,
    "x": 0x78,
    "p": 0x70,
    "g": 0x67,
    "y": 0x79,
    "Adieresis": 0xC4,
    "Aring": 0xC5,
}


def open_font(path: str) -> TTFont:
    if path.lower().endswith(".ttc"):
        ttc = TTCollection(path)
        for font in ttc.fonts:
            sub = font["name"].getDebugName(2) or ""
            ps = font["name"].getDebugName(6) or ""
            if sub in ("Regular", "Roman") or ps.endswith("-Regular"):
                return font
        return ttc.fonts[0]
    return TTFont(path)


def glyph_bounds(font: TTFont, names: list[str]):
    glyf = font.get("glyf")
    cmap = font.getBestCmap() or {}
    glyph_set = font.getGlyphSet()
    for name in names:
        if glyf is not None and name in font.getGlyphOrder():
            g = glyf[name]
            if g.isComposite():
                g.recalcBounds(glyf)
            if g.numberOfContours != 0:
                return {"name": name, "yMin": int(g.yMin), "yMax": int(g.yMax)}
        if name in glyph_set:
            try:
                pen = BoundsPen(glyph_set)
                glyph_set[name].draw(pen)
                if pen.bounds:
                    _x0, y0, _x1, y1 = pen.bounds
                    return {"name": name, "yMin": round(y0), "yMax": round(y1)}
            except Exception:
                pass
    for logical, nlist in GLYPH_CANDIDATES.items():
        if names == nlist:
            u = UNICODES.get(logical)
            if u and cmap.get(u):
                return glyph_bounds(font, [cmap[u]])
    return None


def pack(asc, desc, gap, actual_cap, actual_xh, desc_positive=False):
    d = desc if desc_positive else -desc
    content = asc + d
    above_caps = None if actual_cap is None else asc - actual_cap
    offset = None if actual_cap is None else ((asc - actual_cap) - d) / 2
    x_offset = None if actual_xh is None else ((asc - actual_xh) - d) / 2
    return {
        "ascent": asc,
        "descent": -d if desc_positive else desc,
        "lineGap": gap,
        "contentHeight": content,
        "aboveCaps": None if above_caps is None else round(above_caps, 1),
        "belowBaseline": round(d, 1),
        "capCenterOffset": None if offset is None else round(offset, 1),
        "xCenterOffset": None if x_offset is None else round(x_offset, 1),
    }


def inspect(label: str, path: str, group: str) -> dict:
    font = open_font(path)
    name = font["name"]
    head = font["head"]
    hhea = font["hhea"]
    os2 = font["OS/2"]
    upm = head.unitsPerEm

    glyphs = {key: glyph_bounds(font, names) for key, names in GLYPH_CANDIDATES.items()}
    actual_cap = glyphs["H"]["yMax"] if glyphs["H"] else getattr(os2, "sCapHeight", None)
    actual_xh = glyphs["x"]["yMax"] if glyphs["x"] else getattr(os2, "sxHeight", None)

    hhea_pack = pack(hhea.ascent, hhea.descent, hhea.lineGap, actual_cap, actual_xh)
    typo_pack = pack(os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap, actual_cap, actual_xh)
    win_pack = pack(os2.usWinAscent, os2.usWinDescent, 0, actual_cap, actual_xh, desc_positive=True)

    def per_mille(v):
        return None if v is None else round(v / upm * 1000, 1)

    offset = hhea_pack["capCenterOffset"]
    return {
        "label": label,
        "group": group,
        "file": os.path.basename(path),
        "family": name.getDebugName(1),
        "subfamily": name.getDebugName(2),
        "postscript": name.getDebugName(6),
        "version": name.getDebugName(5),
        "upm": upm,
        "useTypoMetrics": bool(os2.fsSelection & (1 << 7)),
        "sCapHeight": getattr(os2, "sCapHeight", None),
        "actualCapH": actual_cap,
        "actualX": actual_xh,
        "glyphs": glyphs,
        "hhea": hhea_pack,
        "typo": typo_pack,
        "win": win_pack,
        "capOffsetPx_32": None if offset is None else round(offset / upm * 32, 3),
        "perMille": {
            "aboveCaps": per_mille(hhea_pack["aboveCaps"]),
            "belowBaseline": per_mille(hhea_pack["belowBaseline"]),
            "capCenterOffset": per_mille(offset),
            "typoOffset": per_mille(typo_pack["capCenterOffset"]),
            "winOffset": per_mille(win_pack["capCenterOffset"]),
        },
    }


def main():
    rows = []
    for label, path, group in FONTS:
        try:
            rows.append(inspect(label, path, group))
        except Exception as e:
            rows.append({"label": label, "group": group, "error": str(e), "file": path})

    print(
        f"{'font':22} grp  upm  useTypo  hhea A/D/G          above  below   off‰   px@32"
    )
    for row in rows:
        if "error" in row:
            print(f"{row['label']:22} ERROR {row['error']}")
            continue
        h = row["hhea"]
        print(
            f"{row['label']:22} {row['group']:4} {row['upm']:4} "
            f"{str(row['useTypoMetrics']):5}  "
            f"{h['ascent']:5}/{h['descent']:4}/{h['lineGap']:<4}  "
            f"{row['perMille']['aboveCaps']:6.1f} {row['perMille']['belowBaseline']:6.1f} "
            f"{row['perMille']['capCenterOffset']:6.1f} {row['capOffsetPx_32']:6.2f}"
        )

    if "--json" in sys.argv:
        print(json.dumps(rows, indent=2))


if __name__ == "__main__":
    main()
