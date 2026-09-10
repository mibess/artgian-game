import Phaser from "phaser";
import { getLevel } from "../config/levels";
import { couponReward } from "./CouponReward";
import type { GameSession } from "../systems/GameSession";

export function victory(s: Phaser.Scene, data: { count: number; time: number; lives?: number }) {
  const level = getLevel(s.registry.get("level"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const text = (x: number, y: number, value: string, size: number, color = "#e8f5f3", bold = false) =>
    s.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color,
      fontStyle: bold ? "bold" : "normal", align: "center" }).setOrigin(0.5);
  const panel = (x: number, y: number, w: number, h: number, fill: number, border: number) =>
    s.add.graphics().fillStyle(fill, 0.96).fillRoundedRect(x, y, w, h, 22)
      .lineStyle(1.5, border, 0.8).strokeRoundedRect(x, y, w, h, 22);
  s.cameras.main.setBackgroundColor("#061e29");
  s.add.image(270, 480, level.background).setDisplaySize(640, 960).setAlpha(0.25);
  s.add.rectangle(270, 480, 540, 960, 0x041b25, 0.7);
  const logo = s.add.image(270, 76, "jump-logo");
  logo.setScale(Math.min(205 / logo.width, 85 / logo.height));
  text(270, 146, level.name.toUpperCase() + "  ·  100% IMPRESSO", 14, "#9fe5d7", true);
  text(270, 213, "MISSÃO\nCONCLUÍDA!", 40, "#ffe1a1", true).setLineSpacing(-1)
    .setShadow(0, 4, "#06141d", 8, true, true);
  panel(36, 285, 468, 225, 0x11363e, 0xb89054);
  s.add.ellipse(270, 397, 260, 38, 0x000c13, 0.5);
  s.add.circle(270, 365, 85, 0xffcd76, 0.07);
  const product = s.add.image(270, 367, level.product);
  product.setScale(Math.min(250 / product.width, 145 / product.height));
  text(270, 462, level.productName, 24, "#fff4dd", true);
  text(270, 489, "MAIS UMA CRIAÇÃO GANHOU FORMA", 14, "#b3d6d4", true);
  const seconds = Math.max(0, Math.floor(data.time / 1000));
  const time = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  const stats = [
    { x: 108, label: "FILAMENTOS", value: `${data.count}/${level.collectibles.length}` },
    { x: 270, label: "TEMPO", value: time },
    { x: 432, label: "VIDAS", value: String(data.lives ?? 0) },
  ];
  for (const stat of stats) {
    panel(stat.x - 72, 535, 144, 104, 0x0e303a, 0x35606a);
    text(stat.x, 561, stat.label, 14, "#b3d6dc", true);
    text(stat.x, 603, stat.value, 30, "#ffffff", true);
  }
  const all = data.count === level.collectibles.length;
  const showReward = () => {
    if (document.querySelector(".coupon-reward")) return;
    const saved = s.registry.get("rewardCompletionId") as string | undefined;
    const session = s.registry.get("rewardSession") as GameSession | undefined;
    const completion = saved ? Promise.resolve(saved) : session ? session.finish().then(run => {
      s.registry.set("rewardCompletionId", run.completionId); return run.completionId!;
    }) : Promise.reject(new Error("Partida em modo treino. Entre antes de iniciar uma nova partida para ganhar cupom."));
    const cleanup = couponReward(completion);
    s.events.once("shutdown", cleanup);
  };
  text(270, 676, "VER MEU CUPOM", 22, "#ffda90", true)
    .setInteractive({ useHandCursor: true }).on("pointerdown", showReward);
  text(270, 708, all ? "Você encontrou todos os filamentos desta fase." : "Volte para encontrar os filamentos que faltaram.", 14, "#a8c8ce");
  let leaving = false;
  const navigate = (scene: string) => {
    if (leaving || document.querySelector(".coupon-reward")) return;
    leaving = true;
    if (reducedMotion) { s.scene.start(scene); return; }
    s.cameras.main.fadeOut(220, 4, 27, 37);
    s.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => s.scene.start(scene));
  };
  const button = (y: number, label: string, primary: boolean, scene: string) => {
    const bg = panel(36, y - 34, 468, 68, primary ? 0xffcb77 : 0x123842, primary ? 0xffe2a8 : 0x507b81);
    text(270, y, label, 20, primary ? "#183039" : "#def5f1", true);
    s.add.zone(270, y, 468, 68).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => navigate(scene))
      .on("pointerover", () => bg.setAlpha(0.8)).on("pointerout", () => bg.setAlpha(1));
  };
  button(780, "JOGAR NOVAMENTE  ↻", true, "Game");
  button(862, "ESCOLHER OUTRA FASE  →", false, "Menu");
  text(270, 924, "Enter ou Espaço para jogar novamente", 14, "#b3d4db");
  const replay = () => navigate("Game");
  s.input.keyboard?.on("keydown-SPACE", replay);
  s.input.keyboard?.on("keydown-ENTER", replay);
  s.events.once("shutdown", () => {
    s.input.keyboard?.off("keydown-SPACE", replay);
    s.input.keyboard?.off("keydown-ENTER", replay);
  });
  showReward();
  if (!reducedMotion) {
    s.cameras.main.fadeIn(350, 4, 27, 37);
    s.tweens.add({ targets: product, y: 359, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    for (let i = 0; i < 32; i++) {
      const confetti = s.add.rectangle(12 + (i * 71) % 516, -20 - i * 16, 5 + i % 3, 10,
        [0xffcd76, 0x8ae5d4, 0xd5b5ff][i % 3]).setDepth(20);
      s.tweens.add({ targets: confetti, y: 780, angle: 240 + i * 19, alpha: 0,
        duration: 2400 + i * 45, delay: i * 25, ease: "Sine.In", onComplete: () => confetti.destroy() });
    }
  }
}
