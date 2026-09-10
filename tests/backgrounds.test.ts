import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { levels } from "../src/config/levels.ts";
import { atmospheres } from "../src/config/atmospheres.ts";

for (const level of levels) {
  test(`${level.name}: scrolling artwork exists with the required vertical aspect ratio`, () => {
    const atmosphere = atmospheres[level.id];
    assert.ok(atmosphere, "every selectable level has its own atmosphere");
    const png = readFileSync(new URL(`../public/${atmosphere.backgroundPath}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    assert.ok(width >= 540, "background remains sharp across the logical playfield");
    assert.equal(height, width * 2, "mirrored background tiles preserve their artwork proportions");
  });
}
