import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localDatabase } from "../server/local-db.ts";
import { handleApi } from "../server/worker.ts";
import { claimReward, retryDelay } from "../server/coupons.ts";
import { getLevel } from "../src/config/levels.ts";
import { playthrough } from "./playthrough.ts";
import type { Env } from "../server/types.ts";

const winningInputs = playthrough(getLevel("workshop"));
async function fixture() {
  const { db, sqlite } = localDatabase();
  const env: Env = { DB: db, COUPON_GAME_API_KEY: "test-secret-".repeat(4),
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) } };
  let cookie = "", calls = 0;
  let store = (async () => { calls++; return success(); }) as typeof fetch;
  const request = async (path: string, data?: unknown, headers: Record<string, string> = {}) => {
    const response = await handleApi(new Request(`https://game.test/api/game/${path}`, {
      method: data === undefined ? "GET" : "POST",
      headers: { Origin: "https://game.test", "Content-Type": "application/json",
        Cookie: cookie, ...headers },
      body: data === undefined ? undefined : JSON.stringify(data),
    }), env, store);
    if (response.headers.has("Set-Cookie")) cookie = response.headers.get("Set-Cookie")!.split(";")[0];
    return response;
  };
  const login = await request("session", {});
  assert.equal(login.status, 200);
  assert.match(login.headers.get("Set-Cookie")!, /HttpOnly; SameSite=Strict/);
  assert.match(login.headers.get("Set-Cookie")!, /Secure/);
  const created = await request("runs", { levelId: "workshop" });
  assert.equal(created.status, 201);
  const runId = (await created.json()).runId;
  // Advance server wall time without altering gameplay state or inputs.
  sqlite.prepare("UPDATE runs SET created_at = ? WHERE id = ?").run(Date.now() - 600_000, runId);
  const complete = async () => {
    let result: any;
    for (let i = 0; i < winningInputs.length; i += 120) {
      const response = await request(`runs/${runId}/inputs`, { sequence: i / 120, commands: winningInputs.slice(i, i + 120) });
      assert.equal(response.status, 200, await response.clone().text());
      result = await response.json();
    }
    assert.equal(result.status, "won");
    return result.completionId as string;
  };
  return { sqlite, env, request, runId, complete, calls: () => calls,
    setStore: (fn: typeof fetch) => { store = fn; }, clearCookie: () => { cookie = ""; } };
}
function success(status = 201) {
  return new Response(JSON.stringify({ code: "GAME-0123456789ABCDEF0123", discountPercent: 20,
    expiresAt: new Date(Date.now() + 1800_000).toISOString(), expiresInSeconds: 1799, reusable: false }), { status });
}

test("forged victories, missing session, cross-origin and foreign runs cannot issue coupons", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  assert.equal((await f.request(`runs/${f.runId}/inputs`, { sequence: 0, commands: [], won: true })).status, 400);
  assert.equal((await f.request(`runs/${f.runId}/inputs`, { sequence: 0, commands: [{ axis: 1, jump: false, y: 300 }] })).status, 400);
  assert.equal((await f.request(`runs/${f.runId}/inputs`, { sequence: 0, commands: [{ axis: 0, jump: false }] })).status, 200);
  const guessed = f.sqlite.prepare("SELECT completion_id FROM runs WHERE id = ?").get(f.runId)!.completion_id;
  assert.equal((await f.request(`rewards/${guessed}`, {})).status, 404);
  assert.equal((await f.request("session", {}, { "oai-authenticated-user-id": "ignored-header" })).status, 200);
  assert.equal((await f.request("latest", undefined, { Cookie: "" })).status, 401);
  assert.equal((await f.request("session", {}, { Origin: "https://evil.test" })).status, 403);
  f.clearCookie();
  assert.equal((await f.request(`rewards/${guessed}`, {})).status, 401);
  await f.request("session", {});
  assert.equal((await f.request(`runs/${f.runId}/inputs`, { sequence: 1, commands: [{ axis: 0, jump: false }] })).status, 404);
  assert.equal(f.calls(), 0);
});

test("server replay creates one completion; reload returns saved reward, key and expiry", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete();
  const last = Math.floor((winningInputs.length - 1) / 120);
  const retry = { sequence: last, commands: winningInputs.slice(last * 120) };
  assert.equal((await f.request(`runs/${f.runId}/inputs`, retry)).status, 200);
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM completions").get()!.n, 1);
  let sent: { key: string; body: string } | undefined;
  f.setStore((async (url, init) => {
    assert.equal(url, "https://www.artgian.com.br/api/coupons/game");
    const h = new Headers(init!.headers);
    assert.equal(h.get("Authorization"), `Bearer ${f.env.COUPON_GAME_API_KEY}`);
    assert.equal(h.get("Content-Type"), "application/json"); assert.equal(h.has("Origin"), false);
    assert.equal(init!.method, "POST"); assert.equal(init!.redirect, "manual");
    sent = { key: h.get("Idempotency-Key")!, body: init!.body as string };
    return success();
  }) as typeof fetch);
  const first = await f.request(`rewards/${id}`, {});
  assert.equal(first.status, 200); assert.equal(first.headers.get("Cache-Control"), "no-store");
  const reward = await first.json();
  const stored = f.sqlite.prepare("SELECT * FROM completions WHERE id = ?").get(id)!;
  assert.equal(sent!.key, stored.idempotency_key); assert.equal(sent!.body, stored.request_body);
  assert.deepEqual(Object.keys(JSON.parse(sent!.body)).sort(), ["completionId", "playerId"]);
  f.setStore((async () => { throw new Error("Reload must never contact store"); }) as typeof fetch);
  const latest = await (await f.request("latest")).json(); assert.equal(latest.completion.completionId, id);
  const again = await (await f.request(`rewards/${id}`, {})).json();
  assert.equal(again.code, reward.code); assert.equal(again.expiresAt, reward.expiresAt);
  assert.ok(again.expiresInSeconds <= reward.expiresInSeconds);
  assert.equal(f.sqlite.prepare("SELECT attempts FROM completions WHERE id = ?").get(id)!.attempts, 1);
  const player = JSON.parse(sent!.body).playerId;
  const expired = await claimReward(f.env, id, player, fetch, Date.now() + 1900_000);
  assert.equal(expired.status, 410);
  assert.equal((await f.request(`rewards/${id}`, {})).status, 410);
});

test("timeout, 5xx and 429 persist backoff and reuse identical request bytes across retries", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete();
  const requests: string[] = [];
  f.setStore((async (_url, init) => {
    requests.push(JSON.stringify({ headers: init!.headers, body: init!.body }));
    if (requests.length === 1) throw new DOMException("Timeout", "TimeoutError");
    if (requests.length === 2) return new Response(null, { status: 503 });
    if (requests.length === 3) return new Response(null, { status: 429, headers: { "Retry-After": "90" } });
    return success(200);
  }) as typeof fetch);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const before = Date.now();
    const response = await f.request(`rewards/${id}`, {}); assert.equal(response.status, 202);
    const row = f.sqlite.prepare("SELECT * FROM completions WHERE id = ?").get(id)!;
    assert.ok(Number(row.next_attempt_at) >= before + (attempt === 3 ? 90_000 : 1000 * 2 ** (attempt - 1)));
    assert.equal((await f.request(`rewards/${id}`, {})).status, 202);
    assert.equal(requests.length, attempt);
    f.sqlite.prepare("UPDATE completions SET next_attempt_at = 0 WHERE id = ?").run(id);
  }
  assert.equal((await f.request(`rewards/${id}`, {})).status, 200);
  assert.equal(new Set(requests).size, 1);
});

test("410 is terminal and never generates another reward", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete(); let calls = 0;
  f.setStore((async () => { calls++; return new Response(null, { status: 410 }); }) as typeof fetch);
  assert.equal((await f.request(`rewards/${id}`, {})).status, 410);
  assert.equal((await f.request(`rewards/${id}`, {})).status, 410);
  assert.equal(calls, 1);
  f.clearCookie(); await f.request("session", {});
  assert.equal((await f.request(`rewards/${id}`, {})).status, 404);
});

test("parallel claims preserve one idempotent operation", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete(); let release!: () => void, started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const entered = new Promise<void>(resolve => { started = resolve; });
  let calls = 0;
  f.setStore((async () => { calls++; started(); await gate; return success(); }) as typeof fetch);
  const first = f.request(`rewards/${id}`, {});
  await entered;
  assert.equal((await f.request(`rewards/${id}`, {})).status, 202);
  release(); assert.equal((await first).status, 200); assert.equal(calls, 1);
});

test("process restart recovers an expired lease using persisted request bytes", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete();
  const directory = mkdtempSync(join(tmpdir(), "artgian-coupons-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, "game.sqlite");
  const first = localDatabase(filename);
  // Copy a legitimately verified completion into a durable test database, retaining
  // all server-generated IDs, request bytes and authoritative state.
  for (const table of ["players", "runs", "completions"]) {
    for (const row of f.sqlite.prepare(`SELECT * FROM ${table}`).all()) {
      const columns = Object.keys(row);
      first.sqlite.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
        .run(...Object.values(row));
    }
  }
  first.sqlite.prepare("UPDATE completions SET lease_token = 'crashed-worker', lease_until = ?, attempts = 1 WHERE id = ?")
    .run(Date.now() - 1, id);
  const original = first.sqlite.prepare("SELECT * FROM completions WHERE id = ?").get(id)!;
  first.sqlite.close();
  const restarted = localDatabase(filename); t.after(() => restarted.sqlite.close());
  let calls = 0;
  const store = (async (_url, init) => {
    calls++;
    assert.equal(new Headers(init!.headers).get("Idempotency-Key"), original.idempotency_key);
    assert.equal(init!.body, original.request_body);
    return success(200);
  }) as typeof fetch;
  assert.equal((await claimReward({ ...f.env, DB: restarted.db }, id, original.player_id as string, store)).status, 200);
  assert.equal(calls, 1);
});

test("permanent upstream errors do not retry or rotate the key", async t => {
  for (const status of [400, 401, 403, 409, 413]) {
    const f = await fixture(); t.after(() => f.sqlite.close());
    const id = await f.complete(); let calls = 0;
    f.setStore((async () => { calls++; return new Response(null, { status }); }) as typeof fetch);
    assert.equal((await f.request(`rewards/${id}`, {})).status, 422);
    assert.equal((await f.request(`rewards/${id}`, {})).status, 422);
    assert.equal(calls, 1);
  }
});

test("Workers-compatible redirect mode never forwards the secret to a redirect target", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const id = await f.complete(); let calls = 0;
  f.setStore((async (url, init) => {
    calls++;
    assert.equal(url, "https://www.artgian.com.br/api/coupons/game");
    assert.equal(init!.redirect, "manual", "Cloudflare rejects redirect:error before sending the request");
    return new Response(null, { status: 307, headers: { Location: "https://other.example/collect" } });
  }) as typeof fetch);
  assert.equal((await f.request(`rewards/${id}`, {})).status, 422);
  assert.equal((await f.request(`rewards/${id}`, {})).status, 422);
  assert.equal(calls, 1);
});

test("altered replay, expired session and faster-than-real-time input are rejected", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const payload = { sequence: 0, commands: Array.from({ length: 120 }, () => ({ axis: 0, jump: false })) };
  assert.equal((await f.request(`runs/${f.runId}/inputs`, payload)).status, 200);
  payload.commands[0].jump = true;
  assert.equal((await f.request(`runs/${f.runId}/inputs`, payload)).status, 409);
  f.sqlite.prepare("UPDATE runs SET created_at = ? WHERE id = ?").run(Date.now(), f.runId);
  assert.equal((await f.request(`runs/${f.runId}/inputs`, { ...payload, sequence: 1 })).status, 409);
  f.sqlite.prepare("UPDATE sessions SET expires_at = 0").run();
  assert.equal((await f.request("latest")).status, 401);
  assert.equal(f.calls(), 0);
});

test("anonymous session stays stable on reload; client cannot replace server IDs", async t => {
  const f = await fixture(); t.after(() => f.sqlite.close());
  const original = f.sqlite.prepare("SELECT player_id FROM runs WHERE id = ?").get(f.runId)!.player_id;
  await f.request("session", {});
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM players").get()!.n, 1);
  assert.equal(f.sqlite.prepare("SELECT player_id FROM sessions LIMIT 1").get()!.player_id, original);
  assert.equal((await f.request("runs", { levelId: "workshop", playerId: "spoofed" })).status, 400);
  assert.equal((await f.request("runs", { levelId: "fake-level" })).status, 400);
});

test("Retry-After supports seconds and HTTP dates without shortening progressive backoff", () => {
  assert.equal(retryDelay("90", 2, 0), 90_000);
  assert.equal(retryDelay(new Date(120_000).toUTCString(), 1, 0), 120_000);
  assert.equal(retryDelay("1", 4, 0), 8000);
  assert.equal(retryDelay("bad", 4, 0), 8000);
});
