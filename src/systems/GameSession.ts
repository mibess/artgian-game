import { RULES_VERSION, type Command } from "../shared/simulation.ts";

export interface CompletedRun {
  runId: string; completionId: string | null; levelId: string;
  count: number; time: number; lives: number; status: string;
}
export class GameApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export async function gameRequest(path: string, body?: unknown, signal?: AbortSignal) {
  const response = await fetch(`/api/game/${path}`, {
    method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: signal ?? AbortSignal.timeout(12_000),
  });
  const data = await response.json();
  return { response, data };
}
async function required(path: string, body?: unknown) {
  const { response, data } = await gameRequest(path, body);
  if (!response.ok) throw new GameApiError(response.status, data.error ?? "Serviço indisponível.");
  return data;
}
export async function restoreCompletion(): Promise<CompletedRun | null> {
  await required("session", {});
  return (await required("latest")).completion;
}
export class GameSession {
  private runId = "";
  private sequence = 0;
  private pending: Command[] = [];
  private queue: Promise<void> = Promise.resolve();
  private failure?: Error;
  completion: CompletedRun | null = null;
  async start(levelId: string) {
    await required("session", {});
    const run = await required("runs", { levelId });
    if (run.rulesVersion !== RULES_VERSION) throw new Error("Recarregue para atualizar o jogo.");
    this.runId = run.runId;
  }
  record(command: Command) {
    if (!this.runId || this.failure) return;
    this.pending.push(command);
    if (this.pending.length >= 120) this.flush();
  }
  private flush() {
    if (!this.pending.length || !this.runId || this.failure) return;
    const payload = { sequence: this.sequence++, commands: this.pending };
    this.pending = [];
    this.queue = this.queue.then(async () => {
      if (this.failure) return;
      for (let attempt = 0; ; attempt++) {
        try {
          const { response, data } = await gameRequest(`runs/${this.runId}/inputs`, payload);
          if (response.ok) { if (data.completionId) this.completion = data; return; }
          if (response.status < 500 && response.status !== 429) throw new GameApiError(response.status, data.error);
          const retry = Number(response.headers.get("Retry-After") ?? 0);
          await new Promise(resolve => setTimeout(resolve, Math.max(retry * 1000, Math.min(30_000, 1000 * 2 ** attempt))));
        } catch (e) {
          if (e instanceof GameApiError || attempt >= 8) throw e;
          await new Promise(resolve => setTimeout(resolve, Math.min(30_000, 1000 * 2 ** attempt)));
        }
        if (attempt >= 8) throw new Error("A conexão foi interrompida. Recarregue para consultar a recompensa salva.");
      }
    }).catch(e => { this.failure = e instanceof Error ? e : new Error("Falha na validação."); });
  }
  async finish(): Promise<CompletedRun> {
    this.flush();
    await this.queue;
    if (this.failure) throw this.failure;
    if (!this.completion?.completionId) throw new Error("Esta partida não tem uma conclusão validada para cupom.");
    return this.completion;
  }
}
