import Phaser from "phaser";

const icon = (path: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = {
  left: icon('<path d="m14 5-7 7 7 7M7 12h13"/>'),
  right: icon('<path d="m10 5 7 7-7 7M4 12h13"/>'),
  jump: icon('<path d="m5 10 7-7 7 7M12 3v18"/>'),
  pause: icon('<path d="M8 5v14M16 5v14"/>'),
  play: icon('<path d="m8 4 12 8-12 8Z"/>'),
  menu: icon('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  sound: icon('<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>'),
};
interface Actions { pause: () => void; menu: () => void; sound: () => boolean; unlock: () => void }
export class MobileControls {
  left = false;
  right = false;
  jump = false;
  private pointers = new Map<string, string>();
  private buttons = new Map<string, HTMLButtonElement>();
  private root = document.createElement("div");
  private abort = new AbortController();
  private pauseButton: HTMLButtonElement;
  constructor(s: Phaser.Scene, actions: Actions) {
    const { signal } = this.abort;
    this.root.className = "game-controls";
    this.root.setAttribute("aria-label", "Controles do jogo");
    const utilities = document.createElement("div");
    utilities.className = "control-utilities";
    const pad = document.createElement("div");
    pad.className = "action-pad";
    const direction = document.createElement("div");
    direction.className = "direction-pad";
    pad.append(direction);
    const button = (parent: HTMLElement, label: string, art: string, css = "") => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "game-button " + css;
      b.setAttribute("aria-label", label);
      b.title = label;
      b.innerHTML = art;
      b.addEventListener("contextmenu", e => e.preventDefault(), { signal });
      parent.append(b);
      return b;
    };
    const movement = (key: "left" | "right" | "jump", label: string) => {
      const b = button(key === "jump" ? pad : direction, label,
        icons[key] + (key === "jump" ? "<span>PULAR</span>" : ""), key === "jump" ? "jump-button" : "");
      this.buttons.set(key, b);
      const press = (id: string) => {
        if (this.pointers.has(id)) return;
        this.pointers.set(id, key);
        if (key === "jump") this.jump = true;
        this.sync();
      };
      const release = (id: string) => { this.pointers.delete(id); this.sync(); };
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        press(String(e.pointerId));
      }, { signal });
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"] as const)
        b.addEventListener(event, e => release(String(e.pointerId)), { signal });
      b.addEventListener("keydown", e => {
        if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); press(e.code); }
      }, { signal });
      b.addEventListener("keyup", e => {
        if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); release(e.code); }
      }, { signal });
      b.addEventListener("blur", () => {
        for (const [id, action] of this.pointers) if (action === key) this.pointers.delete(id);
        this.sync();
      }, { signal });
    };
    movement("left", "Mover para a esquerda");
    movement("right", "Mover para a direita");
    movement("jump", "Pular");
    this.pauseButton = button(utilities, "Pausar", icons.pause, "utility-button");
    this.pauseButton.setAttribute("aria-pressed", "false");
    this.pauseButton.addEventListener("click", actions.pause, { signal });
    const sound = button(utilities, "Desativar som", icons.sound, "utility-button");
    sound.setAttribute("aria-pressed", "false");
    sound.addEventListener("click", () => {
      const muted = actions.sound();
      sound.setAttribute("aria-pressed", String(muted));
      sound.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
      sound.title = muted ? "Ativar som" : "Desativar som";
    }, { signal });
    button(utilities, "Voltar à seleção", icons.menu, "utility-button")
      .addEventListener("click", actions.menu, { signal });
    this.root.append(pad, utilities);
    this.root.addEventListener("pointerdown", actions.unlock, { capture: true, signal });
    this.root.addEventListener("keydown", e => {
      actions.unlock();
      if (e.code === "Space" || e.code === "Enter") e.stopPropagation();
    }, { signal });
    document.querySelector("#game")!.append(this.root);
    window.addEventListener("blur", () => this.clear(), { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.clear(); }, { signal });
    s.events.once("shutdown", () => {
      this.clear();
      this.abort.abort();
      this.root.remove();
    });
  }
  setPaused(paused: boolean) {
    this.pauseButton.innerHTML = paused ? icons.play : icons.pause;
    this.pauseButton.setAttribute("aria-pressed", String(paused));
    this.pauseButton.setAttribute("aria-label", paused ? "Continuar" : "Pausar");
    this.pauseButton.title = paused ? "Continuar" : "Pausar";
    this.clear();
  }
  sync() {
    const actions = [...this.pointers.values()];
    this.left = actions.includes("left");
    this.right = actions.includes("right");
    for (const [key, button] of this.buttons) button.dataset.pressed = String(actions.includes(key));
  }
  clear() { this.pointers.clear(); this.left = this.right = this.jump = false; this.sync(); }
  consumeJump() { const jump = this.jump; this.jump = false; return jump; }
}
