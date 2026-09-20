import { spawn } from "node:child_process";
import { enginePath } from "./runtime.ts";
import type { EngineResult } from "./types.ts";

export type ProgressEvent = {
  percent: number;
  phase: string;
};

function lastJson(text: string): unknown {
  const line = text
    .trim()
    .split("\n")
    .filter((entry) => entry.trim().startsWith("{"))
    .at(-1);
  if (!line) return null;
  return JSON.parse(line);
}

export function runEngine(options: {
  python: string;
  input: string;
  output?: string;
  inspect?: boolean;
  skipIfGood?: boolean;
  onProgress?: (event: ProgressEvent) => void;
}): Promise<EngineResult> {
  const args = [enginePath(), "--progress"];
  if (options.inspect) args.push("--inspect");
  if (options.skipIfGood) args.push("--skip-if-good");
  args.push(options.input);
  if (options.output && !options.inspect) args.push(options.output);

  return new Promise((resolve, reject) => {
    const child = spawn(options.python, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    const takeProgress = (chunk: string) => {
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const parsed = JSON.parse(trimmed) as { event?: string; percent?: number; phase?: string };
          if (parsed.event === "progress" && typeof parsed.percent === "number") {
            options.onProgress?.({ percent: parsed.percent, phase: parsed.phase ?? "analyzing" });
          }
        } catch {
          // fontTools may write non-JSON lines
        }
      }
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      takeProgress(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        const parsed = lastJson(stdout) as EngineResult | null;
        if (code === 0 && parsed) {
          resolve(parsed);
          return;
        }
        reject(new Error(stderr.trim() || `normalize failed (${code ?? "unknown"})`));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(stderr.trim() || "Could not read that font."));
      }
    });
  });
}
