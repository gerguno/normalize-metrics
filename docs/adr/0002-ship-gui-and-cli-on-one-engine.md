---
status: Accepted
owner: Oles
reviewers: ["Oles"]
updated_at: "2026-09-20"
feature_size: S
ticket: ""
---

# 0002 — Ship a GUI and a CLI on one normalize engine

- **Status:** Accepted
- **Date:** 2026-09-20
- **Deciders:** Oles

## Context

There is no `spec.md` yet. Architecture is in `docs/sad.md`. This ADR records a product-surface decision agreed in chat after ADR 0001 locked the metric rewrite.

`text-box: trim-both cap alphabetic` became a real option on 18 August 2026, when Firefox shipped it. The CSS default is still the untrimmed box. Most type ramps and component kits were written for that default. ADR 0001 is the file-side fix for that default case: rewrite vertical metrics only, outlines unchanged. The decision here is how people reach that rewrite — one surface, two surfaces, or CSS documentation only.

The GUI already exists as a Next.js drop-and-download page. The CLI does not exist yet. Both must share `lib/engine.py` and the 0001 formula. Public copy must not present `text-box` as a GUI-only fact, or readers will think the CLI is a different product.

## Decision drivers

- One formula (ADR 0001). Two surfaces must not drift into two extra rules.
- The audience is web developers who already know npm and would otherwise add `text-box`. Type-design tooling (Glyphs, pip, fontTools as the public install) is not the front door.
- A single file needs a proof (before / after on a one-word button). A folder of `.otf` / `.ttf` / `.woff` / `.woff2` needs a batch path and a CI check.
- Rewriting a licensed font and redistributing the result may violate the EULA. The tool does not legalize the file. That warning is shared, not GUI-only.
- The public story has one intro (problem + CSS default + what the rewrite does) and then surface-specific how-to. CSS context in the GUI section alone is a logic error.

## Considered options

1. **GUI only** — keep the drop-and-download page. Proves 0001 visually. Cannot fix a folder or fail CI.
2. **CLI only** — npm command over files and folders. Fits repos. Loses the illustration that is the proof for a first-time user.
3. **GUI and CLI on one engine** — same 0001 rewrite; GUI is the proof, CLI is the batch / CI path.
4. **CSS documentation only** — tell people to set `text-box: trim-both cap alphabetic` and do not rewrite files. Leaves every existing kit on the untrimmed default.

## Decision outcome

**Chosen:** Option 3 — ship a GUI and a CLI on one engine. Signed off 2026-09-20.

Option 4 is the CSS path the intro already names; it is not the product. Option 1 cannot serve a `fonts/` folder. Option 2 cannot show why the file changed. Both shipped surfaces call the same 0001 rewrite. The extra-rule (tight box vs full bbox) stays out of v1 config.

### Surfaces

- **GUI** — drop one font, show the cap-center measurement, toggle before / after, download the rewritten face. Examples at the bottom repeat that measurement on known fonts.
- **CLI** — install with npm (`normalize-metrics` globally, or `npx` once). One path is one file. A folder means every `.otf`, `.ttf`, `.woff`, and `.woff2` inside it. Writes a normalized copy next to the original. `--check` reports fonts that are still off and exits without writing. `--dry-run` is the same report with no write. Variable fonts and TTC are skipped in v1, with a one-line reason.
- **Engine** — `lib/engine.py` per ADR 0001. The Next.js `/api/normalize` route and the CLI are wrappers. Python / pip is not a public install.
- **Config (CLI v1)** — `normalize-metrics.config.json` or a `"normalize-metrics"` key in `package.json`: `include`, `exclude`, `outDir`, `suffix`. Never overwrite by default; `--in-place` is opt-in. Print the EULA reminder once per run.

### Public copy

Canonical wording. Intro is shared. GUI and CLI sections only say how that surface is used.

**Normalize font metrics: GUI and CLI solutions**

The text within a button is not always centered. That is the font’s fault, not yours. You can already trim the line box in CSS with `text-box: trim-both cap alphabetic`. That property became an option on August 18, 2026, when Firefox adopted it. The default is still the untrimmed box, and most type ramps and component kits were written for that default.

These tools rewrite the font for that default case. They only change how the word sits in the box — not the letters, the look of the font, or anything else.

**GUI solution**

Drop a font file to see the measurement, then download the rewritten face. The examples at the bottom show the same analysis on a few known fonts.

**CLI solution**

Install with npm, then point it at a file or a folder. A folder means every `.otf`, `.ttf`, `.woff`, and `.woff2` inside it. It writes a normalized copy next to the original.

```
npm i -g normalize-metrics
normalize-metrics Inter-Regular.otf
normalize-metrics ./fonts
```

Or once, without installing:

```
npx normalize-metrics ./fonts
```

In a repo, add it as a dev dependency and list the folders in the config. `--check` reports fonts that are still off and exits without writing.

## Consequences

**Positive**
- One rewrite, two ways in: a designer can see the offset, a repo can normalize a folder and fail CI.
- Copy structure matches the architecture: CSS and “default case” are product facts, not GUI facts.
- npm matches the audience that would otherwise reach for `text-box`.

**Negative**
- Two surfaces to keep in lockstep. A change to 0001 or to the public copy has to land in both, or the product splits.
- npm as the front door hides fontTools. A type designer who expects `pip` will not find the install unless we also say that Python is an implementation detail.
- `--check` in CI will fail existing kits the first time it is added. That is the point; it is still a cost.
- A curl / standalone binary for people without Node is not in v1. They use the GUI or install Node.

**Neutral**
- A later Glyphs / MCP path is a third surface on the same engine, not a second formula.
- Switching the extra-rule later is still a one-line engine change (ADR 0001). Already-downloaded and already-written CLI files keep the old extra.
- The GUI page copy can stay shorter than this document’s intro; it must not contradict it.

## Links

- Related ADR: [[0001-make-line-box-symmetric-around-cap-height]]
- Engine: [[../../lib/engine.py]]
- GUI: [[../../app/page.tsx]]
- Research (replaces missing spec): [[../button-vertical-metrics.html]]
- Spec: none yet — no `docs/spec.md`
- SAD: [[../sad.md]] §4, §5, §9
