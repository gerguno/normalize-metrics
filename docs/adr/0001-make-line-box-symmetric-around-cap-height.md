---
status: Accepted
owner: Oles
reviewers: ["Oles"]
updated_at: "2026-09-18"
feature_size: S
ticket: ""
---

# 0001 — Make the line box symmetric around cap-height

- **Status:** Accepted
- **Date:** 2026-09-18
- **Deciders:** Oles

## Context

There is no `spec.md` yet. Architecture is in `docs/sad.md`. This ADR was reconstructed from the button-metrics research in `docs/button-vertical-metrics.html` and `docs/extract_vertical_metrics.py`.

A Next.js tool will accept a font file, preview one word in a button with equal `padding-block`, then **Normalize** must rewrite **vertical metrics only** so that word sits optically in the middle, and emit a downloadable font. CSS on macOS sizes that button’s line box from `hhea` ascent + descent, not from the ink of H. Fonts that look off pin ascent to cap-height and dump the rest of the em under the baseline. The decision is which target box we write into `hhea` / OS/2 typo / Win metrics.

## Decision drivers

- Preview is a **one-word button** with equal `padding-block` (the research case). Cap-height to baseline is the optical mass, not x-height and not the full accent stack.
- Outlines, UPM, and horizontal metrics stay untouched. Only vertical metric tables change.
- Descenders (`p`, `g`, `y`) must not clip. Accents must not clip on Windows GDI (Win ascent/descent).
- macOS / Safari / Chrome on Mac read `hhea`. Windows DirectWrite reads typo only if `USE_TYPO_METRICS` is set; otherwise Win. The three sets must not fight.
- Line box should not become as tall as the most extreme glyph (`Aring`, stacked marks) unless that is required to protect descenders. Button chrome should stay tight.
- Reversible in the engineering sense (re-run with a different extra rule), but every already-downloaded font is a one-way artifact for the user.

## Considered options

1. **Full-bbox extra** — `extra = max(font.yMax − cap, −font.yMin)`; `ascent = cap + extra`; `descent = −extra`. Cap-center offset is 0 and every outline sits inside hhea. Line-height grows to the tallest diacritic on every button, including `SAVE` with no accents.
2. **Descender-symmetric extra (recommended)** — `extra = max(descender_depth, typical_accent_over_cap)` where typical accent is `Adieresis.yMax − cap` (umlaut, not ring). `ascent = cap + extra`; `descent = −extra`. hhea/typo are cap-centered. Win metrics still envelope the full glyph bbox so Windows will not clip `Aring`. Buttons stay closer to ABC Areal / KTF Techne.
3. **Keep em-sum = UPM** — pack `ascent + |descent| = unitsPerEm` and only slide the baseline. Impossible to both fit real descenders and center H unless we clip or shrink outlines. Ruled out as a default; it is the tradition that produced DIN / Univers.

## Decision outcome

**Chosen:** Option 2 — descender-symmetric extra, Win bbox envelope, typo = hhea, `USE_TYPO_METRICS` on, `lineGap = 0`. Signed off 2026-09-18.

This is the smallest change that drives cap-center offset to ~0 on the macOS path the preview uses, without inflating every button to `Aring` height. Option 1 is the fallback if overflow-hidden buttons clip umlauts in real UI. Option 3 is what we are normalizing *away* from.

### Algorithm

Inputs: a single static TTF/OTF/WOFF/WOFF2 face (variable fonts and TTC: v1 reads Regular or the first face only).

1. **Parse** with fontTools. Refuse empty/corrupt files.
2. **Measure ink** (not the old metric tables):
   - `cap = H.yMax` (fallback `OS/2.sCapHeight`)
   - `ex = x.yMax` (fallback `OS/2.sxHeight`)
   - `descender_depth = −min(yMin of p, g, y, and `head.yMin`)`
   - `accent_typical = max(0, Adieresis.yMax − cap)` (0 if the glyph is missing)
   - `bbox_yMax`, `bbox_yMin` = max/min y of every glyph outline (and `head`)
3. **Target line box** (the CSS content area):
   - `extra = max(descender_depth, accent_typical)`
   - `ascent = round(cap + extra)`
   - `descent = −round(extra)`  (hhea/typo descent is negative)
   - Cap-center offset = `((ascent − cap) − |descent|) / 2` → 0 by construction
4. **Write tables** (outlines unchanged):
   - `hhea.ascent/descent/lineGap = ascent, descent, 0`
   - `OS/2.sTypoAscender/Descender/LineGap = ascent, descent, 0`
   - `OS/2.fsSelection |= USE_TYPO_METRICS` (bit 7)
   - `OS/2.usWinAscent = max(ascent, bbox_yMax)` (positive)
   - `OS/2.usWinDescent = max(|descent|, −bbox_yMin)` (positive)
   - `OS/2.sCapHeight = cap`, `OS/2.sxHeight = ex`
5. **Do not write:** glyph outlines, UPM, `hmtx`, kern, GPOS/GSUB, names beyond a optional `Name + " Normalized"` suffix, `head.yMin/yMax` (recalc from glyphs if the compiler already does).
6. **Preview** loads the original and the rewritten bytes as two `@font-face` families on the same button (`padding-block` equal, `line-height: normal` or `1`). The illustration is the proof; the file is the product.
7. **Download** the rewritten SFNT (OTF/TTF matching input flavor; WOFF unpack → pack).

Worked check against the research set (hhea path, UPM 1000 faces):

| Font | cap | extra | new A / D | old offset | new offset |
| --- | ---: | ---: | --- | ---: | ---: |
| ABC Areal | 716 | max(238, 155) = 238 | 954 / −238 | −24‰ | 0 |
| KTF Techne | 722 | max(250, 177) = 250 | 972 / −250 | −24.5‰ | 0 |
| Akkurat LL | 709 | max(299, 177) = 299 | 1008 / −299 | −94.5‰ | 0 |
| DIN Condensed | 712 | max(312, 146) = 312 | 1024 / −312 | −144‰ | 0 |

`head.yMin` is the conservative descender (includes commas, cedillas). Using only `p/g/y` would tighten extra slightly; v1 prefers `head.yMin` so we never clip.

```text
cap     = ink(H).yMax
extra   = max( −bbox.yMin,  ink(Adieresis).yMax − cap,  0 )
ascent  = cap + extra
descent = −extra
winAscent  = max(ascent,  bbox.yMax)
winDescent = max(extra,  −bbox.yMin)
typo       = hhea
USE_TYPO_METRICS = 1
lineGap    = 0
outlines   = unchanged
```

## Consequences

**Positive**
- Equal `padding-block` on a one-word button centers H, for both Areal-class and DIN-class files.
- One formula, no per-family magic numbers.
- Win metrics stay a clip shield; we do not invent a third vertical story.
- Matches the research definition of cap-center offset.

**Negative**
- Line box usually grows (`DIN` 1000 → ~1336 UPM units). The button gets taller unless the UI also sets `text-box-trim`. That is honest: the cellar was always there optically, we moved half of it above the caps.
- Umlauts taller than `Adieresis` (e.g. `Aring`) can paint above the hhea box. Fine unless the button uses `overflow: hidden`.
- `head.yMin` can be pessimistic (a single comma or Vietnamese hook inflates extra for the whole face).
- Editing a licensed font and redistributing the download may violate the EULA. The app must say that; it does not legalize the file.

**Neutral**
- Switching to Option 1 later is a one-line change to `extra`. Files already downloaded keep the old extra.
- Variable fonts, TTC, color-COLR, and vertical `vhea` are out of v1.
- CSS `text-box: trim-both cap alphabetic` remains the no-file-edit alternative; this product exists for people who need the font itself fixed.

## Links

- Related ADR: [[0002-ship-gui-and-cli-on-one-engine]]
- Research (replaces missing spec): [[../button-vertical-metrics.html]]
- Extractor: [[../extract_vertical_metrics.py]]
- Spec: none yet — no `docs/spec.md`
- SAD: [[../sad.md]] §4, §9
