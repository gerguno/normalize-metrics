import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export const EULA =
  "Rewriting a licensed font and redistributing the result may violate the EULA. This tool does not legalize the file.";

export function packageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

/** Directory the user ran the command from. npm scripts otherwise start at the package root. */
export function invocationDir(): string {
  return process.env.INIT_CWD || process.cwd();
}

export function enginePath(): string {
  return join(packageRoot(), "lib", "engine.py");
}

export async function packageVersion(): Promise<string> {
  const raw = await readFile(join(packageRoot(), "package.json"), "utf8");
  return (JSON.parse(raw) as { version?: string }).version ?? "0.0.0";
}

function run(command: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export async function resolvePython(): Promise<string> {
  for (const command of ["python3", "python"]) {
    try {
      const probe = await run(command, ["-c", "import fontTools, sys; print(sys.executable)"]);
      if (probe.code === 0 && probe.stdout.trim()) return command;
    } catch {
      // try the next name
    }
  }
  throw new Error(
    "The engine needs python3 with fontTools (implementation detail — not a pip product install).",
  );
}
