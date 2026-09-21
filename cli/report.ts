import type { EngineResult, FileOutcome, Metrics } from "./types.ts";

const COL = 32;

function usedHeight(metrics: Metrics): number {
  return metrics.ascent + Math.abs(metrics.descent) + metrics.lineGap;
}

function formatPercent(value: number): string {
  const rounded = Math.round(Math.abs(value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function leadingChange(before: Metrics, after: Metrics): string {
  const from = usedHeight(before);
  const to = usedHeight(after);
  if (from <= 0 || Math.abs(to - from) / from < 0.0005) {
    return "Leading change: unchanged";
  }
  const percent = ((to - from) / from) * 100;
  const label = percent > 0 ? "bigger" : "smaller";
  return `Leading change: ${formatPercent(percent)}% ${label}`;
}

function row(left: string, right: string): string {
  return `${left.padEnd(COL, " ")}|    ${right}`;
}

export function formatReport(result: EngineResult): string | null {
  const before = result.before;
  const after = result.after;
  if (!before || !after) return null;
  const name = result.family?.trim() || "Font";
  return [
    name,
    row("Before", "After"),
    row(`Centered: ${before.centered}%`, `Centered: ${after.centered}%`),
    leadingChange(before, after),
  ].join("\n");
}

export function formatReports(outcomes: FileOutcome[]): string {
  const blocks: string[] = [];
  for (const item of outcomes) {
    if (!("result" in item) || !item.result) continue;
    const block = formatReport(item.result);
    if (block) blocks.push(block);
  }
  return blocks.join("\n\n");
}
