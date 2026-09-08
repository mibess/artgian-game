import { test } from "node:test";
import assert from "node:assert/strict";
import { textResolution } from "../src/config/rendering.ts";
test("Text density supersamples low-DPI screens and caps mobile memory cost", () => {
  for (const [ratio, expected] of [[1, 2], [1.5, 2], [2, 2], [2.5, 3], [3, 3], [4, 3], [NaN, 2]])
    assert.equal(textResolution(ratio), expected);
});
