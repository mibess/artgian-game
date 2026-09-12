import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshCanvasTextures } from "../src/art/runtimeTextures.ts";

test("resume refreshes canvas artwork without touching static textures", () => {
  const refreshed: string[] = [];
  const entries = {
    platform: { refresh: () => refreshed.push("platform") },
    hat: { refresh: () => refreshed.push("hat") },
    player: {},
  };
  refreshCanvasTextures({
    getTextureKeys: () => Object.keys(entries),
    get: key => entries[key as keyof typeof entries],
  });
  assert.deepEqual(refreshed, ["platform", "hat"]);
});
