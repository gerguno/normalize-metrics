import type { Args } from "./types.ts";

export const HELP = `normalize-metrics — rewrite vertical metrics so a word sits in the box

Usage:
  normalize-metrics <file|folder> [options]
  normalize-metrics [options]

A folder means every .otf, .ttf, .woff, and .woff2 inside it.
Writes a normalized copy next to the original. Never overwrites unless --in-place.
Fonts that already have good metrics are left alone.

Options:
  --check           report fonts that are still off; write nothing; exit 1 if any are off
  --dry-run         same report; write nothing
  --in-place        overwrite the original (opt-in)
  --out-dir <dir>   write copies into this directory
  --suffix <text>   filename suffix for copies (default: -normalized)
  --config <file>   normalize-metrics.config.json (or a package.json key)
  -h, --help        show this help
  -v, --version     print the package version

Config (normalize-metrics.config.json or "normalize-metrics" in package.json):
  include, exclude, outDir, suffix

Examples:
  normalize-metrics Inter-Regular.otf
  normalize-metrics ./fonts
  npx normalize-metrics ./fonts --check
`;

const FLAGS_WITH_VALUE = new Set(["--out-dir", "--suffix", "--config"]);

export function parseArgs(argv: string[]): Args {
  const args: Args = {
    path: null,
    check: false,
    dryRun: false,
    inPlace: false,
    outDir: null,
    suffix: null,
    configPath: null,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "-h" || token === "--help") {
      args.help = true;
      continue;
    }
    if (token === "-v" || token === "--version") {
      args.version = true;
      continue;
    }
    if (token === "--check") {
      args.check = true;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--in-place") {
      args.inPlace = true;
      continue;
    }
    if (FLAGS_WITH_VALUE.has(token)) {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`${token} needs a value.`);
      }
      i += 1;
      if (token === "--out-dir") args.outDir = value;
      if (token === "--suffix") args.suffix = value;
      if (token === "--config") args.configPath = value;
      continue;
    }
    if (token.startsWith("-")) {
      throw new Error(`Unknown flag: ${token}`);
    }
    if (args.path) {
      throw new Error("Pass one file or one folder.");
    }
    args.path = token;
  }

  if (args.inPlace && args.outDir) {
    throw new Error("Use either --in-place or --out-dir, not both.");
  }

  return args;
}

export function modeOf(args: Args): "write" | "dry-run" | "check" {
  if (args.check) return "check";
  if (args.dryRun) return "dry-run";
  return "write";
}
