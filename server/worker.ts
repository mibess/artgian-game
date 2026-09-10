import { getLevel, levels } from "../src/config/levels.ts";
import { initialState, stepSimulation, STEP_MS, RULES_VERSION, type Command, type Simulation } from "../src/shared/simulation.ts";
import { claimReward, json } from "./coupons.ts";
import type { Env } from "./types.ts";

interface Run {
  id: string; player_id: string; level_id: string; rules_version: number; state: string;
  sequence: number; last_digest: string | null; completion_id: string; status: string; created_at: number;
}
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",
  new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json")
    throw new ApiError(415, "Envie JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Corpo ausente.");
  let bytes = 0, text = "";
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 8192) { await reader.cancel(); throw new ApiError(413, "Corpo muito grande."); }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const value = JSON.parse(text + decoder.decode());
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ApiError(400, "JSON inválido."); }
}
const exact = (value: Record<string, unknown>, keys: string[]) => {
  if (Object.keys(value).length !== keys.length || keys.some(k => !(k in value)))
    throw new ApiError(400, "Campos inválidos.");
};
async function identity(request: Request, env: Env) {
  // Sites dispatch authenticates and replaces this header. Never expose the Worker
  // on an origin that bypasses dispatch or accepts arbitrary identity headers.
  const subject = request.headers.get("oai-authenticated-user-id");
  if (!subject || subject.length > 512) throw new ApiError(401, "Entre para jogar valendo cupom.");
  const subjectHash = await hash(subject);
  await env.DB.prepare("INSERT INTO players (id, subject) VALUES (?, ?) ON CONFLICT(subject) DO NOTHING")
    .bind(crypto.randomUUID(), subjectHash).run();
  return (await env.DB.prepare("SELECT id FROM players WHERE subject = ?").bind(subjectHash)
    .first<{ id: string }>())!.id;
}
async function session(request: Request, env: Env, playerId: string) {
  const token = request.headers.get("Cookie")?.split(";").map(v => v.trim())
    .find(v => v.startsWith("game_session="))?.slice(13);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, "Sessão expirada. Recarregue para entrar.");
  const found = await env.DB.prepare("SELECT player_id FROM sessions WHERE token_hash = ? AND player_id = ? AND expires_at > ?")
    .bind(await hash(token), playerId, Date.now()).first();
  if (!found) throw new ApiError(401, "Sessão expirada. Recarregue para entrar.");
}
function runResult(run: Run) {
  const s = JSON.parse(run.state) as Simulation;
  return { runId: run.id, levelId: run.level_id, sequence: run.sequence, status: run.status,
    completionId: run.status === "won" ? run.completion_id : null,
    count: s.collected.length, time: s.tick * STEP_MS, lives: s.lives };
}
export async function handleApi(request: Request, env: Env, fetchStore: typeof fetch = fetch): Promise<Response> {
  try {
    const url = new URL(request.url), path = url.pathname, now = Date.now();
    if (request.method !== "GET" && request.method !== "POST") throw new ApiError(405, "Método não permitido.");
    if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (request.method === "POST" && request.headers.get("Origin") !== url.origin))
      throw new ApiError(403, "Origem inválida.");
    const playerId = await identity(request, env);
    if (path === "/api/game/session" && request.method === "POST") {
      exact(await body(request), []);
      try { await session(request, env, playerId); return json({ authenticated: true }); } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 401) throw e;
      }
      const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
      await env.DB.prepare("INSERT INTO sessions (token_hash, player_id, expires_at) VALUES (?, ?, ?)")
        .bind(await hash(token), playerId, now + 30 * 86400_000).run();
      return json({ authenticated: true }, 200, { "Set-Cookie":
        `game_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${url.protocol === "https:" ? "; Secure" : ""}` });
    }
    await session(request, env, playerId);
    if (path === "/api/game/latest" && request.method === "GET") {
      const run = await env.DB.prepare(`SELECT r.* FROM runs r JOIN completions c ON c.run_id = r.id
        WHERE r.player_id = ? ORDER BY c.created_at DESC LIMIT 1`).bind(playerId).first<Run>();
      return json({ completion: run ? runResult(run) : null });
    }
    if (path === "/api/game/runs" && request.method === "POST") {
      const value = await body(request); exact(value, ["levelId"]);
      if (!levels.some(l => l.id === value.levelId)) throw new ApiError(400, "Fase inválida.");
      const latest = await env.DB.prepare("SELECT created_at FROM runs WHERE player_id = ? ORDER BY created_at DESC LIMIT 1")
        .bind(playerId).first<{ created_at: number }>();
      if (latest && now - latest.created_at < 3000) return json({ error: "Aguarde para iniciar outra partida." }, 429, { "Retry-After": "3" });
      const level = getLevel(value.levelId), id = crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO runs (id, player_id, level_id, rules_version, state, completion_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, playerId, level.id, RULES_VERSION,
        JSON.stringify(initialState(level)), crypto.randomUUID(), now).run();
      return json({ runId: id, rulesVersion: RULES_VERSION }, 201);
    }
    const inputRoute = /^\/api\/game\/runs\/([a-f0-9-]{36})\/inputs$/.exec(path);
    if (inputRoute && request.method === "POST") {
      const value = await body(request); exact(value, ["sequence", "commands"]);
      if (!Number.isSafeInteger(value.sequence) || (value.sequence as number) < 0 ||
        !Array.isArray(value.commands) || !value.commands.length || value.commands.length > 120)
        throw new ApiError(400, "Comandos inválidos.");
      for (const c of value.commands) {
        if (!c || typeof c !== "object" || Array.isArray(c)) throw new ApiError(400, "Comando inválido.");
        exact(c, ["axis", "jump"]);
        if (![-1, 0, 1].includes(c.axis) || typeof c.jump !== "boolean") throw new ApiError(400, "Comando inválido.");
      }
      const run = await env.DB.prepare("SELECT * FROM runs WHERE id = ? AND player_id = ?")
        .bind(inputRoute[1], playerId).first<Run>();
      if (!run) throw new ApiError(404, "Partida não encontrada.");
      const digest = await hash(JSON.stringify(value));
      if (run.sequence === (value.sequence as number) + 1 && run.last_digest === digest) return json(runResult(run));
      if (run.sequence !== value.sequence) throw new ApiError(409, "Sequência inválida.");
      if (run.status !== "playing" || run.rules_version !== RULES_VERSION || now - run.created_at > 30 * 60_000)
        throw new ApiError(409, "Esta partida foi encerrada.");
      const state = JSON.parse(run.state) as Simulation;
      if ((state.tick + value.commands.length) * STEP_MS > now - run.created_at + 2000)
        throw new ApiError(409, "Partida adiantada em relação ao servidor.");
      for (const command of value.commands as Command[]) {
        if (state.status !== "playing") throw new ApiError(400, "Comandos após o fim da partida.");
        stepSimulation(state, getLevel(run.level_id), command);
      }
      const updated = JSON.stringify(state);
      // Compare-and-swap plus conditional completion insertion in one atomic batch.
      // Completion identity and request bytes never originate from the browser.
      await env.DB.batch([
        env.DB.prepare(`UPDATE runs SET state = ?, status = ?, sequence = sequence + 1, last_digest = ?
          WHERE id = ? AND sequence = ? AND status = 'playing'`)
          .bind(updated, state.status, digest, run.id, run.sequence),
        env.DB.prepare(`INSERT INTO completions (id, player_id, run_id, idempotency_key, request_body, created_at)
          SELECT completion_id, player_id, id, ?, ?, ? FROM runs WHERE id = ? AND status = 'won'
          ON CONFLICT(run_id) DO NOTHING`)
          .bind(`conclusao-${run.completion_id}`, JSON.stringify({ playerId, completionId: run.completion_id }), now, run.id),
      ]);
      const saved = (await env.DB.prepare("SELECT * FROM runs WHERE id = ?").bind(run.id).first<Run>())!;
      if (saved.last_digest !== digest) throw new ApiError(409, "Conflito de comandos.");
      return json(runResult(saved));
    }
    const rewardRoute = /^\/api\/game\/rewards\/([a-f0-9-]{36})$/.exec(path);
    if (rewardRoute && request.method === "POST") {
      exact(await body(request), []);
      return await claimReward(env, rewardRoute[1], playerId, fetchStore);
    }
    throw new ApiError(404, "Rota não encontrada.");
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error("Game API storage or internal failure");
    return json({ error: "Serviço temporariamente indisponível." }, 503, { "Retry-After": "5" });
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new URL(request.url).pathname.startsWith("/api/") ? handleApi(request, env) : env.ASSETS.fetch(request);
  },
};
