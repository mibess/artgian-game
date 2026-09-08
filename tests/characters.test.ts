import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { characters, getCharacter } from "../src/config/characters.ts";

test("Every selectable character has three regular 64-frame PNG sheets", () => {
  assert.equal(characters.length, 3);
  for (const character of characters) for (const action of ["idle", "walk", "jump"]) {
    const file = new URL(`../public/assets/${character.id}/${character.id}_${action}_sheet.png`, import.meta.url);
    const png = readFileSync(file);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 2048, `${character.id} ${action} width`);
    assert.equal(png.readUInt32BE(20), 2048, `${character.id} ${action} height`);
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
