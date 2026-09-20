import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set([
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  "application/font-woff",
  "application/font-woff2",
  "application/octet-stream",
  "application/x-font-ttf",
  "application/x-font-otf",
]);

function runPython(input: string, output: string): Promise<string> {
  const script = join(process.cwd(), "lib", "engine.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [script, input, output], {
      stdio: ["ignore", "pipe", "pipe"],
    });
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
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `normalize failed (${code})`));
    });
  });
}

function extension(name: string): string {
  const match = name.toLowerCase().match(/\.(ttf|otf|woff2|woff|ttc)$/);
  return match ? match[1] : "otf";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Drop a font file." }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File is too large." }, { status: 413 });
  }
  if (file.type && !ALLOWED.has(file.type) && !extension(file.name)) {
    return NextResponse.json({ error: "Not a font file." }, { status: 400 });
  }

  const ext = extension(file.name);
  const dir = await mkdtemp(join(tmpdir(), "normalize-"));
  const input = join(dir, `in.${ext}`);
  const output = join(dir, `out.${ext === "woff2" || ext === "woff" || ext === "ttc" ? "otf" : ext}`);

  try {
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    const raw = await runPython(input, output);
    const line = raw
      .trim()
      .split("\n")
      .filter((entry) => entry.startsWith("{"))
      .at(-1);
    if (!line) throw new Error("Could not read that font.");
    const parsed = JSON.parse(line) as {
      family: string;
      before: object;
      after: object;
    };
    const bytes = await readFile(output);
    return NextResponse.json({
      family: parsed.family,
      fileName: `${parsed.family.replace(/\s+/g, "")}-Normalized.${extension(output)}`,
      mime:
        output.endsWith(".otf")
          ? "font/otf"
          : "font/ttf",
      bytes: bytes.toString("base64"),
      before: parsed.before,
      after: parsed.after,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read that font.";
    return NextResponse.json({ error: message }, { status: 422 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
