import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesAny, matchesGlob } from "./glob.ts";

describe("matchesGlob", () => {
  it("matches a simple extension", () => {
    assert.equal(matchesGlob("Inter-Regular.otf", "*.otf"), true);
    assert.equal(matchesGlob("Inter-Regular.ttf", "*.otf"), false);
  });

  it("matches nested paths with **", () => {
    assert.equal(matchesGlob("woff/Inter.woff2", "**/*.woff2"), true);
    assert.equal(matchesGlob("Inter.woff2", "**/*.woff2"), true);
  });

  it("expands {otf,ttf}", () => {
    assert.equal(matchesGlob("A.otf", "*.{otf,ttf}"), true);
    assert.equal(matchesGlob("A.ttf", "*.{otf,ttf}"), true);
    assert.equal(matchesGlob("A.woff", "*.{otf,ttf}"), false);
  });

  it("treats a bare filename pattern as recursive", () => {
    assert.equal(matchesGlob("vendor/A.otf", "*.otf"), true);
  });

  it("matches any of several exclude rules", () => {
    assert.equal(matchesAny("node_modules/pkg/A.otf", ["**/node_modules/**"]), true);
    assert.equal(matchesAny("fonts/A.otf", ["**/node_modules/**"]), false);
  });
});
