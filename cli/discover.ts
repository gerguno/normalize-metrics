import { readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { matchesAny } from "./glob.ts";
import type { Config, Discovered } from "./types.ts";

const FONT_EXT = new Set([".otf", ".ttf", ".woff", ".woff2", ".ttc"]);

function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/(\.woff2|\.woff|\.ttf|\.otf|\.ttc)$/);
  return match ? match[1] : "";
}

function toPosix(rel: string): string {
  return rel.split(sep).join("/");
}

export function isFontName(name: string): boolean {
  return FONT_EXT.has(extensionOf(name));
}

export function kindOf(name: string): Discovered["kind"] {
  return extensionOf(name) === ".ttc" ? "ttc" : "font";
}

function ignoredDir(name: string): boolean {
  return name === "node_modules" || name === ".git" || name === ".next" || name === "__pycache__";
}

async function walk(dir: string, root: string, found: Discovered[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDir(entry.name)) await walk(abs, root, found);
      continue;
    }
    if (!entry.isFile() || !isFontName(entry.name)) continue;
    const rel = toPosix(relative(root, abs)) || entry.name;
    found.push({ abs, rel, name: entry.name, kind: kindOf(entry.name) });
  }
}

export async function discover(target: string, config: Config): Promise<Discovered[]> {
  const abs = resolve(target);
  const info = await stat(abs);
  if (info.isFile()) {
    if (!isFontName(basename(abs))) {
      throw new Error(`Not a font file: ${basename(abs)}`);
    }
    return [{ abs, rel: basename(abs), name: basename(abs), kind: kindOf(abs) }];
  }
  if (!info.isDirectory()) {
    throw new Error(`Not a file or folder: ${target}`);
  }

  const found: Discovered[] = [];
  await walk(abs, abs, found);
  found.sort((a, b) => a.rel.localeCompare(b.rel));

  return found.filter((file) => {
    if (config.exclude.length && matchesAny(file.rel, config.exclude)) return false;
    if (config.include.length && !matchesAny(file.rel, config.include)) return false;
    return true;
  });
}

export async function discoverFromInclude(cwd: string, config: Config): Promise<Discovered[]> {
  if (!config.include.length) return [];
  const found: Discovered[] = [];
  await walk(cwd, cwd, found);
  found.sort((a, b) => a.rel.localeCompare(b.rel));
  return found.filter((file) => {
    if (config.exclude.length && matchesAny(file.rel, config.exclude)) return false;
    return matchesAny(file.rel, config.include);
  });
}
