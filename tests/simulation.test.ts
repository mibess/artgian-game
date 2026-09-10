import { test } from "node:test";
import assert from "node:assert/strict";
import { levels } from "../src/config/levels.ts";
import { initialState, stepSimulation } from "../src/shared/simulation.ts";
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
