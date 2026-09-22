# normalize-metrics

Fix font vertical metrics so a word sits in the box.

The text within a button is not always centered. That is the font’s fault, not yours. You can trim the line box in CSS with `text-box: trim-both cap alphabetic`. The default is still the untrimmed box, and most type ramps and component kits were written for that default.

Trim cuts descenders. An input, a textarea, or any box that clips overflow will cut g, p, and y once the line stops at the cap and the baseline. Turn trim off on those controls and you are back to the font’s real metrics.

For the web, fix those metrics in CSS and leave the file alone. Rewriting the font file is the other path, mostly for typographers who need that box everywhere the font is used, not only in one stylesheet.

## Install

```
npm i -g normalize-metrics
```

Or in a repo:

```
npm i -D normalize-metrics
```

## CSS

For the web, write a stylesheet and leave the font files alone. `--css` saves `style.css` with `ascent-override`, `descent-override`, and `line-gap-override`.

A single file, a set of files, or a folder:

```
normalize-metrics Inter-Regular.woff2 Inter-Regular.otf --css
normalize-metrics ./fonts --css
```

Or once, without installing:

```
npx normalize-metrics ./fonts --css
```

The stylesheet points at the original files. Do not add those descriptors to an already rewritten font.

## Rewrite

For typographers, and for anywhere a stylesheet cannot go. A folder means every `.otf`, `.ttf`, `.woff`, and `.woff2` inside it. It writes a normalized copy next to the original. Fonts that already have good metrics are left alone. Variable fonts and TTC collections are skipped in v1.

```
normalize-metrics Inter-Regular.woff2 Inter-Regular.otf
normalize-metrics ./fonts
```

Rewriting a licensed font and redistributing the result may violate the EULA. This tool does not legalize the file.

## Requirements

- Node.js 20 or newer
- Python 3 with [fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools`) — an implementation detail, not a pip product install

## Usage

```
normalize-metrics <file|folder> [more files] [options]
```

| Option | What it does |
| --- | --- |
| `--check` | Report fonts that are still off; write nothing; exit 1 if any are off |
| `--dry-run` | Same report; write nothing |
| `--css [file]` | Write `ascent-override`, `descent-override`, and `line-gap-override` for the original files. Default file is `style.css`. Does not rewrite fonts |
| `--in-place` | Overwrite the original (opt-in) |
| `--out-dir <dir>` | Write copies into this directory |
| `--suffix <text>` | Filename suffix for copies (default: `-normalized`) |
| `--config <file>` | `normalize-metrics.config.json` (or a `package.json` key) |

Never overwrites unless you pass `--in-place`.

In a repo, list the folders in the config. `--check` reports fonts that are still off and exits without writing — useful in CI.

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
