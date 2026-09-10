import { gameRequest } from "../systems/GameSession.ts";

export function couponReward(completion: Promise<string>, parent = document.querySelector<HTMLElement>("#game")!) {
  const root = document.createElement("section");
  root.className = "coupon-reward";
  root.setAttribute("aria-label", "Recompensa da fase");
  const title = document.createElement("h2"); title.textContent = "Seu cupom Artgian";
  const status = document.createElement("p"); status.setAttribute("role", "status");
  status.textContent = "Validando sua conclusão…";
  const code = document.createElement("input"); code.readOnly = true; code.hidden = true;
  code.setAttribute("aria-label", "Código do cupom");
  const timer = document.createElement("p"); timer.className = "coupon-timer"; timer.hidden = true;
  const copy = document.createElement("button"); copy.type = "button"; copy.textContent = "Copiar cupom"; copy.hidden = true;
  const shop = document.createElement("a"); shop.textContent = "Visitar loja";
  shop.href = "https://www.artgian.com.br/produtos"; shop.target = "_blank"; shop.rel = "noopener noreferrer";
  const terms = document.createElement("p"); terms.className = "coupon-terms";
  terms.textContent = "Uso único • válido por 30 minutos a partir da emissão • não desconta o frete.";
  const close = document.createElement("button"); close.type = "button"; close.className = "coupon-close";
  close.textContent = "Voltar à conquista";
  root.append(title, status, code, timer, copy, shop, terms, close); parent.append(root);
  const controller = new AbortController();
  let disposed = false, timeout: ReturnType<typeof setTimeout> | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => { disposed = true; controller.abort(); clearTimeout(timeout); clearInterval(interval); root.remove(); };
  close.onclick = cleanup;
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(code.value); copy.textContent = "Cupom copiado!"; }
    catch { code.focus(); code.select(); status.textContent = "Selecione e copie o código acima."; }
  };
  const unavailable = (message: string) => {
    status.textContent = message; copy.disabled = true; clearInterval(interval);
  };
  const poll = async (id: string, attempt = 0) => {
    if (disposed) return;
    try {
      const started = performance.now();
      const { response, data } = await gameRequest(`rewards/${id}`, {}, AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]));
      if (disposed) return;
      if (response.status === 200 || response.status === 201) {
        title.textContent = `${data.discountPercent}% de desconto nos produtos`;
        status.textContent = "Sua recompensa está pronta.";
        code.value = data.code; code.hidden = copy.hidden = timer.hidden = false;
        // Anchor to server remaining time using a monotonic clock, discounting network
        // transit. The absolute expiresAt is validated and persisted by the backend.
        const remaining = Math.max(0, Number(data.expiresInSeconds) * 1000 - (performance.now() - started));
        const startMonotonic = performance.now(), startWall = Date.now();
        const update = () => {
          // Wall elapsed also accounts for device sleep on browsers whose monotonic
          // clock stops while suspended. Neither clock can extend the saved reward.
          const elapsed = Math.max(performance.now() - startMonotonic, Date.now() - startWall);
          const seconds = Math.max(0, Math.floor((remaining - elapsed) / 1000));
          timer.textContent = `Expira em ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
          if (seconds === 0) unavailable("Esta recompensa não está mais disponível.");
        };
        interval = setInterval(update, 250); update(); return;
      }
      if (response.status === 410) { unavailable("Esta recompensa não está mais disponível."); return; }
      if (response.status === 202 || response.status === 429 || response.status >= 500) {
        const wait = Math.max(1, Number(response.headers.get("Retry-After")) || 0,
          Number(data.retryAfterSeconds) || 0, Math.min(60, 2 ** attempt));
        status.textContent = "Sua recompensa está sendo preparada. Aguarde…";
        timeout = setTimeout(() => void poll(id, attempt + 1), wait * 1000); return;
      }
      unavailable(data.error ?? "Não foi possível consultar a recompensa.");
    } catch {
      if (disposed) return;
      status.textContent = "Conexão interrompida. Vamos consultar sua recompensa novamente…";
      timeout = setTimeout(() => void poll(id, attempt + 1), Math.min(60_000, 1000 * 2 ** Math.min(attempt, 6)));
    }
  };
  void completion.then(id => poll(id)).catch(e => {
    if (!disposed) unavailable(e instanceof Error ? e.message : "Não foi possível validar a conclusão.");
  });
  return cleanup;
}
