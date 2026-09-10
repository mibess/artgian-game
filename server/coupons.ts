import type { Completion, Env } from "./types.ts";

const ENDPOINT = "https://www.artgian.com.br/api/coupons/game";
export function retryDelay(value: string | null, attempt: number, now: number): number {
  const backoff = Math.min(300_000, 1000 * 2 ** Math.min(attempt - 1, 9));
  const retryAfter = value && /^\d+$/.test(value.trim()) ? Number(value) * 1000 :
    value ? Math.max(0, Date.parse(value) - now) : 0;
  return Math.max(backoff, Number.isFinite(retryAfter) ? retryAfter : 0);
}
export interface Coupon {
  code: string; discountPercent: number; expiresAt: string; expiresInSeconds: number; reusable: false;
}
function coupon(value: unknown): Coupon {
  const c = value as Coupon;
  if (!c || typeof c.code !== "string" || !/^GAME-[A-Z0-9]{1,100}$/.test(c.code) ||
    ![5, 10, 20, 30].includes(c.discountPercent) || c.reusable !== false ||
    typeof c.expiresAt !== "string" || !Number.isFinite(Date.parse(c.expiresAt)) ||
    !Number.isInteger(c.expiresInSeconds) || c.expiresInSeconds < 0 || c.expiresInSeconds > 1800)
    throw new Error("Invalid coupon response");
  return { code: c.code, discountPercent: c.discountPercent, expiresAt: c.expiresAt,
    expiresInSeconds: c.expiresInSeconds, reusable: false };
}
export async function claimReward(env: Env, id: string, playerId: string,
  fetchStore: typeof fetch = fetch, now = Date.now()): Promise<Response> {
  let c = await env.DB.prepare("SELECT * FROM completions WHERE id = ? AND player_id = ?")
    .bind(id, playerId).first<Completion>();
  if (!c) return json({ error: "Conclusão não encontrada." }, 404);
  if (c.status === "ready") {
    const saved = JSON.parse(c.reward!) as Coupon & { deadline: number };
    const remaining = Math.max(0, Math.floor((saved.deadline - now) / 1000));
    if (remaining > 0) return json({ status: "ready", ...saved, expiresInSeconds: remaining });
    await env.DB.prepare("UPDATE completions SET status = 'gone' WHERE id = ? AND status = 'ready'")
      .bind(id).run();
    return gone();
  }
  if (c.status === "gone") return gone();
  if (c.status === "error") return json({ status: "error", error: "Não foi possível liberar a recompensa. Tente falar com a Artgian." }, 422);
  if (c.next_attempt_at > now || c.lease_until > now)
    return pending(Math.max(c.next_attempt_at, c.lease_until) - now, c.attempts > 0);
  // Claim in D1 before any network I/O. Survives parallel requests and process restarts.
  const lease = crypto.randomUUID();
  const claimed = await env.DB.prepare(`UPDATE completions SET lease_token = ?, lease_until = ?, attempts = attempts + 1
    WHERE id = ? AND status = 'pending' AND next_attempt_at <= ? AND lease_until <= ?`)
    .bind(lease, now + 30_000, id, now, now).run();
  if (!claimed.meta.changes) return pending(1000);
  c = { ...c, attempts: c.attempts + 1 };
  let status: Completion["status"] = "pending", reward: string | null = null;
  let delay = retryDelay(null, c.attempts, now);
  try {
    if (!env.COUPON_GAME_API_KEY || env.COUPON_GAME_API_KEY.length < 32) throw new Error("Coupon key unavailable");
    // Never forward request headers (especially Origin, cookies or player supplied auth).
    const response = await fetchStore(ENDPOINT, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${env.COUPON_GAME_API_KEY}`,
        "Content-Type": "application/json", "Idempotency-Key": c.idempotency_key },
      body: c.request_body,
    });
    if (response.status === 200 || response.status === 201) {
      const value = coupon(await response.json());
      const receivedAt = Date.now();
      // Persist a deadline once: a reload must never reset the 30-minute timer.
      const deadline = Math.min(Date.parse(value.expiresAt), receivedAt + value.expiresInSeconds * 1000);
      reward = JSON.stringify({ ...value, deadline });
      status = deadline > receivedAt ? "ready" : "gone";
    } else if (response.status === 410) status = "gone";
    else if (response.status === 429 || response.status >= 500) {
      delay = retryDelay(response.headers.get("Retry-After"), c.attempts, Date.now());
      console.error(JSON.stringify({ event: "coupon_retry", reason: "upstream_status", status: response.status, attempt: c.attempts }));
    }
    else status = "error";
  } catch (error) {
    const reason = !env.COUPON_GAME_API_KEY || env.COUPON_GAME_API_KEY.length < 32 ? "missing_configuration" :
      error instanceof Error && error.message === "Invalid coupon response" ? "invalid_response" : "transport";
    console.error(JSON.stringify({ event: "coupon_retry", reason, attempt: c.attempts,
      errorType: error instanceof Error ? error.name : "unknown" }));
    // Ambiguous timeout/transport/invalid success: retain the original key AND body.
    // Do not log upstream response bodies, codes or credentials.
  }
  await env.DB.prepare(`UPDATE completions SET status = ?, reward = ?, next_attempt_at = ?,
    lease_until = 0, lease_token = NULL WHERE id = ? AND lease_token = ?`)
    .bind(status, reward, Date.now() + delay, id, lease).run();
  if (status === "pending") return pending(delay, true);
  return claimReward(env, id, playerId, fetchStore);
}
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json",
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
const gone = () => json({ status: "gone", error: "Esta recompensa não está mais disponível." }, 410);
const pending = (delay: number, retrying = false) => {
  const seconds = Math.max(1, Math.ceil(delay / 1000));
  return json({ status: "pending", retrying, retryAfterSeconds: seconds }, 202, { "Retry-After": String(seconds) });
};
