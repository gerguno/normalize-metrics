import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPercent, formatRow, renderBar } from "./progress.ts";

describe("progress bar", () => {
  it("fills dashes from the left and keeps a fixed width", () => {
    assert.equal(renderBar(0), "····················");
    assert.equal(renderBar(50), "----------··········");
    assert.equal(renderBar(90).replaceAll("·", "").length, 18);
    assert.equal(renderBar(100), "--------------------");
    assert.equal(renderBar(50).length, 20);
  });

  it("pads the percent like a shell loader", () => {
    assert.equal(formatPercent(9), "  9%");
    assert.equal(formatPercent(90), " 90%");
    assert.equal(formatPercent(100), "100%");
  });

  it("keeps already-good fonts on the stack with a reason", () => {
    const line = formatRow(
      {
        id: "b",
        label: "Techne-normalized.otf",
        percent: 100,
        phase: "ok",
        detail: "already good  0‰",
      },
      22,
      80,
    );
    assert.match(line, /already good  0‰/);
    assert.match(line, /100%/);
  });

  it("renders filename + timeline + percent", () => {
    const line = formatRow(
      {
        id: "a",
        label: "Inter-Regular.otf",
        percent: 90,
        phase: "analyzing",
        detail: "analyzing",
      },
      17,
      80,
    );
    assert.match(line, /Inter-Regular\.otf  /);
    assert.match(line, /90%/);
    assert.match(line, /analyzing/);
    assert.ok(line.includes(renderBar(90)));
  });
});
