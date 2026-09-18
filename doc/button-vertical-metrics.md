# Equal padding-block does not center ink

CSS pads the font’s **line box** (`hhea` ascent + descent on macOS), not the visible letters. Fonts that look centered in a one-word button keep empty space above cap-height close to empty space below the baseline. Fonts that look off pin ascent to the top of H and leave ~25–29% of the em hanging unused under the baseline.

Cap-center offset is `((ascent − H.yMax) − |descent|) / 2`, scaled to 1000 units per em. Zero means the vertical center of H sits on the center of the CSS content area. Negative means the word sits high in the button.

Measured 18 Sep 2026 from compiled Regular faces on this machine via fontTools (DIN Condensed Bold; Inter 3.3 subset). macOS `hhea` path.

| Group | Mean \|cap-center offset\| |
| --- | ---: |
| Looks centered | 23‰ |
| Looks off | 122‰ |
| Ratio | 5.3× |

DIN Condensed has **0 units** of space above H: `hhea.ascent` equals cap-height.

## Space above H vs space below baseline

Per mille of em, using `hhea` (Core Text / Safari / Chrome on macOS).

| Font | Above H | Below baseline | Offset | Imbalance of line box | Offset at 32px |
| --- | ---: | ---: | ---: | ---: | ---: |
| ABC Areal | 162‰ | 210‰ | −24‰ | 4.4% | −0.77 px |
| ABC Camera | 290‰ | 312‰ | −11‰ | 1.7% | −0.35 px |
| ABC Walter | 271‰ | 317‰ | −23‰ | 3.6% | −0.74 px |
| Inter 3.3 | 364‰ | 405‰ | −21‰ | 2.8% | −0.66 px |
| Helvetica Neue | 238‰ | 213‰ | +12.5‰ | 2.1% | +0.40 px |
| Roboto | 217‰ | 244‰ | −14‰ | 2.3% | −0.44 px |
| Neue Haas Unica | 454‰ | 340‰ | +57‰ | 7.6% | +1.82 px |
| Akkurat LL | 51‰ | 240‰ | −94.5‰ | 18.9% | −3.02 px |
| Unica77 LL | 24‰ | 250‰ | −113‰ | 22.6% | −3.62 px |
| Univers LT CYR | 2‰ | 276‰ | −137‰ | 27.4% | −4.38 px |
| DIN Condensed | 0‰ | 288‰ | −144‰ | 28.8% | −4.61 px |

At a typical 32px button label, Areal is 0.8px off; DIN is 4.6px off — most of a 12px `padding-block` step.

NeuzeitGroT is omitted: `/Library/Fonts/NeuzeGroT*.ttf` are 0-byte stubs dated 1996. The family is a 1960s Berthold grotesque in the same metric tradition as Univers, so it is expected to land in the off group.

## Same button, two metric systems

**ABC Areal:** `hhea` ascent 878, H top 716, descent −210. Leftover is 162 above vs 210 below, so equal padding looks centered.

**DIN Condensed:** `hhea` ascent 712, H top 712, descent −288. Caps touch the top of the em square. Almost 29% of the line box is empty cellar under a word like SAVE that has no descenders. Equal padding wraps that cellar, so the word reads high.

### UI / display metrics

`hhea` ascent sits well above cap-height so umlauts, rings, and a bit of breathing room live **inside** the line box. Descent is sized to roughly match that leftover. Content height is often 1088–1506‰ of em — they do not force ascent + descent = UPM.

ABC Areal, ABC Camera (`hhea`/`win`), ABC Walter (`hhea`/`win`), Inter 3 `hhea`, Helvetica Neue, Roboto `hhea`, Neue Haas Unica `hhea`.

### Em-square / metal-type metrics

Typo and `hhea` are packed into the em: ascent + |descent| = 1000. Ascent is set near cap-height (Univers 724 vs H 722; DIN 712 = H 712). The remaining ~280 units all go under the baseline. Accents stick out of the typo box; Win metrics are enlarged only so Windows will not clip them.

Akkurat LL, Unica77 LL, Univers LT CYR, DIN Condensed. Lineto, Linotype, and DIN-style families inherited this from metal / early PostScript practice.

## Platform split

macOS Core Text uses `hhea`. Windows DirectWrite uses OS/2 typo metrics only if `USE_TYPO_METRICS` is set; otherwise Win ascent / descent. Most of these files leave that bit off, so Mac and Windows can disagree.

| Font | Mac hhea offset | Typo offset | Win offset | Typo fits em | Ascent ≈ cap |
| --- | ---: | ---: | ---: | --- | --- |
| ABC Areal | −24‰ | −24‰ | −12‰ | no | no |
| ABC Camera | −11‰ | −49‰ | −11‰ | yes | no |
| ABC Walter | −23‰ | −66‰ | −23‰ | yes | no |
| Inter 3.3 | −21‰ | −64‰ | −21‰ | yes | no |
| Helvetica Neue | +13‰ | +13‰ | +13‰ | no | no |
| Roboto | −14‰ | −106‰ | −5‰ | yes | no |
| Neue Haas Unica | +57‰ | −92‰ | +57‰ | yes | no |
| Akkurat LL | −94.5‰ | −94.5‰ | −94.5‰ | yes | no |
| Unica77 LL | −113‰ | −113‰ | −113‰ | yes | no |
| Univers LT CYR | −137‰ | −137‰ | +64‰ | yes | yes |
| DIN Condensed | −144‰ | −144‰ | −13‰ | yes | yes |

Univers looks high on a Mac and slightly low on Windows. DIN looks broken on a Mac and almost as good as Areal on Windows Win metrics. Inter 3 looks centered on Mac because `hhea` is the large Win box; its typo pair still fits the em and would be −64‰ if a browser honored it.

## Compiled metrics used for the line box

| Font | UPM | hhea A / D / G | H yMax | Above H | Below | Imbalance | USE_TYPO |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| ABC Areal | 1000 | 878 / −210 / 0 | 716 | 162‰ | 210‰ | 4.4% | yes |
| ABC Camera | 2048 | 2028 / −639 / 0 | 1434 | 290‰ | 312‰ | 1.7% | no |
| ABC Walter | 1000 | 971 / −317 / 0 | 700 | 271‰ | 317‰ | 3.6% | no |
| Inter 3.3 | 2816 | 3072 / −1140 / 0 | 2048 | 364‰ | 405‰ | 2.8% | no |
| Helvetica Neue | 1000 | 952 / −213 / 28 | 714 | 238‰ | 213‰ | 2.1% | no |
| Roboto | 2048 | 1900 / −500 / 0 | 1456 | 217‰ | 244‰ | 2.3% | no |
| Neue Haas Unica | 1000 | 1166 / −340 / 0 | 712 | 454‰ | 340‰ | 7.6% | no |
| Akkurat LL | 1000 | 760 / −240 / 0 | 709 | 51‰ | 240‰ | 18.9% | no |
| Unica77 LL | 1000 | 750 / −250 / 0 | 726 | 24‰ | 250‰ | 22.6% | no |
| Univers LT CYR | 1000 | 724 / −276 / 200 | 722 | 2‰ | 276‰ | 27.4% | no |
| DIN Condensed | 1000 | 712 / −288 / 200 | 712 | 0‰ | 288‰ | 28.8% | no |

## What CSS actually does

A button with equal `padding-block` centers the line box, not the ink. With `line-height: normal`, extra `lineGap` is split equally as half-leading, which does not cancel an asymmetric ascent/descent split — Univers and DIN both have `lineGap` 200, and they still sit 137–144‰ off.

A one-word label without descenders (Save, Next, OK) makes this obvious. The cellar reserved for p/g/y stays empty. Mixed-case copy is even more top-heavy because most of the ink only reaches x-height.

The layout spec is CSS Inline Module Level 3: the content area is the font’s ascent and descent metrics. The intended CSS fix is:

```css
button { text-box: trim-both cap alphabetic; }
```

Chrome 133+, Safari 18.2+. That trims to cap-height and the alphabetic baseline so equal padding means equal space around the letters. Areal and DIN then behave the same, without editing font files.

## Font files vs Glyphs MCP

CSS never sees Glyphs masters, alignment zones, or custom parameters. It sees `hhea`, OS/2 (`sTypo*`, `usWin*`, `sCapHeight`, `USE_TYPO_METRICS`), and the actual H outline. Those live in the installed OTF/TTF/WOFF.

Open Glyphs only to rewrite vertical metrics (`typoAscender`, `hheaAscender`, `winAscent`, corresponding descenders, `lineGap`) and to check that umlauts still fit.

## Source files

- `ABCAreal-Regular.ttf`
- `ABCCamera-Regular-Trial.otf`
- `ABCWalter-AlteNormalgrotesk.otf`
- `inter-regular-webfont.woff` (Gravity Forms Inter 3.3 subset; official Inter 3 hhea/OS/2 tables)
- `HelveticaNeue.ttc` Regular (`/System/Library/Fonts/HelveticaNeue.ttc`)
- `Roboto-Regular.ttf`
- `NeueHaasUnicaPro-Regular.ttf`
- `AkkuratLL-Regular.otf`
- `Unica77LL-Regular.otf`
- `UniversLTCYR-55Roman.otf`
- `DIN Condensed Bold.ttf` (Apple Supplemental; no Regular installed)
