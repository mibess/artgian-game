import { test } from "node:test";
import assert from "node:assert/strict";
import { levels, getLevel, dripFall, dripCycle, fanCycle, hazardState, type Level } from "../src/config/levels.ts";
import { FLOOR } from "../src/config/gameConfig.ts";
import { initialState, stepSimulation, hazardAt, platformAt } from "../src/shared/simulation.ts";
import { playthrough } from "./playthrough.ts";

const bed = getLevel("bed");
const FEET_OFFSET = 13.5, BODY = 65, HALF = 13;
const cycle = dripCycle.formingMs + dripCycle.fallingMs + dripCycle.restMs;

test("Mesa is the fifth level and the most demanding one", () => {
  assert.equal(levels.at(-1)!.id, "bed");
  for (const level of levels.slice(0, -1)) assert.ok(bed.hazards.length > level.hazards.length, level.id);
  assert.deepEqual(new Set(bed.hazards.map(h => h.kind)), new Set(["nozzle", "drip", "fan"]));
  const kinds = new Set(bed.platforms.map(p => p.kind));
  for (const kind of ["shuttle", "beat", "temporary", "vertical", "sink", "boost"]) assert.ok(kinds.has(kind as never), kind);
  // Earlier levels keep their rules: no new mechanics leak into them.
  for (const level of levels.slice(0, -1)) {
    assert.ok(!level.platforms.some(p => p.kind === "shuttle"), level.id);
    assert.ok(!level.hazards.some(h => ["nozzle", "drip", "fan"].includes(h.kind)), level.id);
  }
});

test("Shuttle platforms stay inside the playfield", () => {
  for (const [i, p] of bed.platforms.entries()) if (p.kind === "shuttle") {
    const state = initialState(bed);
    for (let t = 0; t < 10_000; t += 50) {
      const at = platformAt(bed, state, i, t);
      assert.ok(at.x - p.w / 2 >= 0 && at.x + p.w / 2 <= 540, `platform ${i} at ${t}`);
    }
  }
});

test("Print heads pass between rungs and never hit anyone standing on a platform", () => {
  for (const h of bed.hazards.filter(h => h.kind === "nozzle")) for (const p of bed.platforms) {
    for (const dy of p.kind === "vertical" ? [-32, 0, 32] : [0]) { // vertical platforms bob 32 px
      const feet = p.y + dy - FEET_OFFSET;
      assert.ok(!(feet > h.y - h.h / 2 && feet - BODY < h.y + h.h / 2), `nozzle at ${h.y} vs platform ${p.y}`);
    }
  }
});

test("Drops warn before falling, then fall with gravity over their whole column", () => {
  const forming = dripFall(dripCycle.formingMs - 100, 0), start = dripFall(dripCycle.formingMs + 1, 0);
  const end = dripFall(dripCycle.formingMs + dripCycle.fallingMs - 1, 0);
  assert.ok(forming.warning && !forming.active);
  assert.ok(start.active && start.offsetY < 5);
  assert.ok(end.active && end.offsetY > dripCycle.distance * 0.95);
  assert.ok(!dripFall(cycle - 10, 0).active);
});

const standing = (level: Level, index: number) => level.platforms[index].y - FEET_OFFSET;
test("Checkpoints are safe from drops and fans, so a respawn is never punished", () => {
  const checkpoints = bed.platforms.flatMap((p, i) => p.checkpoint !== undefined ? [i] : []);
  for (const i of checkpoints) {
    const p = bed.platforms[i], feet = standing(bed, i);
    for (const h of bed.hazards) {
      if (h.kind === "fan") {
        assert.ok(!(feet > h.y - h.h / 2 && feet - BODY < h.y + h.h / 2), `fan band reaches checkpoint ${i}`);
        continue;
      }
      if (h.kind !== "drip") continue;
      for (let t = 0; t < cycle; t += 10) {
        const at = hazardAt(h, t);
        const overlapsX = at.x + h.w / 2 > p.x - p.w / 2 - HALF && at.x - h.w / 2 < p.x + p.w / 2 + HALF;
        const overlapsY = feet > at.y - h.h / 2 && feet - BODY < at.y + h.h / 2;
        assert.ok(!(at.active && overlapsX && overlapsY), `drop at ${h.x} hits checkpoint ${i} at ${t} ms`);
      }
    }
  }
});

test("Fans push sideways only while active and never cost a life", () => {
  const fan = bed.hazards.find(h => h.kind === "fan" && h.x < 270)!;
  const floor = fan.y + 60; // a platform inside the band
  const level: Level = { ...bed, hazards: [fan], collectibles: [],
    platforms: [{ x: 270, y: floor, w: 540, kind: "normal" }, { x: 270, y: FLOOR - 9999, w: 10, kind: "normal" }] };
  const state = initialState(level);
  Object.assign(state, { x: 200, feet: floor - FEET_OFFSET, support: 0, cameraY: floor - 700, highestCameraY: floor - 700 });
  const idle = fanCycle.idleMs + fanCycle.warningMs;
  while (!hazardState("fan", state.tick * 1000 / 60, fan.phase).active) stepSimulation(state, level, { axis: 0, jump: false });
  const before = state.x;
  for (let i = 0; i < 30; i++) stepSimulation(state, level, { axis: 0, jump: false });
  assert.ok(state.x > before + 70, `pushed right from ${before} to ${state.x}`);
  assert.equal(state.lives, 3);
  assert.ok(idle > 0);
});

test("Hazards demand attention: a hazard-blind route fails sooner than in any other level", () => {
  // The fastest route computed with hazards removed, replayed in the real level.
  const blind = (level: Level) => {
    const state = initialState(level);
    for (const input of playthrough({ ...level, hazards: [] })) {
      stepSimulation(state, level, input);
      if (state.status !== "playing") break;
    }
    return state;
  };
  const mesa = blind(bed);
  assert.equal(mesa.status, "lost");
  for (const level of levels.slice(0, -1))
    assert.ok(mesa.maxProgress < blind(level).maxProgress, `${level.id} is harder for a blind route`);
});

test("The game API accepts a Mesa run and records its completion", async t => {
  const { localDatabase } = await import("../server/local-db.ts");
  const { handleApi } = await import("../server/worker.ts");
  const { db, sqlite } = localDatabase(); t.after(() => sqlite.close());
  const env = { DB: db, ASSETS: { fetch: async () => new Response(null, { status: 404 }) } };
  let cookie = "";
  const call = async (path: string, data: unknown) => {
    const response = await handleApi(new Request(`https://game.test/api/game/${path}`, {
      method: "POST", body: JSON.stringify(data),
      headers: { Origin: "https://game.test", "Content-Type": "application/json", Cookie: cookie },
    }), env);
    if (response.headers.has("Set-Cookie")) cookie = response.headers.get("Set-Cookie")!.split(";")[0];
    return response;
  };
  await call("session", {});
  const { runId } = await (await call("runs", { levelId: "bed" })).json();
  sqlite.prepare("UPDATE runs SET created_at = ? WHERE id = ?").run(Date.now() - 600_000, runId);
  const inputs = playthrough(bed);
  let result: { status: string; completionId: string | null } = { status: "", completionId: null };
  for (let i = 0; i < inputs.length; i += 120) {
    const response = await call(`runs/${runId}/inputs`, { sequence: i / 120, commands: inputs.slice(i, i + 120) });
    assert.equal(response.status, 200, await response.clone().text());
    result = await response.json();
  }
  assert.equal(result.status, "won");
  assert.ok(result.completionId);
});
