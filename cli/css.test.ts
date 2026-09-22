import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fontSrc, formatStylesheet, metricPercent } from "./css.ts";
import type { CssFace } from "./css.ts";

function face(partial: Partial<CssFace> = {}): CssFace {
  return {
    family: "KTF Techne",
    weight: 400,
    style: "normal",
    fontPath: "/proj/public/fonts/KTFTechne-Regular.woff2",
    ascent: 972,
    descent: -250,
    lineGap: 0,
    upm: 1000,
    ...partial,
  };
}

describe("metricPercent", () => {
  it("turns the after box into em percentages", () => {
    assert.equal(metricPercent(972, 1000), "97.2%");
    assert.equal(metricPercent(-250, 1000), "25%");
    assert.equal(metricPercent(0, 1000), "0%");
    assert.equal(metricPercent(1024, 1000), "102.4%");
    assert.equal(metricPercent(76, 1000), "7.6%");
  });
});

describe("formatStylesheet", () => {
  it("points src at the original file and includes the line gap", () => {
    const css = formatStylesheet(
      [
        face(),
        face({
          family: "BST Ritma",
          weight: 700,
          style: "italic",
          fontPath: "/proj/public/fonts/Ritma-BoldItalic.otf",
          ascent: 929,
          descent: -229,
          lineGap: 76,
        }),
      ],
      "/proj/styles/fonts.css",
    );
    assert.match(css, /Does not rewrite the fonts/);
    assert.equal(fontSrc("/proj/styles/fonts.css", "/proj/public/fonts/KTFTechne-Regular.woff2"), "../public/fonts/KTFTechne-Regular.woff2");
    assert.match(css, /font-family: "KTF Techne";/);
    assert.match(css, /url\("\.\.\/public\/fonts\/KTFTechne-Regular\.woff2"\) format\("woff2"\)/);
    assert.match(css, /ascent-override: 97\.2%;\s+descent-override: 25%;\s+line-gap-override: 0%;/);
    assert.match(css, /font-weight: 700;\s+font-style: italic;/);
    assert.match(css, /ascent-override: 92\.9%;\s+descent-override: 22\.9%;\s+line-gap-override: 7\.6%;/);
    assert.match(css, /format\("opentype"\)/);
  });

  it("keeps one rule when the same box is shipped in several files", () => {
    const css = formatStylesheet(
      [
        face({ fontPath: "/proj/public/fonts/KTFTechne-Regular.otf" }),
        face({ fontPath: "/proj/public/fonts/KTFTechne-Regular.woff2" }),
        face({ fontPath: "/proj/public/fonts/KTFTechne-Regular.woff" }),
      ],
      "/proj/styles/fonts.css",
    );
    assert.equal(css.match(/@font-face/g)?.length, 1);
    assert.match(
      css,
      /src: url\("\.\.\/public\/fonts\/KTFTechne-Regular\.woff2"\) format\("woff2"\),\n {7}url\("\.\.\/public\/fonts\/KTFTechne-Regular\.woff"\) format\("woff"\),\n {7}url\("\.\.\/public\/fonts\/KTFTechne-Regular\.otf"\) format\("opentype"\);/,
    );
  });

  it("quotes a family name that contains a quote", () => {
    const css = formatStylesheet(
      [face({ family: 'Font "Next"', fontPath: "/proj/KTFTechne-Regular.woff2" })],
      "/proj/fonts.css",
    );
    assert.match(css, /font-family: "Font \\"Next\\"";/);
    assert.match(css, /url\("\.\/KTFTechne-Regular\.woff2"\)/);
  });
});
