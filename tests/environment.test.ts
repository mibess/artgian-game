import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { H, WORLD_H } from "../src/config/gameConfig.ts";
import { environments, ENVIRONMENT_SCROLL, ENVIRONMENT_HEIGHT, ZONE_HEIGHT,
  ZONE_OVERLAP, zoneY, sceneryY } from "../src/config/environment.ts";

test("Ascent reveals ground, middle and ceiling in order without repeating or leaving gaps", () => {
  const start = (WORLD_H - H) * ENVIRONMENT_SCROLL;
  assert.equal(start + H, ENVIRONMENT_HEIGHT, "floor image ends exactly at bottom of initial camera");
  assert.equal(zoneY.ground, start, "initial camera starts at ground zone");
  assert.equal(zoneY.upper, 0, "final camera reveals the ceiling");
  const centers = [0, 0.5, 1].map(progress => (1 - progress) * start + H / 2);
  assert.ok(centers[0] > zoneY.ground);
  assert.ok(centers[1] > zoneY.middle && centers[1] < zoneY.ground);
  assert.ok(centers[2] < zoneY.middle);
  for (let y = 0; y < ENVIRONMENT_HEIGHT; y += 3) {
    const visible = Object.entries(zoneY).filter(([, top]) => y >= top && y < top + ZONE_HEIGHT);
    assert.ok(visible.length, `wall covers y=${y}`);
    assert.ok(visible.some(([zone, top]) => zone === "upper" || y - top >= ZONE_OVERLAP),
      `feathered edges always have opaque artwork underneath at y=${y}`);
  }
});

test("Different depth layers meet their intended altitude and follow checkpoint return", () => {
  for (const progress of [0.08, 0.48, 0.88]) for (const factor of [0.48, 0.72, ENVIRONMENT_SCROLL]) {
    const world = sceneryY(progress, 340, factor);
    const camera = (1 - progress) * (WORLD_H - H);
    assert.ok(Math.abs(world - camera * factor - 340) < 0.00001);
    assert.ok(world - (camera + 200) * factor < 340, "returning down reveals the same spatially anchored environment");
  }
});

for (const [id, environment] of Object.entries(environments)) {
  test(`${id}: all three distinct environment zones are valid portrait assets`, () => {
    const paths = [environment.ground, environment.middle, environment.upper];
    assert.equal(new Set(paths).size, 3);
    for (const path of paths) {
      const png = readFileSync(new URL(`../public/${path}`, import.meta.url));
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
      assert.ok(width >= 640 && height > width, path);
    }
  });
}
