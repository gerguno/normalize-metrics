import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { HELP, modeOf, parseArgs } from "./args.ts";
import { emptyConfig, findConfig, mergeConfig } from "./config.ts";
import { discover, discoverFromInclude } from "./discover.ts";
import { runEngine } from "./engine.ts";
import { formatOffset, outputPath } from "./paths.ts";
import { ProgressStack } from "./progress.ts";
import { EULA, invocationDir, packageVersion, resolvePython } from "./runtime.ts";
import { pathExists } from "./fs-exists.ts";
import type { Args, Discovered, EngineResult, FileOutcome, FilePhase, Mode } from "./types.ts";

function phaseFromEngine(phase: string): FilePhase {
  if (phase === "rewriting") return "rewriting";
  if (phase === "writing" || phase === "done") return "writing";
  return "analyzing";
}

function destLabel(dest: string): string {
  return basename(dest);
}

async function processFile(
  file: Discovered,
  options: {
    python: string;
    mode: Mode;
    inPlace: boolean;
    config: ReturnType<typeof mergeConfig>;
    stack: ProgressStack;
  },
): Promise<FileOutcome> {
  const dest = outputPath(file, options.config, options.inPlace);
  if (file.kind === "ttc") {
    const reason = "TTC collections are skipped in v1";
    options.stack.update(file.abs, { percent: 0, phase: "skipped", detail: reason });
    return { status: "skipped", reason };
  }

  options.stack.update(file.abs, { percent: 4, phase: "analyzing", detail: "analyzing" });
  try {
    const inspect = options.mode !== "write";
    const result = await runEngine({
      python: options.python,
      input: file.abs,
      output: inspect ? undefined : dest,
      inspect,
      skipIfGood: options.mode === "write",
      onProgress: (event) => {
        options.stack.update(file.abs, {
          percent: event.percent,
          phase: phaseFromEngine(event.phase),
          detail: event.phase,
        });
      },
    });

    if (result.skip) {
      options.stack.update(file.abs, { percent: 0, phase: "skipped", detail: result.skip });
      return { status: "skipped", reason: result.skip };
    }

    return finishResult(file.abs, dest, result, options.mode, options.stack);
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n").at(-1) || "failed" : "failed";
    options.stack.update(file.abs, { percent: 0, phase: "failed", detail: message });
    return { status: "failed", message };
  }
}

function alreadyGoodDetail(result: EngineResult): string {
  return `already good  ${formatOffset(result.before?.offset ?? result.after?.offset)}`;
}

function finishResult(
  id: string,
  dest: string,
  result: EngineResult,
  mode: Mode,
  stack: ProgressStack,
): FileOutcome {
  const offset = formatOffset(result.before?.offset);
  if (result.off === false) {
    stack.update(id, { percent: 100, phase: "ok", detail: alreadyGoodDetail(result) });
    return { status: "ok", result };
  }
  if (mode === "check") {
    stack.update(id, { percent: 100, phase: "off", detail: `off  ${offset}` });
    return { status: "off", result };
  }
  if (mode === "dry-run") {
    stack.update(id, {
      percent: 100,
      phase: "done",
      detail: `→ ${destLabel(dest)}  ${offset} → ${formatOffset(result.after?.offset)}`,
    });
    return { status: "would-write", dest, result };
  }
  stack.update(id, {
    percent: 100,
    phase: "done",
    detail: `→ ${destLabel(dest)}`,
  });
  return { status: "wrote", dest, result };
}

function summarize(outcomes: FileOutcome[], mode: Mode): string {
  const counts = {
    wrote: outcomes.filter((item) => item.status === "wrote").length,
    would: outcomes.filter((item) => item.status === "would-write").length,
    ok: outcomes.filter((item) => item.status === "ok").length,
    off: outcomes.filter((item) => item.status === "off").length,
    skipped: outcomes.filter((item) => item.status === "skipped").length,
    failed: outcomes.filter((item) => item.status === "failed").length,
  };
  const parts: string[] = [];
  if (mode === "write") {
    parts.push(`${counts.wrote} wrote`);
    if (counts.ok) parts.push(`${counts.ok} already good`);
  }
  if (mode === "dry-run") {
    parts.push(`${counts.would} would write`);
    if (counts.ok) parts.push(`${counts.ok} already good`);
  }
  if (mode === "check") {
    parts.push(`${counts.off} off`);
    parts.push(`${counts.ok} ok`);
  }
  if (counts.skipped) parts.push(`${counts.skipped} skipped`);
  if (counts.failed) parts.push(`${counts.failed} failed`);
  return parts.join(" · ");
}

function exitCode(outcomes: FileOutcome[], mode: Mode): number {
  if (outcomes.some((item) => item.status === "failed")) return 1;
  if (mode === "check" && outcomes.some((item) => item.status === "off")) return 1;
  if (outcomes.length === 0) return 1;
  return 0;
}

async function resolveTargets(args: Args, cwd: string, config: ReturnType<typeof mergeConfig>): Promise<Discovered[]> {
  if (args.path) {
    const target = resolve(cwd, args.path);
    if (!(await pathExists(target))) {
      throw new Error(`Not found: ${args.path}`);
    }
    return discover(target, config);
  }
  if (config.include.length) {
    return discoverFromInclude(cwd, config);
  }
  throw new Error("Point it at a file or a folder. See --help.");
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 2;
  }

  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.version) {
    process.stdout.write(`${await packageVersion()}\n`);
    return 0;
  }

  const cwd = invocationDir();
  let config = emptyConfig();
  try {
    config = mergeConfig(await findConfig(cwd, args.configPath), args, cwd);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 2;
  }

  if (!config.suffix && !args.inPlace) {
    console.error("A suffix is required unless you pass --in-place. Default is -normalized.");
    return 2;
  }

  let files: Discovered[];
  try {
    files = await resolveTargets(args, cwd, config);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }

  if (!files.length) {
    console.error("No .otf, .ttf, .woff, or .woff2 files found.");
    return 1;
  }

  let python: string;
  try {
    python = await resolvePython();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }

  const mode = modeOf(args);
  const stack = new ProgressStack();
  const onInterrupt = () => {
    stack.restore();
    process.exit(130);
  };
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onInterrupt);

  stack.identify(
    files.map((file) => ({ id: file.abs, label: files.length > 1 ? file.rel : file.name })),
    EULA,
  );

  const outcomes: FileOutcome[] = [];
  for (const file of files) {
    outcomes.push(await processFile(file, { python, mode, inPlace: args.inPlace, config, stack }));
  }
  await stack.finish();
  process.off("SIGINT", onInterrupt);
  process.off("SIGTERM", onInterrupt);

  const summary = summarize(outcomes, mode);
  if (summary) {
    const stream = process.stderr.isTTY ? process.stderr : process.stdout;
    stream.write(`\n${summary}\n`);
  }
  return exitCode(outcomes, mode);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    },
  );
}
