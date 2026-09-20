import { basename, dirname, extname, join } from "node:path";
import type { Config, Discovered } from "./types.ts";

export function outputPath(file: Discovered, config: Config, inPlace: boolean): string {
  if (inPlace) return file.abs;
  const ext = extname(file.name);
  const stem = basename(file.name, ext);
  const named = `${stem}${config.suffix}${ext}`;
  if (config.outDir) {
    return join(config.outDir, dirname(file.rel), named);
  }
  return join(dirname(file.abs), named);
}

export function formatOffset(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  const abs = Math.abs(value).toFixed(1);
  if (value > 0) return `+${abs}‰`;
  if (value < 0) return `−${abs}‰`;
  return "0‰";
}
