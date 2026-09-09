import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hazardAnimations, hazardAnimationPose } from "../src/config/hazardAnimations.ts";
import { hazardState } from "../src/config/levels.ts";
test("Registered obstacle sheets use the standard 64-frame grid", () => {
  for (const animation of Object.values(hazardAnimations)) for (const sheet of [animation.idle, animation.warn]) {
    if (!sheet) continue;
    const png = readFileSync(new URL("../public/" + sheet.path, import.meta.url));
    assert.equal(png.readUInt32BE(16), 2048);
    assert.equal(png.readUInt32BE(20), 2048);
  }
});
test("Kettle warning and burst follow the existing damage cycle", () => {
  const pose = (time: number) => hazardAnimationPose("steam", time, 0, () => true)!;
  assert.equal(pose(2199).sheet.key, "home-kettle-idle");
  assert.equal(pose(2200).sheet.key, "home-kettle-warn");
  assert.equal(pose(2200).frame, 0);
  assert.equal(pose(2899).frame, 24);
  assert.equal(hazardState("steam", 2899, 0).active, false);
  assert.equal(pose(2900).frame, 25);
  assert.equal(hazardState("steam", 2900, 0).active, true);
  assert.equal(pose(4399).frame, 63);
  assert.equal(pose(4400).sheet.key, "home-kettle-idle");
  assert.deepEqual(hazardAnimationPose("steam", 2200, 700, () => true), pose(2900));
});
test("Missing sheets preserve legacy or idle behavior", () => {
  assert.equal(hazardAnimationPose("sound", 2500, 0, () => true), undefined);
  assert.equal(hazardAnimationPose("steam", 2500, 0, () => false), undefined);
  assert.equal(hazardAnimationPose("steam", 2500, 0, key => key.endsWith("idle"))!.sheet.key, "home-kettle-idle");
});
