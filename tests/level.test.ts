import { test } from "node:test";
import assert from "node:assert/strict";
import {
  platforms,
  progressAt,
  collectibleIndices,
} from "../src/systems/LevelSystem.ts";
import { CheckpointSystem } from "../src/systems/CheckpointSystem.ts";
import { JUMP, GRAVITY, SPEED, FLOOR, TOP } from "../src/config/gameConfig.ts";
test("Every consecutive jump has a reachable landing window", () => {
  for (let i = 1; i < platforms.length; i++) {
    const a = platforms[i - 1],
      b = platforms[i];
    const rise = a.y - b.y;
    const discriminant = JUMP * JUMP - 2 * GRAVITY * rise;
    assert.ok(discriminant > 0, `jump ${i}: height`);
    const airTime = (JUMP + Math.sqrt(discriminant)) / GRAVITY;
    const edgeGap = Math.max(0, Math.abs(b.x - a.x) - (a.w + b.w) / 2 + 24);
    assert.ok(
      edgeGap < SPEED * (airTime - 0.15),
      `jump ${i}: horizontal reach`,
    );
  }
});
test("Printing progress is clamped to the level, with 15 unique collectibles", () => {
  assert.equal(progressAt(FLOOR), 0);
  assert.equal(progressAt(TOP), 1);
  assert.equal(progressAt(-900), 1);
  assert.equal(progressAt(9000), 0);
  assert.equal(new Set(collectibleIndices).size, 15);
  for (const i of collectibleIndices) assert.ok(platforms[i]);
});
test("Checkpoints advance only and respawn above safe platforms", () => {
  const c = new CheckpointSystem();
  assert.equal(c.index, 0);
  assert.ok(c.activate(2, 200, 1400));
  assert.equal(c.y, 1344);
  assert.equal(c.activate(1, 50, 2500), false);
  assert.equal(c.x, 200);
  assert.equal(platforms.filter((p) => p.checkpoint !== undefined).length, 4);
});
