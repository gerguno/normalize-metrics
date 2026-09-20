#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

const entry = join(__dirname, "..", "cli", "index.ts");
const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--experimental-default-type=module",
    "--no-warnings=ExperimentalWarning",
    entry,
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
