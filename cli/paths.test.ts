import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyConfig } from "./config.ts";
import { formatOffset, outputPath } from "./paths.ts";
import type { Discovered } from "./types.ts";

const file: Discovered = {
  abs: "/repo/fonts/Inter-Regular.otf",
  rel: "Inter-Regular.otf",
  name: "Inter-Regular.otf",
  kind: "font",
};

describe("outputPath", () => {
  it("writes a sibling copy with the default suffix", () => {
    assert.equal(outputPath(file, emptyConfig(), false), "/repo/fonts/Inter-Regular-normalized.otf");
  });

  it("overwrites only when --in-place", () => {
    assert.equal(outputPath(file, emptyConfig(), true), "/repo/fonts/Inter-Regular.otf");
  });

  it("preserves relative folders under outDir", () => {
    const nested: Discovered = { ...file, rel: "woff/Inter-Regular.otf" };
    const config = { ...emptyConfig(), outDir: "/out" };
    assert.equal(outputPath(nested, config, false), "/out/woff/Inter-Regular-normalized.otf");
  });
});

describe("formatOffset", () => {
  it("shows the research unit", () => {
    assert.equal(formatOffset(-94.5), "−94.5‰");
    assert.equal(formatOffset(0), "0‰");
    assert.equal(formatOffset(12), "+12.0‰");
  });
});
