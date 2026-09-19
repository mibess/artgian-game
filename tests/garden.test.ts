import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gardenAssets, gardenSource, keyGardenPixels, beeFlight, beeCycle } from "../src/config/garden.ts";
import { hazardAnimationPose } from "../src/config/hazardAnimations.ts";
import { getLevel, hazardState } from "../src/config/levels.ts";
import { hazardAt, initialState, stepSimulation } from "../src/shared/simulation.ts";
import { playthrough } from "./playthrough.ts";

test("Garden has all individual image sources for its composed environment and props", () => {
  assert.equal(getLevel("garden").id, "garden");
  for (const asset of gardenAssets) {
    const png = readFileSync(new URL("../public/" + gardenSource(asset), import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.ok(png.readUInt32BE(16) >= 640);
    assert.ok(png.readUInt32BE(20) >= 400);
  }
});
test("Chroma key removes green and spill while preserving warm material and existing alpha", () => {
  const pixels = new Uint8ClampedArray([0,255,0,255, 240,180,100,255, 20,160,50,255, 230,220,210,128]);
  keyGardenPixels(pixels);
  assert.equal(pixels[3], 0);
  assert.deepEqual([...pixels.slice(4,8)], [240,180,100,255]);
  assert.equal(pixels[11], 0);
  assert.deepEqual([...pixels.slice(12)], [230,220,210,128]);
});
test("Sprinkler animation, fallback and shared server damage use the same cycle", () => {
  const obstacle = getLevel("garden").hazards[0];
  for (const time of [0,2199,2200,2899,2900,4399,4400]) {
    const state = hazardState("sprinkler", time, 0);
    const pose = hazardAnimationPose("sprinkler", time, 0, () => true)!;
    assert.equal(hazardAt(obstacle, time).active, state.active);
    assert.equal(pose.state === "warn", state.warning || state.active);
    assert.equal(state.active, time >= 2900 && time < 4400);
  }
  assert.equal(hazardAnimationPose("sprinkler", 2900, 0, () => true)!.frame, 25);
  assert.equal(hazardAnimationPose("sprinkler", 4399, 0, () => true)!.frame, 63);
  assert.equal(hazardAnimationPose("sprinkler", 2900, 0, () => false), undefined);
  assert.equal(hazardAnimationPose("sprinkler", 2900, 0, key => key.endsWith("idle"))!.state, "idle");
  assert.deepEqual(hazardState("sprinkler", 2200, 700), hazardState("sprinkler", 2900, 0));
});

test("Bees warn before crossing and reverse at the far edge without teleporting", () => {
  const activeAt = beeCycle.idleMs + beeCycle.warningMs;
  const period = activeAt + beeCycle.activeMs;
  assert.equal(beeFlight(beeCycle.idleMs - 1, 0, true).warning, false);
  assert.equal(beeFlight(beeCycle.idleMs, 0, true).warning, true);
  assert.equal(beeFlight(activeAt - 1, 0, true).active, false);
  assert.equal(beeFlight(activeAt, 0, true).active, true);
  assert.equal(beeFlight(activeAt + beeCycle.activeMs / 2, 0, true).x, 270);
  assert.ok(Math.abs(beeFlight(period - 1, 0, true).x - beeFlight(period, 0, true).x) < 1);
  assert.equal(beeFlight(period, 0, true).active, false);
  assert.equal(beeFlight(period, 0, true).rightward, false);
  assert.equal(beeFlight(period * 2, 0, true).rightward, true);
  assert.deepEqual(beeFlight(2000, 700, false), beeFlight(2700, 0, false));
});

test("Bee flight matches server collisions and leaves checkpoints and the goal safe", () => {
  const level = getLevel("garden"), bees = level.hazards.filter(h => h.kind === "bee");
  assert.equal(bees.length, 7);
  const safePlatforms = level.platforms.filter(p => p.checkpoint !== undefined || p === level.platforms.at(-1));
  for (const bee of bees) for (let time = 0; time < 10400; time += 10) {
    const flight = beeFlight(time, bee.phase, bee.x < 270), collision = hazardAt(bee, time);
    assert.equal(collision.x, flight.x);
    assert.equal(collision.y, bee.y + flight.offsetY);
    assert.deepEqual(hazardState("bee", time, bee.phase), {active: flight.active, warning: flight.warning});
    if (!collision.active) continue;
    for (const platform of safePlatforms) {
      const feet = platform.y - 13.5;
      assert.ok(feet <= collision.y - bee.h / 2 || feet - 65 >= collision.y + bee.h / 2,
        "waiting at a checkpoint must never intersect a bee flight");
    }
  }
});

test("Bees interrupt the old rush route while a timed route preserves all three lives", () => {
  const level = getLevel("garden");
  const previous = {...level, hazards: level.hazards.filter(h => h.kind !== "bee")};
  const rushed = initialState(level);
  for (const input of playthrough(previous)) stepSimulation(rushed, level, input);
  assert.ok(rushed.lives < 3, "the added hazard must actually challenge the previous route");
  const timed = initialState(level);
  for (const input of playthrough(level)) stepSimulation(timed, level, input);
  assert.equal(timed.status, "won");
  assert.equal(timed.lives, 3);
});

test("Bee sheets preserve sixty frames in compact grids and share their source crop", async () => {
  const { beeAnimation, gardenFrameSize, gardenFrameCount, gardenActions } = await import('../src/config/garden.ts');
  const metadata = JSON.parse(readFileSync(new URL('../public/assets/levels/garden/animations/bee-sheets.json', import.meta.url), 'utf8'));
  assert.equal(metadata.frameCount, beeAnimation.frameCount);
  assert.equal(metadata.frameWidth, gardenFrameSize('bee'));
  assert.equal(metadata.frameCount, gardenFrameCount('bee'));
  assert.deepEqual(gardenActions('bee'), ['idle', 'warn']);
  for (const action of ['idle', 'warn']) {
    const png = readFileSync(new URL(`../public/assets/levels/garden/animations/bee_${action}_sheet.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1024);
  }
});

test("Bee poses synchronize warning and crossing without displaying the four empty cells", async () => {
  const { beeAnimationPose } = await import('../src/config/garden.ts');
  const pose = (time: number) => beeAnimationPose(time, 0, () => true)!;
  assert.equal(pose(1799).key, 'garden-bee-idle');
  assert.deepEqual(pose(1800), {key:'garden-bee-warn',frame:0});
  assert.equal(pose(2699).frame, 15);
  assert.equal(pose(2700).frame, 16);
  assert.equal(pose(5199).frame, 59);
  assert.deepEqual(pose(5200), {key:'garden-bee-idle',frame:0});
  for (let t = 0; t < 10400; t += 7) assert.ok(pose(t).frame < 60);
  assert.deepEqual(beeAnimationPose(2000,700,()=>true),pose(2700));
  assert.equal(beeAnimationPose(2700,0,()=>false),undefined);
  assert.equal(beeAnimationPose(2700,0,key=>key.endsWith('idle'))!.key,'garden-bee-idle');
  assert.equal(beeAnimationPose(0,0,key=>key.endsWith('warn')),undefined);
  assert.deepEqual(beeAnimationPose(3400,0,()=>true,true),{key:'garden-bee-warn',frame:16});
});
