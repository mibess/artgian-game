import { test } from "node:test";
import assert from "node:assert/strict";
import { applyRun, loadRecords, saveRun, starCount, hasStar, totalStars, loadSettings, saveSettings, formatTime } from "../src/systems/Records.ts";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
const run = (over: Partial<Parameters<typeof applyRun>[1]> = {}) =>
  ({ won: true, count: 10, total: 25, lives: 2, time: 90_000, progress: 1, ...over });

test("Stars accumulate across runs and each goal is independent", () => {
  const first = applyRun(undefined, run());
  assert.deepEqual(first.stars, [true, false, false]);
  assert.equal(first.newStars, 1);
  assert.ok(first.firstClear);
  const second = applyRun(first.record, run({ count: 25, lives: 1 }));
  assert.equal(starCount(second.record), 2);
  assert.equal(second.newStars, 1);
  const third = applyRun(second.record, run({ count: 3, lives: 3 }));
  assert.equal(starCount(third.record), 3);
  assert.ok(hasStar(third.record, 2));
  assert.ok(!third.firstClear);
});
test("A loss never awards stars but records the highest progress", () => {
  const lost = applyRun(undefined, run({ won: false, count: 25, lives: 0, progress: 0.42 }));
  assert.equal(starCount(lost.record), 0);
  assert.equal(lost.record.bestProgress, 0.42);
  assert.ok(lost.newProgress);
  assert.ok(!applyRun(lost.record, run({ won: false, progress: 0.3 })).newProgress);
  assert.equal(lost.record.attempts, 1);
  assert.equal(lost.record.completions, 0);
});
test("Best time only improves on faster completions", () => {
  const a = applyRun(undefined, run({ time: 80_000 }));
  assert.ok(a.newTime);
  const b = applyRun(a.record, run({ time: 95_000 }));
  assert.ok(!b.newTime);
  assert.equal(b.record.bestTime, 80_000);
  assert.ok(applyRun(b.record, run({ time: 70_000 })).newTime);
  assert.ok(!applyRun(b.record, run({ won: false, time: 1_000, progress: 0.2 })).newTime);
});
test("Records persist per level and ignore corrupt storage", () => {
  const store = new MemoryStorage();
  saveRun("home", run({ count: 25, lives: 3 }), store as unknown as Storage);
  saveRun("studio", run(), store as unknown as Storage);
  const records = loadRecords(store as unknown as Storage);
  assert.equal(starCount(records.home), 3);
  assert.equal(totalStars(records), 4);
  store.setItem("artgian-jump-records-v1", "{not json");
  assert.deepEqual(loadRecords(store as unknown as Storage), {});
  store.setItem("artgian-jump-records-v1", JSON.stringify({ home: { stars: "x", bestTime: -4, attempts: 2 } }));
  assert.deepEqual(loadRecords(store as unknown as Storage).home.attempts, 2);
  assert.equal(loadRecords(store as unknown as Storage).home.bestTime, 0);
});
test("Settings and time formatting", () => {
  const store = new MemoryStorage() as unknown as Storage;
  assert.equal(loadSettings(store).muted, false);
  saveSettings({ muted: true }, store);
  assert.equal(loadSettings(store).muted, true);
  assert.equal(formatTime(125_900), "02:05");
});
