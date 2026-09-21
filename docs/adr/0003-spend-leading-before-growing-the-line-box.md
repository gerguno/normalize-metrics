---
status: Accepted
owner: Oles
reviewers: ["Oles"]
updated_at: "2026-09-21"
feature_size: S
ticket: ""
---

# 0003 — Spend leading before growing the line box

- **Status:** Accepted
- **Date:** 2026-09-21
- **Deciders:** Oles

## Context

There is no `spec.md` yet and no `docs/features/<slug>/` folder. This ADR is standalone under `docs/adr/`, same as 0001–0002. Architecture is in `docs/sad.md`. The extra-rule (what `ascent` / `descent` become) stays ADR 0001. This record amends only **how tall the used CSS line is**.

ADR 0001 writes `ascent = cap + extra`, `descent = −extra`, and **`lineGap = 0`**. The content area is then `cap + 2 × extra`. For ascent-pinned faces that is larger than the old `ascent + |descent|`. With `line-height: normal` the paragraph gets looser. The Text sample on BST Ritma showed that clearly (Before `L ≈ 1000`, After `1158`).

That sample also shows **`--lead`**: white between the pink descent band and the next line’s purple cap band. That white is not the cellar (`g` already sits in the pink). It is extra used height above the content area — `lineGap` on the hhea/typo path, plus whatever the UA adds on `normal`. The product copy in `docs/sad.md` §1 already says rhythm stays unchanged. `lineGap = 0` plus a grown content area contradicts that.

## Decision drivers

- Cap-center offset still goes to ~0 (ADR 0001 / SAD §1 QG-1). Equal leftover above H and below the baseline.
- Outlines, UPM, and horizontal metrics stay untouched. No clip or scale of `g` / `p` / `y`.
- Ink-to-ink rhythm for `line-height: normal` should match the original file when the original used height can pay for the new attic.
- GUI and CLI share one engine (`lib/engine.py`). Preview (`TextExample`, `line-height: normal`) is the proof for this rule, as the button is the proof for 0001.
- Win metrics remain a clip shield (bbox envelope). We do not invent a third vertical story.
- Already-downloaded 0001 files are one-way; a re-run with this rule produces a different artifact.

## Considered options

1. **Keep ADR 0001 as written** — content = `cap + 2 × extra`, `lineGap = 0`. Buttons stay honest. Paragraphs with `normal` get looser. The Text sample’s `--lead` is thrown away.
2. **Keep old content when it already fits; spend existing `lineGap` only if content must grow** — if `cap + 2 × extra` fits in old `ascent + |descent|`, recenter inside that box and **leave `lineGap` as it was** (do not invent lead). If it only fits after eating table `lineGap`, grow content and shrink that gap. If even `used` is too small, grow and set `lineGap = 0`.
3. **Always keep `used`, negative `lineGap` if needed** — content can exceed `used`; CSS half-leading goes negative. Rhythm never grows. Descenders overflow the used line box. Negative `lineGap` is flaky across renderers. Also tries to cancel UA extra that is not in the file.
4. **Always keep old `ascent + |descent|`, overflow tails** — slide the split so H is centered, never grow, ignore `lineGap`. Rhythm preserved. Tails paint outside hhea even when the original used height had room to contain them.

## Decision outcome

**Chosen:** Option 2 — keep old content when it already fits; spend existing table `lineGap` only when content must grow into it. Signed off 2026-09-21.

Dumping leftover into a **new** `lineGap` (GT America After grew white bands) is the bug: Before had `lineGap = 0`, the extra lived inside the content area. Inventing `lineGap` creates `--lead` that was not there. Ritma already had table gap `234`; spending it is fine.

This does not supersede ADR 0001. Cap-centering, Win envelope, `USE_TYPO_METRICS`, and “do not touch outlines” stay.

### Algorithm

```text
needed      = cap + 2 × extra                 # ADR 0001 minimum content
old_content = oldAscent + |oldDescent|
used_before = old_content + oldLineGap

if needed <= old_content:
    # America: recenter inside the old box. Do not invent lineGap.
    above   = floor((old_content − cap) / 2)
    below   = (old_content − cap) − above
    ascent  = cap + above
    descent = −below
    lineGap = oldLineGap
elif needed <= used_before:
    # Ritma: grow content, spend existing table gap
    ascent  = cap + extra
    descent = −extra
    lineGap = used_before − needed
else:
    # Unica: not enough white; grow used (0001)
    ascent  = cap + extra
    descent = −extra
    lineGap = 0
```

Write `hhea.lineGap` and `OS/2.sTypoLineGap` to that `lineGap`. Win flags: still ADR 0001.

“Already good” (`tables_off`) must compare this `lineGap`, not `== 0`.

Worked check (UPM 1000, extra from 0001 / tried fonts):

| Font | cap | extra | old content / gap | path |
| --- | ---: | ---: | --- | --- |
| GT America | 710 | 239 | 1205 / 0 | needed 1188 ≤ 1205 → content stays 1205, `lineGap` stays 0 |
| BST Ritma | 700 | 229 | 1000 / 234 | 1158 > 1000, ≤ 1234 → 929 / −229 / gap 76 |
| Unica77 LL | 726 | 255 | 1000 / 0 | 1236 > 1000 → grow, gap 0 |

This rule only spends **file** `lineGap`. It does not write negative `lineGap` to chase UA `normal`.

## Consequences

**Positive**
- When old content already covers `cap + 2 × extra`, H recenters inside that box and `lineGap` stays put — GT America gets no new `--lead`.
- When table `lineGap` already exists (Ritma), we spend it so used height does not grow.
- Same extra-rule as 0001. GUI and CLI still one engine.

**Negative**
- Ascent-pinned faces with `lineGap = 0` (DIN, Unica) still grow. This ADR does not invent white the tables do not have.
- `--lead` in TextExample can still disagree with table `lineGap` (UA `normal`). Do not treat the overlay as a fontTools measurement of `lineGap`.
- Files already downloaded under the “leftover → new lineGap” attempt (America `lineGap = 17`) will not match a re-run.
- Recenter-in-old-content can leave a 1-unit above/below mismatch when `(old_content − cap)` is odd.

**Neutral**
- Switching back to constant `lineGap = 0` is one assignment in `lib/engine.py`.
- Specified CSS `line-height` (not `normal`) never followed these tables; this ADR does not change that path.
- Option 3 remains if negative gap is ever proven safe.

## Links

- Spec: none yet — no `docs/spec.md`
- SAD: [[../sad.md]] §4, §9, §12
- Related ADR: [[0001-make-line-box-symmetric-around-cap-height]] (amends `lineGap = 0`)
- Related ADR: [[0002-ship-gui-and-cli-on-one-engine]] (same engine)
- Preview that forced the issue: `components/TextExample` (`--lead`, `line-height: normal`)
