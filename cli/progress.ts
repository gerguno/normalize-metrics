import { styleText } from "node:util";
import type { FilePhase, FileRow } from "./types.ts";

const BAR_WIDTH = 20;
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";

export function renderBar(percent: number, width = BAR_WIDTH): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return "-".repeat(filled) + "·".repeat(width - filled);
}

export function formatPercent(percent: number): string {
  return `${String(Math.round(Math.max(0, Math.min(100, percent)))).padStart(3, " ")}%`;
}

function truncate(value: string, width: number): string {
  if (value.length <= width) return value;
  if (width <= 1) return "…";
  return `${value.slice(0, width - 1)}…`;
}

function paint(text: string, phase: FilePhase, tty: boolean): string {
  if (!tty) return text;
  if (phase === "queued" || phase === "skipped") return styleText("dim", text);
  if (phase === "failed" || phase === "off") return styleText("red", text);
  if (phase === "done" || phase === "ok") return styleText("green", text);
  return text;
}

export function formatRow(row: FileRow, nameWidth: number, columns: number, tty = false): string {
  const name = truncate(row.label, nameWidth).padEnd(nameWidth, " ");
  const budget = Math.max(40, columns);
  if (row.phase === "skipped" || row.phase === "failed") {
    const detail = truncate(row.detail, Math.max(8, budget - nameWidth - 12));
    return paint(`${name}  ${row.phase.padEnd(7, " ")}  ${detail}`, row.phase, tty);
  }
  const bar = renderBar(row.percent);
  const pct = formatPercent(row.percent);
  const used = nameWidth + 2 + BAR_WIDTH + 2 + pct.length;
  const detail = row.detail ? `  ${truncate(row.detail, Math.max(0, budget - used - 2))}` : "";
  return paint(`${name}  ${bar}  ${pct}${detail}`, row.phase, tty);
}

function nameWidthOf(rows: FileRow[], columns: number): number {
  const longest = rows.reduce((max, row) => Math.max(max, row.label.length), 0);
  const usable = Math.max(columns, 80);
  return Math.min(Math.max(longest, 8), Math.max(16, usable - BAR_WIDTH - 16));
}

export class ProgressStack {
  private readonly rows = new Map<string, FileRow>();
  private readonly order: string[] = [];
  private readonly stream: NodeJS.WriteStream;
  private readonly tty: boolean;
  private painted = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly displayed = new Map<string, number>();
  private readonly targets = new Map<string, number>();
  private warning = "";

  constructor(stream: NodeJS.WriteStream = process.stderr) {
    this.stream = stream;
    this.tty = Boolean(stream.isTTY);
  }

  private columns(): number {
    const reported = this.stream.columns ?? 0;
    return reported >= 60 ? reported : 80;
  }

  identify(files: Array<{ id: string; label: string }>, warning: string): void {
    this.warning = warning;
    for (const file of files) {
      this.order.push(file.id);
      this.rows.set(file.id, {
        id: file.id,
        label: file.label,
        percent: 0,
        phase: "queued",
        detail: "",
      });
      this.displayed.set(file.id, 0);
      this.targets.set(file.id, 0);
    }
    if (this.tty) {
      this.stream.write(HIDE_CURSOR);
      if (this.warning) this.stream.write(`${styleText("dim", this.warning)}\n\n`);
      this.paint(true);
      this.timer = setInterval(() => this.tick(), 50);
    } else if (this.warning) {
      this.stream.write(`${this.warning}\n`);
    }
  }

  update(id: string, patch: Partial<Pick<FileRow, "percent" | "phase" | "detail">>): void {
    const row = this.rows.get(id);
    if (!row) return;
    if (patch.phase) row.phase = patch.phase;
    if (patch.detail != null) row.detail = patch.detail;
    if (patch.percent != null) {
      row.percent = patch.percent;
      this.targets.set(id, patch.percent);
      if (!this.tty) this.displayed.set(id, patch.percent);
    }
    if (this.tty) this.paint(false);
    else if (patch.phase && ["done", "skipped", "failed", "off", "ok"].includes(patch.phase)) {
      this.stream.write(`${formatRow({ ...row, percent: this.displayed.get(id) ?? row.percent }, row.label.length, 80, false)}\n`);
    }
  }

  async finish(): Promise<void> {
    if (!this.tty) return;
    const started = Date.now();
    while (Date.now() - started < 800 && this.needsEase()) {
      this.tick();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    for (const id of this.order) {
      const row = this.rows.get(id);
      if (row) this.displayed.set(id, row.percent);
    }
    this.paint(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream.write(SHOW_CURSOR);
  }

  restore(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.tty) this.stream.write(SHOW_CURSOR);
  }

  private needsEase(): boolean {
    return this.order.some((id) => {
      const shown = this.displayed.get(id) ?? 0;
      const target = this.targets.get(id) ?? 0;
      return Math.abs(target - shown) > 0.6;
    });
  }

  private tick(): void {
    let moved = false;
    for (const id of this.order) {
      const shown = this.displayed.get(id) ?? 0;
      const target = this.targets.get(id) ?? 0;
      if (Math.abs(target - shown) < 0.4) {
        if (shown !== target) {
          this.displayed.set(id, target);
          moved = true;
        }
        continue;
      }
      const next = shown + (target - shown) * 0.28;
      this.displayed.set(id, next);
      moved = true;
    }
    if (moved) this.paint(false);
  }

  private snapshot(): FileRow[] {
    return this.order.map((id) => {
      const row = this.rows.get(id)!;
      return { ...row, percent: this.displayed.get(id) ?? row.percent };
    });
  }

  private paint(first: boolean): void {
    const columns = this.columns();
    const rows = this.snapshot();
    const nameWidth = nameWidthOf(rows, columns);
    const lines = rows.map((row) => formatRow(row, nameWidth, columns, true));
    if (!first && this.painted > 0) {
      this.stream.write(`\x1b[${this.painted}A`);
    }
    for (const line of lines) {
      this.stream.write(`${CLEAR_LINE}${line}\n`);
    }
    this.painted = lines.length;
  }
}
