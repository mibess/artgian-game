export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}
export interface Env {
  DB: Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  COUPON_GAME_API_KEY?: string;
}
export interface Completion {
  id: string; player_id: string; run_id: string; idempotency_key: string;
  request_body: string; status: "pending" | "ready" | "gone" | "error";
  reward: string | null; attempts: number; next_attempt_at: number;
  lease_until: number; lease_token: string | null; created_at: number;
}
