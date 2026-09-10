import { test } from "node:test";
import assert from "node:assert/strict";
import { fitPlayfield } from "../src/config/viewport.ts";
import { W, H } from "../src/config/gameConfig.ts";

test("The entire playfield fits phone viewports, browser bars, safe areas and rotation", () => {
  for (const [width, height, top, bottom] of [
    [412, 915, 24, 24], [412, 780, 24, 24], [384, 700, 24, 24],
    [360, 640, 0, 0], [320, 480, 0, 0], [393, 852, 59, 34],
    [915, 412, 0, 76], [667, 375, 0, 76], [1440, 900, 0, 0],
  ]) {
    const usableWidth = width - 12;
    const usableHeight = height - Math.max(6, top) - Math.max(6, bottom);
    const frame = fitPlayfield(usableWidth, usableHeight);
    assert.ok(frame.width <= usableWidth + 0.001 && frame.height <= usableHeight + 0.001,
      `${width} × ${height}: no cropping`);
    assert.ok(Math.abs(frame.width / frame.height - W / H) < 0.0001, "physics coordinates keep their aspect ratio");
    assert.ok(Math.abs(frame.width - usableWidth) < 0.001 || Math.abs(frame.height - usableHeight) < 0.001,
      "use all available space on the limiting axis");
    if (height >= width) assert.ok(frame.width * 0.15 >= 39, "movement targets remain usable on small portrait screens");
  }
});

test("Browser toolbar expansion recomputes a smaller frame without clipping", () => {
  const open = fitPlayfield(400, 660), closed = fitPlayfield(400, 860);
  assert.ok(open.height <= 660);
  assert.ok(open.width < closed.width);
  assert.deepEqual(fitPlayfield(0, 0), { width: 0, height: 0 });
});
