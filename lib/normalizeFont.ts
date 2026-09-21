import type { TriedFont } from "./triedFonts";
import type { Metrics, NormalizeResult } from "./types";

let stamp = 0;

async function loadPair(
  originalSource: string,
  normalizedSource: string,
  meta: {
    family: string;
    fileName: string;
    mime: string;
    before: Metrics;
    after: Metrics;
    blob?: Blob;
  },
): Promise<NormalizeResult> {
  stamp += 1;
  const originalFamily = `nm-orig-${stamp}`;
  const normalizedFamily = `nm-norm-${stamp}`;
  const originalFace = new FontFace(originalFamily, `url(${originalSource})`);
  const normalizedFace = new FontFace(normalizedFamily, `url(${normalizedSource})`);
  await Promise.all([originalFace.load(), normalizedFace.load()]);
  document.fonts.add(originalFace);
  document.fonts.add(normalizedFace);
  await document.fonts.ready;
  return {
    ...meta,
    originalFamily,
    normalizedFamily,
  };
}

export async function normalizeFont(file: File): Promise<NormalizeResult> {
  const originalUrl = URL.createObjectURL(file);
  const body = new FormData();
  body.append("file", file);

  try {
    const response = await fetch("/api/normalize", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not read that font.");
    }

    const bytes = Uint8Array.from(atob(data.bytes), (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.mime });
    const normalizedUrl = URL.createObjectURL(blob);
    const result = await loadPair(originalUrl, normalizedUrl, {
      family: data.family,
      fileName: data.fileName,
      mime: data.mime,
      before: data.before as Metrics,
      after: data.after as Metrics,
      blob,
    });
    URL.revokeObjectURL(normalizedUrl);
    return result;
  } catch (error) {
    URL.revokeObjectURL(originalUrl);
    throw error;
  }
}

export function loadTriedFont(tried: TriedFont) {
  return loadPair(tried.originalUrl, tried.normalizedUrl, {
    family: tried.label,
    fileName: tried.fileName,
    mime: "font/otf",
    before: tried.before,
    after: tried.after,
  });
}

let triedFontsPromise: Promise<Record<TriedFont["id"], NormalizeResult>> | null =
  null;

export function loadTriedFonts(fonts: TriedFont[]) {
  if (!triedFontsPromise) {
    triedFontsPromise = Promise.all(
      fonts.map(async (tried) => [tried.id, await loadTriedFont(tried)] as const),
    ).then((loaded) => {
      return Object.fromEntries(loaded) as Record<TriedFont["id"], NormalizeResult>;
    });
  }
  return triedFontsPromise;
}
