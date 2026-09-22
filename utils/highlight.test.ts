import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectLanguage, highlight, highlightLines } from "./highlight.ts";
import type { HighlightLanguage } from "./highlight.ts";

const CSS = `@font-face {
  font-family: "Inter";
  src: url("./Inter-Regular.woff2") format("woff2"),
       url("./Inter-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  ascent-override: 97.2%;
  descent-override: 25%;
  line-gap-override: 0%;
}
`;

function role(code: string, language: HighlightLanguage, text: string) {
  const token = highlight(code, language).find((item) => item.text === text);
  assert.ok(token, `missing token ${text}`);
  return token.role;
}

function roundtrip(code: string, language: HighlightLanguage) {
  assert.equal(
    highlight(code, language)
      .map((token) => token.text)
      .join(""),
    code,
  );
}

describe("css", () => {
  it("keeps every character", () => {
    roundtrip(CSS, "css");
    roundtrip("text-box: trim-both cap alphabetic", "css");
  });

  it("colors names green and values brown", () => {
    assert.equal(role(CSS, "css", "@font-face"), "keyword");
    assert.equal(role(CSS, "css", "font-family"), "tag");
    assert.equal(role(CSS, "css", '"Inter"'), "string");
    assert.equal(role(CSS, "css", "url"), "entity");
    assert.equal(role(CSS, "css", "format"), "entity");
    assert.equal(role(CSS, "css", "400"), "constant");
    assert.equal(role(CSS, "css", "normal"), "string");
    assert.equal(role(CSS, "css", "97.2%"), "constant");
    assert.equal(role(CSS, "css", "25%"), "constant");
    assert.equal(role(CSS, "css", "0%"), "constant");
  });

  it("colors a bare declaration, including values on the next line", () => {
    const chip = "text-box: trim-both cap alphabetic";
    assert.equal(role(chip, "css", "text-box"), "tag");
    assert.equal(role(chip, "css", "trim-both"), "string");
    assert.equal(role(chip, "css", "cap"), "string");
    assert.equal(role(chip, "css", "alphabetic"), "string");

    const split = "font-style:\n  normal;";
    assert.equal(role(split, "css", "font-style"), "tag");
    assert.equal(role(split, "css", "normal"), "string");
  });

  it("colors selectors without treating pseudo-classes as properties", () => {
    const rule = "h1:hover { color: #fff; }\n.button { }";
    assert.equal(role(rule, "css", "h1"), "keyword");
    assert.equal(role(rule, "css", "hover"), "keyword");
    assert.equal(role(rule, "css", "color"), "tag");
    assert.equal(role(rule, "css", "#fff"), "constant");
    assert.equal(role(rule, "css", ".button"), "tag");
  });

  it("colors comments and custom properties", () => {
    const code = "/* note */\n--gap: 4px;";
    assert.equal(role(code, "css", "/* note */"), "comment");
    assert.equal(role(code, "css", "--gap"), "variable");
    assert.equal(role(code, "css", "4px"), "constant");
  });
});

describe("detectLanguage", () => {
  it("leaves a bare flag untyped", () => {
    assert.equal(detectLanguage("--check"), null);
    assert.equal(detectLanguage("--css"), null);
  });

  it("recognizes a declaration and a command", () => {
    assert.equal(detectLanguage("text-box: trim-both cap alphabetic"), "css");
    assert.equal(detectLanguage("npm i -g normalize-metrics"), "shell");
  });
});

describe("shell", () => {
  it("keeps every character", () => {
    roundtrip("npm i -g normalize-metrics", "shell");
    roundtrip("npx normalize-metrics ./fonts --css", "shell");
    roundtrip("normalize-metrics Inter-Regular.woff2 Inter-Regular.otf --css", "shell");
  });

  it("colors commands, subcommands, flags, and arguments", () => {
    const install = "npm i -g normalize-metrics";
    assert.equal(role(install, "shell", "npm"), "entity");
    assert.equal(role(install, "shell", "i"), "keyword");
    assert.equal(role(install, "shell", "-g"), "tag");
    assert.equal(role(install, "shell", "normalize-metrics"), "string");

    const dev = "npm i -D normalize-metrics";
    assert.equal(role(dev, "shell", "-D"), "tag");

    const once = "npx normalize-metrics ./fonts --css";
    assert.equal(role(once, "shell", "npx"), "entity");
    assert.equal(role(once, "shell", "normalize-metrics"), "entity");
    assert.equal(role(once, "shell", "./fonts"), "string");
    assert.equal(role(once, "shell", "--css"), "tag");

    const files = "normalize-metrics Inter-Regular.woff2 Inter-Regular.otf";
    assert.equal(role(files, "shell", "normalize-metrics"), "entity");
    assert.equal(role(files, "shell", "Inter-Regular.woff2"), "string");
  });

  it("colors a bare flag and a comment", () => {
    assert.equal(role("--check", "shell", "--check"), "tag");
    assert.equal(role("npm i # local", "shell", "# local"), "comment");
  });

  it("splits lines without dropping the break", () => {
    const lines = highlightLines("npm i\nnpx normalize-metrics", "shell");
    assert.equal(lines.length, 2);
    assert.equal(lines[0].map((token) => token.text).join(""), "npm i");
    assert.equal(lines[1].map((token) => token.text).join(""), "npx normalize-metrics");
  });
});
