interface InstallEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture the one-use browser event even while Phaser is loading its assets.
let pendingPrompt: InstallEvent | undefined;
let accepted = false;
const changes = new EventTarget();
const displayMode = window.matchMedia("(display-mode: standalone)");
const isInstalled = () => accepted || displayMode.matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(navigator.userAgent);
const isEmbedded = /FBAN|FBAV|Instagram|Line\/|; wv\)/i.test(navigator.userAgent);
const changed = () => changes.dispatchEvent(new Event("change"));
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  pendingPrompt = event as InstallEvent;
  changed();
});
window.addEventListener("appinstalled", () => {
  accepted = true;
  pendingPrompt = undefined;
  changed();
});
displayMode.addEventListener("change", changed);

/** Optional menu control. No automatic modal or prompt interrupts the game. */
export function mountInstallPrompt() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "install-shortcut";
  button.textContent = "＋ Adicionar à tela inicial";
  button.setAttribute("aria-haspopup", "dialog");

  const dialog = document.createElement("dialog");
  dialog.className = "install-dialog";
  dialog.setAttribute("aria-labelledby", "install-title");
  dialog.setAttribute("aria-describedby", "install-description");
  dialog.innerHTML = `
    <img class="install-icon" src="/icons/icon-192.png" width="64" height="64" alt="" />
    <h2 id="install-title">Artgian Jump sempre à mão</h2>
    <p id="install-description">Crie um atalho na tela inicial e abra o jogo como um app.</p>
    <ol class="install-steps"></ol>
    <p class="install-feedback" role="status" aria-live="polite"></p>
    <p class="install-note">É opcional e gratuito. Você ainda precisa de internet para jogar.</p>
    <button class="install-confirm" type="button">Instalar agora</button>
    <button class="install-close" type="button">Agora não</button>
  `;
  // Phaser also handles mouse/touch events on window, including targets outside
  // its canvas. Keep dialog and shortcut interactions out of its hit testing.
  for (const element of [button, dialog]) {
    for (const type of ["pointerdown", "pointerup", "pointermove", "mousedown", "mouseup", "mousemove",
      "touchstart", "touchend", "touchmove", "touchcancel", "wheel"])
      element.addEventListener(type, event => event.stopPropagation());
  }
  const steps = dialog.querySelector<HTMLOListElement>(".install-steps")!;
  const confirm = dialog.querySelector<HTMLButtonElement>(".install-confirm")!;
  const close = dialog.querySelector<HTMLButtonElement>(".install-close")!;
  const feedback = dialog.querySelector<HTMLElement>(".install-feedback")!;
  let disposed = false;
  let busy = false;

  const render = () => {
    button.hidden = isInstalled() || !(pendingPrompt || isIOS || isAndroid);
    if (isInstalled() && dialog.open) dialog.close();
    const instructions = isEmbedded
      ? [`Abra este link no ${isIOS ? "Safari" : "Chrome"}, usando o menu deste aplicativo.`,
        "No navegador, toque novamente em “Adicionar à tela inicial” aqui no jogo."]
      : isIOS
        ? ["Toque em Compartilhar no menu do navegador (ícone de quadrado com seta para cima).",
          "Escolha “Adicionar à Tela de Início”. Se necessário, role a lista de opções.",
          "Se aparecer “Abrir como App da Web”, mantenha ativado. Toque em “Adicionar”."]
        : ["Abra o menu ⋮ do navegador.",
          "Escolha “Instalar app” ou “Adicionar à tela inicial” e confirme."];
    steps.replaceChildren(...instructions.map(instruction => {
      const item = document.createElement("li"); item.textContent = instruction; return item;
    }));
    steps.hidden = Boolean(pendingPrompt) || busy;
    confirm.hidden = !pendingPrompt && !busy;
    confirm.disabled = busy;
    confirm.textContent = busy ? "Aguardando confirmação…" : "Instalar agora";
  };

  button.onclick = () => {
    feedback.textContent = "";
    render();
    if (!button.hidden && !dialog.open) dialog.showModal();
  };
  close.onclick = () => dialog.close();
  confirm.onclick = async () => {
    const event = pendingPrompt;
    if (!event || busy) return;
    pendingPrompt = undefined;
    busy = true;
    feedback.textContent = "";
    render();
    try {
      // Keep prompt() directly in the user's click handler (required by browsers).
      const result = await event.prompt();
      if (result.outcome === "accepted") accepted = true;
      else feedback.textContent = "Tudo bem! Você pode continuar jogando e adicionar o atalho depois pelo menu do navegador.";
    } catch {
      feedback.textContent = "Não foi possível abrir a instalação. Tente pelo menu do navegador seguindo os passos abaixo.";
    } finally {
      busy = false;
      changed();
      if (!disposed) {
        render();
        if (dialog.open) close.focus();
      }
    }
  };
  // Phaser listens on window: do not let Enter/Space on these controls start a game.
  const stopGameKeys = (event: KeyboardEvent) => {
    if (dialog.open || document.activeElement === button) event.stopImmediatePropagation();
  };
  window.addEventListener("keydown", stopGameKeys, true);
  window.addEventListener("keyup", stopGameKeys, true);
  changes.addEventListener("change", render);
  document.querySelector<HTMLElement>("#game")!.append(button);
  document.body.append(dialog);
  render();
  return () => {
    disposed = true;
    changes.removeEventListener("change", render);
    window.removeEventListener("keydown", stopGameKeys, true);
    window.removeEventListener("keyup", stopGameKeys, true);
    if (dialog.open) dialog.close();
    button.remove();
    dialog.remove();
  };
}
