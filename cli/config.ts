import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathExists } from "./fs-exists.ts";
import type { Config } from "./types.ts";

export const DEFAULT_SUFFIX = "-normalized";

const DEFAULT_EXCLUDE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/dist/**",
  "**/__pycache__/**",
];

export function emptyConfig(): Config {
  return {
    include: [],
    exclude: [...DEFAULT_EXCLUDE],
    outDir: null,
    suffix: DEFAULT_SUFFIX,
  };
}

type RawConfig = {
  include?: unknown;
  exclude?: unknown;
  outDir?: unknown;
  suffix?: unknown;
};

function asStringList(value: unknown, key: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Config "${key}" must be an array of strings.`);
  }
  return value;
}

function asOptionalString(value: unknown, key: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(`Config "${key}" must be a string.`);
  }
  return value;
}

function parseRaw(raw: RawConfig, baseDir: string): Config {
  const outDir = asOptionalString(raw.outDir, "outDir");
  return {
    include: asStringList(raw.include, "include"),
    exclude: [...DEFAULT_EXCLUDE, ...asStringList(raw.exclude, "exclude")],
    outDir: outDir ? (isAbsolute(outDir) ? outDir : resolve(baseDir, outDir)) : null,
    suffix: asOptionalString(raw.suffix, "suffix") ?? DEFAULT_SUFFIX,
  };
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function loadConfigFile(file: string): Promise<Config> {
  const raw = (await readJson(file)) as RawConfig;
  return parseRaw(raw ?? {}, dirname(file));
}

export async function loadPackageConfig(file: string): Promise<Config | null> {
  const pkg = (await readJson(file)) as { "normalize-metrics"?: RawConfig };
  if (!pkg["normalize-metrics"]) return null;
  return parseRaw(pkg["normalize-metrics"], dirname(file));
}

export async function findConfig(startDir: string, explicit?: string | null): Promise<Config> {
  if (explicit) {
    const file = resolve(startDir, explicit);
    if (!(await pathExists(file))) {
      throw new Error(`Config not found: ${file}`);
    }
    if (file.endsWith("package.json")) {
      return (await loadPackageConfig(file)) ?? emptyConfig();
    }
    return loadConfigFile(file);
  }

  let dir = resolve(startDir);
  while (true) {
    const jsonFile = join(dir, "normalize-metrics.config.json");
    if (await pathExists(jsonFile)) {
      return loadConfigFile(jsonFile);
    }
    const pkgFile = join(dir, "package.json");
    if (await pathExists(pkgFile)) {
      const fromPkg = await loadPackageConfig(pkgFile);
      if (fromPkg) return fromPkg;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return emptyConfig();
}

export function mergeConfig(
  config: Config,
  flags: { outDir: string | null; suffix: string | null },
  cwd: string,
): Config {
  return {
    include: config.include,
    exclude: config.exclude,
    outDir: flags.outDir
      ? isAbsolute(flags.outDir)
        ? flags.outDir
        : resolve(cwd, flags.outDir)
      : config.outDir,
    suffix: flags.suffix ?? config.suffix,
  };
}
