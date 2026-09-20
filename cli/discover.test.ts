import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { emptyConfig } from "./config.ts";
import { discover } from "./discover.ts";

describe("discover", () => {
  it("lists otf/ttf/woff/woff2 inside a folder and keeps ttc as a skip candidate", async () => {
    const root = await mkdtemp(join(tmpdir(), "nm-discover-"));
    await mkdir(join(root, "nested"));
    await writeFile(join(root, "Inter-Regular.otf"), "x");
    await writeFile(join(root, "nested", "Face.woff2"), "x");
    await writeFile(join(root, "Collection.ttc"), "x");
    await writeFile(join(root, "readme.md"), "x");

    const found = await discover(root, emptyConfig());
    assert.deepEqual(
      found.map((file) => file.rel),
      ["Collection.ttc", "Inter-Regular.otf", "nested/Face.woff2"],
    );
    assert.equal(found[0].kind, "ttc");
    assert.equal(found[1].kind, "font");
  });

  it("honors include and exclude", async () => {
    const root = await mkdtemp(join(tmpdir(), "nm-filter-"));
    await mkdir(join(root, "keep"));
    await mkdir(join(root, "drop"));
    await writeFile(join(root, "keep", "A.otf"), "x");
    await writeFile(join(root, "drop", "B.otf"), "x");

    const found = await discover(root, {
      ...emptyConfig(),
      include: ["keep/**"],
      exclude: ["**/drop/**"],
    });
    assert.deepEqual(
      found.map((file) => file.rel),
      ["keep/A.otf"],
    );
  });
});
