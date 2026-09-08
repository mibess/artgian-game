import { test } from "node:test";
import assert from "node:assert/strict";
import { levels, getLevel, beatState, hazardState } from "../src/config/levels.ts";
import { JUMP, GRAVITY, SPEED } from "../src/config/gameConfig.ts";

for (const level of levels) {
  test(`${level.name}: complete route, safe checkpoints and reachable jumps`, () => {
    assert.equal(level.platforms.length, 49);
    assert.equal(new Set(level.collectibles).size, 25);
    for (const index of level.collectibles) assert.ok(level.platforms[index]);
    const checkpoints = level.platforms.filter(p => p.checkpoint !== undefined);
    assert.equal(checkpoints.length, 7);
    for (const p of checkpoints) assert.equal(p.kind, "normal");
    for (let i = 1; i < level.platforms.length; i++) {
      const a = level.platforms[i - 1], b = level.platforms[i];
      const discriminant = JUMP * JUMP - 2 * GRAVITY * (a.y - b.y);
      assert.ok(discriminant > 0, `jump ${i} height`);
      const time = (JUMP + Math.sqrt(discriminant)) / GRAVITY;
      const gap = Math.max(0, Math.abs(b.x - a.x) - (a.w + b.w) / 2 + 24);
      assert.ok(gap < SPEED * (time - 0.15), `jump ${i} reach`);
    }
  });
}
test("Themes have independent products, artwork and challenge sets", () => {
  assert.equal(new Set(levels.map(l => l.product)).size, 3);
  assert.equal(new Set(levels.map(l => l.background)).size, 3);
  assert.ok(getLevel("home").platforms.some(p => p.kind === "sink"));
  assert.ok(getLevel("studio").platforms.some(p => p.kind === "beat"));
  assert.deepEqual(new Set(getLevel("home").hazards.map(h => h.kind)), new Set(["steam", "pendant"]));
  assert.deepEqual(new Set(getLevel("studio").hazards.map(h => h.kind)), new Set(["sound", "cymbal"]));
  assert.equal(getLevel("unknown").id, "workshop");
});
test("Beat platforms warn before disappearing and return on the next cycle", () => {
  assert.deepEqual(beatState(0, 0), { solid: true, warning: false });
  assert.deepEqual(beatState(2150, 0), { solid: true, warning: true });
  assert.deepEqual(beatState(2600, 0), { solid: false, warning: false });
  assert.deepEqual(beatState(3600, 0), beatState(0, 0));
  assert.deepEqual(beatState(800, 1800), beatState(2600, 0));
});
test("Steam and sound each provide safe, warning and active intervals", () => {
  for (const [kind, warning, active, period] of [["steam", 2200, 2900, 4400], ["sound", 1600, 2200, 3000]] as const) {
    assert.deepEqual(hazardState(kind, 0, 0), { active: false, warning: false });
    assert.deepEqual(hazardState(kind, warning, 0), { active: false, warning: true });
    assert.deepEqual(hazardState(kind, active, 0), { active: true, warning: false });
    assert.deepEqual(hazardState(kind, period, 0), hazardState(kind, 0, 0));
    assert.deepEqual(hazardState(kind, active - 700, 700), hazardState(kind, active, 0));
  }
});
