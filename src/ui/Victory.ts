import { animateGardenSprite } from "../art/Garden";
import Phaser from "phaser";
import { getLevel, levels } from "../config/levels";
import { getCharacter } from "../config/characters";
import { couponReward } from "./CouponReward";
import type { GameSession } from "../systems/GameSession";
import { STAR_GOALS, formatTime, hasStar, loadRecords, totalStars, type RecordUpdate } from "../systems/Records";
import { AudioSystem } from "../systems/AudioSystem";

export interface ResultData {
  count: number; time: number; lives?: number; update?: RecordUpdate;
  /** Whether this character cleared this level for the first time, and its total clears. */
  heroFirst?: boolean; heroClears?: number;
}

export function victory(s: Phaser.Scene, data: ResultData) {
  const level = getLevel(s.registry.get("level"));
  const next = levels[levels.indexOf(level) + 1];
  const record = data.update?.record ?? loadRecords()[level.id];
  // Reaching this screen always earns the first star, even without saved records.
  const earned = data.update?.stars ?? [true, hasStar(record, 1), hasStar(record, 2)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Effects only; the page already has a user gesture, so this context may start.
  const audio = new AudioSystem();
  audio.unlock();
  audio.stopMusic();
  s.events.once("shutdown", () => audio.destroy());
  const text = (x: number, y: number, value: string, size: number, color = "#e8f5f3", bold = false) =>
    s.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color,
      fontStyle: bold ? "bold" : "normal", align: "center" }).setOrigin(0.5);
  const panel = (x: number, y: number, w: number, h: number, fill: number, border: number, radius = 22) =>
    s.add.graphics().fillStyle(fill, 0.96).fillRoundedRect(x, y, w, h, radius)
      .lineStyle(1.5, border, 0.8).strokeRoundedRect(x, y, w, h, radius);
  s.cameras.main.setBackgroundColor("#061e29");
  s.add.image(270, 480, level.background).setDisplaySize(640, 960).setAlpha(0.25);
  s.add.rectangle(270, 480, 540, 960, 0x041b25, 0.7);
  const rays = s.add.image(270, 236, "glow").setDisplaySize(520, 300).setTint(0xffc96b)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.22);
  const logo = s.add.image(270, 58, "jump-logo");
  logo.setScale(Math.min(170 / logo.width, 70 / logo.height));
  text(270, 116, level.name.toUpperCase() + "  ·  100% IMPRESSO", 14, "#9fe5d7", true);
  text(270, 158, "MISSÃO CONCLUÍDA!", 36, "#ffe1a1", true).setShadow(0, 4, "#06141d", 8, true, true);

  // Three goals, revealed one by one. Earlier stars stay lit as accumulated progress.
  const starX = [170, 270, 370], starY = [230, 218, 230], starSize = [70, 88, 70];
  const stars = starX.map((x, i) => {
    s.add.image(x, starY[i], "star-empty").setDisplaySize(starSize[i], starSize[i]);
    const star = s.add.image(x, starY[i], "star").setDisplaySize(starSize[i], starSize[i]);
    star.setVisible(earned[i]);
    return star;
  });
  const goals = STAR_GOALS.map((goal, i) =>
    text(starX[i], 280, goal.toUpperCase(), 12, earned[i] ? "#ffe1a1" : "#6f8f96", true));
  const master = !!data.update?.newStars && totalStars(loadRecords()) >= levels.length * 3;
  const heroDone = !!data.heroFirst && (data.heroClears ?? 0) >= levels.length;
  const badge = master ? "🏆 TROFÉU DE MESTRE IMPRESSOR!"
    : heroDone ? `🏅 ${getCharacter(s.registry.get("character")).name.toUpperCase()} ZEROU TODAS AS FASES!`
    : data.update?.firstClear ? "PRIMEIRA CONCLUSÃO!"
    : data.update?.newStars ? `+${data.update.newStars} ESTRELA${data.update.newStars > 1 ? "S" : ""} NOVA${data.update.newStars > 1 ? "S" : ""}!`
    : data.update?.newTime ? "NOVO RECORDE DE TEMPO!" : "";

  panel(36, 326, 468, 176, 0x11363e, 0xb89054);
  s.add.image(270, 434, "glow").setDisplaySize(260, 44).setTint(0x000000).setAlpha(0.55);
  s.add.image(270, 400, "glow").setDisplaySize(240, 200).setTint(0xffcd76)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18);
  const product = s.add.sprite(270, 402, level.product);
  product.setScale(Math.min(220 / product.width, 112 / product.height));
  if (level.id === "garden") animateGardenSprite(product, "bowl");
  text(270, 474, level.productName, 22, "#fff4dd", true);

  const stats = [
    { x: 108, label: "FILAMENTOS", value: `${data.count}/${level.collectibles.length}`, goal: 1,
      sub: `melhor ${record?.bestFilaments ?? data.count}` },
    { x: 270, label: "TEMPO", value: formatTime(data.time), goal: -1,
      sub: data.update?.newTime ? "novo recorde!" : record?.bestTime ? `recorde ${formatTime(record.bestTime)}` : "" },
    { x: 432, label: "VIDAS", value: `${data.lives ?? 0}/3`, goal: 2, sub: (data.lives ?? 0) >= 3 ? "sem dano!" : "" },
  ];
  for (const stat of stats) {
    const lit = stat.goal >= 0 && earned[stat.goal];
    panel(stat.x - 72, 516, 144, 104, lit ? 0x2a3f2e : 0x0e303a, lit ? 0xffcf7a : 0x35606a, 18);
    text(stat.x, 538, stat.label, 13, "#b3d6dc", true);
    text(stat.x, 574, stat.value, 28, "#ffffff", true);
    if (stat.sub) text(stat.x, 603, stat.sub, 12, stat.sub.includes("!") ? "#ffd27a" : "#89aab0", true);
  }
  const missing = !earned[1] ? "Colete todos os filamentos para ganhar a 2ª estrela."
    : !earned[2] ? "Conclua sem perder vidas para ganhar a 3ª estrela."
    : "Fase perfeita! Todas as estrelas conquistadas.";

  const showReward = () => {
    if (document.querySelector(".coupon-reward") || !s.scene.isActive()) return;
    const saved = s.registry.get("rewardCompletionId") as string | undefined;
    const session = s.registry.get("rewardSession") as GameSession | undefined;
    const completion = saved ? Promise.resolve(saved) : session ? session.finish().then(run => {
      s.registry.set("rewardCompletionId", run.completionId); return run.completionId!;
    }) : Promise.reject(new Error("Não foi possível conectar esta partida ao servidor. Verifique sua conexão e jogue novamente para ganhar um cupom."));
    const cleanup = couponReward(completion);
    s.events.once("shutdown", cleanup);
  };
  const couponLink = text(270, 650, "🎁  VER MEU CUPOM", 21, "#ffda90", true)
    .setInteractive({ useHandCursor: true }).on("pointerdown", showReward);
  text(270, 680, missing, 14, "#a8c8ce");
  let leaving = false;
  const navigate = (scene: string, levelId = level.id) => {
    if (leaving || document.querySelector(".coupon-reward")) return;
    leaving = true;
    s.registry.set("level", levelId);
    if (reducedMotion) { s.scene.start(scene); return; }
    s.cameras.main.fadeOut(220, 4, 27, 37);
    s.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => s.scene.start(scene));
  };
  const button = (y: number, label: string, primary: boolean, go: () => void) => {
    const bg = panel(36, y - 32, 468, 64, primary ? 0xffcb77 : 0x123842, primary ? 0xffe2a8 : 0x507b81);
    text(270, y, label, 20, primary ? "#183039" : "#def5f1", true);
    s.add.zone(270, y, 468, 64).setInteractive({ useHandCursor: true })
      .on("pointerdown", go)
      .on("pointerover", () => bg.setAlpha(0.8)).on("pointerout", () => bg.setAlpha(1));
  };
  const replay = () => navigate("Game");
  if (next) {
    button(748, `PRÓXIMA FASE: ${next.name.toUpperCase()}  →`, true, () => navigate("Game", next.id));
    button(824, "JOGAR NOVAMENTE  ↻", false, replay);
  } else {
    button(748, "JOGAR NOVAMENTE  ↻", true, replay);
    button(824, "ESCOLHER OUTRA FASE", false, () => navigate("Menu"));
  }
  if (next) text(380, 884, "Escolher outra fase", 16, "#9fc5cc", true)
    .setInteractive({ useHandCursor: true }).on("pointerdown", () => navigate("Menu"));
  const starTotal = earned.filter(Boolean).length;
  const shareText = `Imprimi ${level.productName} na fase ${level.name} do Artgian Jump com ${starTotal} ${starTotal === 1 ? "estrela" : "estrelas"} ★ em ${formatTime(data.time)}! Consegue me superar?`;
  const share = text(next ? 160 : 270, 884, "↗  Compartilhar", 16, "#ffda90", true)
    .setInteractive({ useHandCursor: true }).on("pointerdown", async () => {
      if (document.querySelector(".coupon-reward")) return;
      const url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: "Artgian Jump", text: shareText, url });
        else {
          await navigator.clipboard.writeText(`${shareText} ${url}`);
          share.setText("✓  Texto copiado!");
        }
      } catch { /* Cancelled by the player. */ }
    });
  text(270, 926, next ? "Enter: próxima fase  ·  Espaço: jogar novamente" : "Enter ou Espaço para jogar novamente", 13, "#7fa3ab");
  const primary = () => next ? navigate("Game", next.id) : replay();
  s.input.keyboard?.on("keydown-SPACE", replay);
  s.input.keyboard?.on("keydown-ENTER", primary);
  s.events.once("shutdown", () => {
    s.input.keyboard?.off("keydown-SPACE", replay);
    s.input.keyboard?.off("keydown-ENTER", primary);
  });

  if (reducedMotion) {
    if (badge) text(270, 306, badge, 13, "#ffd27a", true);
    s.time.delayedCall(400, showReward);
    return;
  }
  s.cameras.main.fadeIn(350, 4, 27, 37);
  s.tweens.add({ targets: rays, alpha: 0.4, scaleX: rays.scaleX * 1.12, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  s.tweens.add({ targets: product, y: 394, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  s.tweens.add({ targets: couponLink, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  // Pop the stars in sequence; the coupon opens only after the celebration.
  stars.forEach((star, i) => {
    if (!earned[i]) return;
    const size = starSize[i];
    star.setDisplaySize(size * 0.1, size * 0.1).setAlpha(0).setAngle(-40);
    s.tweens.add({ targets: star, displayWidth: size, displayHeight: size, alpha: 1, angle: 0,
      delay: 450 + i * 380, duration: 420, ease: "Back.Out",
      onStart: () => {
        audio.play("star", i);
        goals[i].setColor("#ffe1a1");
      },
      onComplete: () => {
        const ring = s.add.image(star.x, star.y, "ring").setDisplaySize(size, size).setTint(0xffd27a);
        s.tweens.add({ targets: ring, displayWidth: size * 2.2, displayHeight: size * 2.2, alpha: 0,
          duration: 500, onComplete: () => ring.destroy() });
        for (let k = 0; k < 10; k++) {
          const spark = s.add.image(star.x, star.y, "particle").setTint(0xffe1a1).setScale(0.35);
          const a = k / 10 * Math.PI * 2;
          s.tweens.add({ targets: spark, x: star.x + Math.cos(a) * 70, y: star.y + Math.sin(a) * 70,
            alpha: 0, scale: 0.1, duration: 550, onComplete: () => spark.destroy() });
        }
      } });
  });
  const revealEnd = 450 + earned.lastIndexOf(true) * 380 + 500;
  if (badge) {
    const label = text(270, 306, badge, 14, "#ffd27a", true).setAlpha(0).setScale(0.6);
    s.tweens.add({ targets: label, alpha: 1, scale: 1, delay: revealEnd, duration: 300, ease: "Back.Out" });
  }
  s.time.delayedCall(revealEnd + 1300, showReward);
  for (let i = 0; i < 40; i++) {
    const confetti = s.add.rectangle(12 + (i * 71) % 516, -20 - i * 16, 5 + i % 3, 10,
      [0xffcd76, 0x8ae5d4, 0xd5b5ff, 0xff9fb8][i % 4]).setDepth(20);
    s.tweens.add({ targets: confetti, y: 980, x: confetti.x + Math.sin(i) * 60, angle: 240 + i * 19, alpha: 0.2,
      duration: 2600 + i * 45, delay: i * 25, ease: "Sine.In", onComplete: () => confetti.destroy() });
  }
}
