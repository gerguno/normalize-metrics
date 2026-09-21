# normalize-metrics

Rewrite font vertical metrics so a word sits in the box.

The text within a button is not always centered. That is the font’s fault, not yours. You can already trim the line box in CSS with `text-box: trim-both cap alphabetic`. The default is still the untrimmed box, and most type ramps and component kits were written for that default.

This CLI rewrites the font for that default case. It only changes how the word sits in the box — not the letters, the look of the font, or anything else.

```
npm i -g normalize-metrics
normalize-metrics Inter-Regular.otf
normalize-metrics ./fonts
```

Or once, without installing:

```
npx normalize-metrics ./fonts
```

A folder means every `.otf`, `.ttf`, `.woff`, and `.woff2` inside it. It writes a normalized copy next to the original. Fonts that already have good metrics are left alone. Variable fonts and TTC collections are skipped in v1.

Rewriting a licensed font and redistributing the result may violate the EULA. This tool does not legalize the file.

## Requirements

- Node.js 20 or newer
- Python 3 with [fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools`) — an implementation detail, not a pip product install

## Usage

```
normalize-metrics <file|folder> [options]
```

| Option | What it does |
| --- | --- |
| `--check` | Report fonts that are still off; write nothing; exit 1 if any are off |
| `--dry-run` | Same report; write nothing |
| `--in-place` | Overwrite the original (opt-in) |
| `--out-dir <dir>` | Write copies into this directory |
| `--suffix <text>` | Filename suffix for copies (default: `-normalized`) |
| `--config <file>` | `normalize-metrics.config.json` (or a `package.json` key) |

Never overwrites unless you pass `--in-place`.

In a repo, add it as a dev dependency and list the folders in the config. `--check` reports fonts that are still off and exits without writing — useful in CI.

```
npm i -D normalize-metrics
```

## Config

`normalize-metrics.config.json`, or a `"normalize-metrics"` key in `package.json`:

```json
{
  "include": ["fonts/**/*.{otf,ttf,woff,woff2}"],
  "exclude": ["**/*-normalized.*"],
  "outDir": null,
  "suffix": "-normalized"
}
```

## License

MIT
