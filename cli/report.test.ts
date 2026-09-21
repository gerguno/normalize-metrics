import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatReport, formatReports } from "./report.ts";
import type { Metrics } from "./types.ts";

function metrics(partial: Partial<Metrics> & Pick<Metrics, "centered">): Metrics {
  return {
    upm: 1000,
    ascent: 1000,
    descent: 0,
    lineGap: 0,
    cap: 700,
    above: 0,
    below: 0,
    offset: 0,
    grade: "Bad",
    ...partial,
  };
}

describe("formatReport", () => {
  it("prints before/after centered and a bigger leading line", () => {
    const text = formatReport({
      family: "Unica77 LL",
      before: metrics({ centered: 77, ascent: 750, descent: -250, lineGap: 0 }),
      after: metrics({ centered: 100, ascent: 981, descent: -255, lineGap: 0 }),
    });
    assert.equal(
      text,
      [
        "Unica77 LL",
        "Before                          |    After",
        "Centered: 77%                   |    Centered: 100%",
        "Leading change: 23.6% bigger",
      ].join("\n"),
    );
  });

  it("says unchanged when used height stays put", () => {
    const text = formatReport({
      family: "BST Ritma Unlicenced Trial",
      before: metrics({
        centered: 81,
        ascent: 755,
        descent: -245,
        lineGap: 234,
      }),
      after: metrics({
        centered: 100,
        ascent: 929,
        descent: -229,
        lineGap: 76,
      }),
    });
    assert.match(text ?? "", /Leading change: unchanged/);
    assert.match(text ?? "", /Centered: 81%/);
    assert.match(text ?? "", /Centered: 100%/);
  });

  it("skips files without metrics", () => {
    assert.equal(formatReports([{ status: "skipped", reason: "variable fonts are skipped in v1" }]), "");
  });
});
