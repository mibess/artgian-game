import { test } from "node:test";
import assert from "node:assert/strict";
import { levels, type Level } from "../src/config/levels.ts";
import { initialState, platformAt, stepSimulation } from "../src/shared/simulation.ts";
import { playthrough } from "./playthrough.ts";

for (const level of levels) test(`server can replay a real winning route in ${level.id}`, () => {
  const inputs = playthrough(level);
  const state = initialState(level);
  for (const input of inputs) stepSimulation(state, level, input);
  assert.equal(state.status, "won");
  assert.ok(state.lives > 0);
  assert.ok(state.tick > 1500);
  assert.equal(state.support, level.platforms.length - 1);
});
test("idle inputs cannot win and falling consumes all lives", () => {
  const state = initialState(levels[0]);
  for (let i = 0; i < 600; i++) stepSimulation(state, levels[0], { axis: 0, jump: false });
  assert.equal(state.status, "playing");
  for (let i = 0; i < 5000; i++) stepSimulation(state, levels[0], { axis: 1, jump: false });
  assert.equal(state.status, "lost");
  assert.equal(state.lives, 0);
});
test("falls onto a platform while exiting platform X-range within the frame", () => {
  const level: Level = {
    id: "landing-regression",
    name: "Landing Regression",
    subtitle: "",
    hint: "",
    background: "workshop-depth",
    platform: "platform",
    alternate: "striped",
    product: "hat",
    productName: "Chapéu",
    productWidth: 177,
    productHeight: 107,
    accent: 0xe7ba79,
    platforms: [{ x: 280, y: 520, w: 26, kind: "normal" }],
    collectibles: [],
    hazards: [],
  };
  const state = initialState(level);
  state.x = 279;
  state.vx = 2000;
  state.feet = 500;
  state.vy = 1000;
  stepSimulation(state, level, { axis: 0, jump: false });
  assert.equal(state.support, 0);
  assert.ok(Math.abs(state.feet - (level.platforms[0].y - 13.5)) < 1e-9);
});

test("stays supported while a vertical platform moves downward", () => {
  const level = levels[0];
  const platformIndex = 15;
  const state = initialState(level);
  state.tick = 60;
  const platform = platformAt(level, state, platformIndex);
  state.x = platform.x;
  state.feet = platform.y - 13.5;
  state.vy = 0;
  state.support = platformIndex;
  state.lastLanding = platformIndex;
  state.groundAt = state.tick * 1000 / 60;

  for (let frame = 0; frame < 90; frame++) {
    stepSimulation(state, level, { axis: 0, jump: false });
    const current = platformAt(level, state, platformIndex);
    assert.equal(state.support, platformIndex);
    assert.ok(Math.abs(state.feet - (current.y - 13.5)) < 1e-9);
    assert.equal(state.vy, 0);
  }
});
