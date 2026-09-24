import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requirements = join(root, "requirements.txt");
const venvPython =
  process.platform === "win32"
    ? join(root, ".venv", "Scripts", "python.exe")
    : join(root, ".venv", "bin", "python");
const vendorRoot = join(root, ".python");
const vendorPackages = join(vendorRoot, "packages");
const vendorPython = join(vendorRoot, "bin", "python");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  return result.status ?? 1;
}

function canRun(command, args) {
  return spawnSync(command, args, { stdio: "ignore" }).status === 0;
}

function installInto(python) {
  if (!canRun(python, ["-m", "pip", "--version"])) {
    if (run(python, ["-m", "ensurepip", "--upgrade"]) !== 0) process.exit(1);
  }
  if (run(python, ["-m", "pip", "install", "-r", requirements]) !== 0) process.exit(1);
}

function writeVendorLauncher() {
  mkdirSync(dirname(vendorPython), { recursive: true });
  const system = canRun("python3", ["--version"]) ? "python3" : "python";
  writeFileSync(
    vendorPython,
    `#!/bin/sh\nexport PYTHONPATH="${vendorPackages}\${PYTHONPATH:+:$PYTHONPATH}"\nexec ${system} "$@"\n`,
  );
  chmodSync(vendorPython, 0o755);
}

if (!canRun("python3", ["--version"]) && !canRun("python", ["--version"])) {
  console.error("Python 3 is required. Install python3, then run npm install again.");
  process.exit(1);
}

if (existsSync(venvPython) && canRun(venvPython, ["-c", "import sys"])) {
  installInto(venvPython);
  process.exit(0);
}

rmSync(join(root, ".venv"), { recursive: true, force: true });
const created = spawnSync("python3", ["-m", "venv", join(root, ".venv")], { cwd: root, encoding: "utf8" });
if (created.status === 0 && existsSync(venvPython)) {
  installInto(venvPython);
  process.exit(0);
}

const detail = `${created.stderr || ""}${created.stdout || ""}`.trim();
if (detail) console.error(detail);
console.error("Could not create a virtualenv. Installing the engine next to the app instead.");
rmSync(join(root, ".venv"), { recursive: true, force: true });
rmSync(vendorPackages, { recursive: true, force: true });
mkdirSync(vendorPackages, { recursive: true });
const pip = canRun("python3", ["-m", "pip", "--version"]) ? "python3" : "python";
if (run(pip, ["-m", "pip", "install", "--target", vendorPackages, "-r", requirements]) !== 0) {
  process.exit(1);
}
writeVendorLauncher();
