import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_CSS_FILE, modeOf, parseArgs } from "./args.ts";

describe("parseArgs", () => {
  it("reads a file path and write mode by default", () => {
    const args = parseArgs(["Inter-Regular.otf"]);
    assert.deepEqual(args.paths, ["Inter-Regular.otf"]);
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

  it("keeps a set of selected files", () => {
    const args = parseArgs(["a.otf", "--css", "fonts.css", "b.woff2"]);
    assert.deepEqual(args.paths, ["a.otf", "b.woff2"]);
    assert.equal(args.cssPath, "fonts.css");
    assert.equal(modeOf(args), "css");
  });

  it("treats --css as a stylesheet write", () => {
    const args = parseArgs(["./fonts", "--css", "fonts.css"]);
    assert.equal(args.cssPath, "fonts.css");
    assert.equal(modeOf(args), "css");
  });

  it("writes style.css when --css has no path", () => {
    const args = parseArgs(["./fonts", "--css"]);
    assert.equal(args.cssPath, DEFAULT_CSS_FILE);
    assert.equal(modeOf(args), "css");
  });

  it("rejects --css combined with a font write or a report flag", () => {
    assert.throws(() => parseArgs(["./fonts", "--css", "fonts.css", "--in-place"]), /stylesheet and no font/);
    assert.throws(() => parseArgs(["./fonts", "--css", "out/fonts"]), /\.css file/);
  });
});
