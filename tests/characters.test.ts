import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { characters, getCharacter, characterSheetPath, characterFrameCount, landingFrame } from "../src/config/characters.ts";

test("Kettle idle sheet contains an 8 by 8 grid of 256px frames", () => {
  const png = readFileSync(new URL("../public/assets/levels/home/chaleira_idle_sheet.png", import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 2048);
  assert.equal(png.readUInt32BE(20), 2048);
});

test("Every selectable character has three regular 8 by 8 PNG sheets", () => {
  assert.equal(characters.length, 4);
  for (const character of characters) for (const action of ["idle", "walk", "jump"]) {
    const file = new URL(`../public/${characterSheetPath(character, action)}`, import.meta.url);
    const png = readFileSync(file);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 2048, `${character.id} ${action} width`);
    assert.equal(png.readUInt32BE(20), 2048, `${character.id} ${action} height`);
  }
});
test("Margô uses all sixty authored frames without reaching the four empty cells", () => {
  const margo = getCharacter("margo");
  assert.equal(margo.name, "Margô");
  assert.equal(characterFrameCount(margo), 60);
  assert.equal(landingFrame(margo, 0), 35);
  assert.equal(landingFrame(margo, 1), 59);
  assert.equal(landingFrame(getCharacter("mib"), 0), 54);
  assert.equal(landingFrame(getCharacter("mib"), 1), 63);
  for (const character of characters) {
    const end = characterFrameCount(character) - 1;
    assert.ok(character.jumpFrames.fallEnd < end);
    for (let p = -0.1; p <= 1.1; p += 0.01) {
      const frame = landingFrame(character, p);
      assert.ok(frame > character.jumpFrames.fallEnd && frame <= end);
    }
  }
});
test("Giulinha preserves the updated sheet baseline and valid animation ranges", () => {
  const giulinha = getCharacter("giulinha");
  assert.equal(giulinha.originY, 248 / 256);
  assert.equal(giulinha.animationScale.idle, 1);
  assert.ok(Math.abs(205 * giulinha.animationScale.walk - 213) < 1,
    "Giulinha's walking reference matches the idle reference size");
  assert.ok(Math.abs(188 * giulinha.animationScale.jump - 213) < 1,
    "Giulinha's extended jump pose matches the idle reference size");
  for (const character of characters) {
    const {start, apex, fallEnd} = character.jumpFrames;
    assert.ok(start < apex && apex < fallEnd && fallEnd < 64);
  }
});
