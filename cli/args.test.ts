import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { modeOf, parseArgs } from "./args.ts";

describe("parseArgs", () => {
  it("reads a file path and write mode by default", () => {
    const args = parseArgs(["Inter-Regular.otf"]);
    assert.equal(args.path, "Inter-Regular.otf");
    assert.equal(modeOf(args), "write");
    assert.equal(args.inPlace, false);
  });

  it("treats --check as the CI report", () => {
    const args = parseArgs(["./fonts", "--check"]);
    assert.equal(modeOf(args), "check");
    assert.equal(args.dryRun, false);
  });

  it("keeps --dry-run as a no-write report", () => {
    const args = parseArgs(["./fonts", "--dry-run"]);
    assert.equal(modeOf(args), "dry-run");
  });

  it("prefers --check when both report flags are set", () => {
    const args = parseArgs(["./fonts", "--dry-run", "--check"]);
    assert.equal(modeOf(args), "check");
  });

  it("rejects --in-place together with --out-dir", () => {
    assert.throws(() => parseArgs(["./fonts", "--in-place", "--out-dir", "out"]), /either --in-place or --out-dir/);
  });

  it("rejects a second path", () => {
    assert.throws(() => parseArgs(["a.otf", "b.otf"]), /one file or one folder/);
  });
});
