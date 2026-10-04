import Phaser from "phaser";
import { getCharacter, characterFrameCount } from "../config/characters";
import { getLevel } from "../config/levels";
import { FLOOR, TOP } from "../config/gameConfig";
import { formatTime, loadRecords } from "../systems/Records";
import { victory, type ResultData } from "./Victory";

export function result(s: Phaser.Scene, win: boolean, data: ResultData & { progress?: number }) {
  if (win) { victory(s, data); return; }
  const character = getCharacter(s.registry.get("character"));
  const level = getLevel(s.registry.get("level"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progress = Math.max(0, Math.min(1, data.progress ?? 0));
  const record = data.update?.record ?? loadRecords()[level.id];
  const best = record?.bestProgress ?? progress;
  const percent = Math.floor(progress * 100);
  const text = (x: number, y: number, value: string, size: number, color: string, bold = false) =>
    s.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color, align: "center",
      fontStyle: bold ? "bold" : "normal" }).setOrigin(0.5);
  s.cameras.main.setBackgroundColor("#0d1b26");
  s.add.image(270, 480, level.background).setDisplaySize(600, 1066).setAlpha(0.22);
  s.add.rectangle(270, 480, 540, 960, 0x08111c, 0.74);
  s.add.graphics().fillStyle(0x633342, 0.18).fillCircle(270, 290, 190);
  text(270, 92, "A R T G I A N", 16, "#dac8a5");
  text(270, 126, level.name.toUpperCase(), 12, "#839eac").setLetterSpacing(3);
  const hero = s.add.image(270, 280, character.id + "-jump", characterFrameCount(character) - 1)
    .setDisplaySize(184 * character.animationScale.jump, 184 * character.animationScale.jump);
  text(270, 418, "IMPRESSÃO\nINTERROMPIDA", 34, "#efbfc2", true).setLineSpacing(5);

  const encouragement = data.update?.newProgress && progress > 0.03
    ? "Novo recorde de altura! Você foi mais longe do que nunca."
    : progress >= 0.85 ? "Faltou muito pouco! A última camada está logo ali."
    : progress >= 0.5 ? "Mais da metade impressa. Você está pegando o jeito!"
    : "Cada tentativa é uma nova camada.";
  text(270, 500, encouragement, 16, data.update?.newProgress ? "#ffd27a" : "#9db1bc", !!data.update?.newProgress)
    .setWordWrapWidth(440);

  // The route as a bar: checkpoints, this attempt and the personal best.
  const barX = 70, barW = 400, barY = 568;
  const bar = s.add.graphics();
  bar.fillStyle(0x1b3a46).fillRoundedRect(barX, barY - 7, barW, 14, 7)
    .lineStyle(1, 0x4f7c86, 0.8).strokeRoundedRect(barX, barY - 7, barW, 14, 7);
  text(barX, barY + 34, "INÍCIO", 11, "#5f7c88", true).setOrigin(0, 0.5);
  text(barX + barW, barY + 34, "TOPO", 11, "#5f7c88", true).setOrigin(1, 0.5);
  const fill = s.add.graphics();
  const drawFill = (value: number) => fill.clear().fillStyle(0xffcf83)
    .fillRoundedRect(barX, barY - 7, Math.max(14, barW * value), 14, 7);
  for (const p of level.platforms) if ((p.checkpoint ?? 0) > 0) {
    const x = barX + barW * (FLOOR - p.y) / (FLOOR - TOP);
    bar.fillStyle(0x86e6ca, 0.9).fillCircle(x, barY + 19, 3);
  }
  if (best > progress + 0.005) {
    const x = barX + barW * best;
    bar.lineStyle(2, 0xffe1a1).lineBetween(x, barY - 14, x, barY + 10);
    text(Math.min(x, barX + barW - 34), barY - 26, best >= 1 ? "concluída ✓" : `recorde ${Math.floor(best * 100)}%`,
      12, "#ffe1a1", true);
  }
  const label = text(270, 620, `${percent}% IMPRESSO`, 22, "#ffffff", true);
  text(270, 652, `FILAMENTOS  ${data.count} / ${level.collectibles.length}     •     TEMPO  ${formatTime(data.time)}`,
    14, "#e9ce9d");
  if (record?.attempts) text(270, 678, `Tentativa nº ${record.attempts} nesta fase`, 12, "#738d9c");

  const button = s.add.container(270, 760);
  const buttonArt = s.add.graphics().fillStyle(0x965d2c).fillRoundedRect(-215, -29, 430, 70, 22)
    .fillStyle(0xffce83).fillRoundedRect(-215, -35, 430, 70, 22)
    .lineStyle(2, 0xffe9ba).strokeRoundedRect(-213, -33, 426, 66, 21);
  button.add([buttonArt, s.add.text(0, 0, "TENTAR NOVAMENTE  ↻", {
    fontFamily: "Arial", fontSize: "21px", fontStyle: "bold", color: "#18343a",
  }).setOrigin(0.5)]);
  let leaving = false;
  const go = (scene: string) => {
    if (leaving) return;
    leaving = true;
    s.scene.start(scene);
  };
  s.add.zone(270, 760, 430, 76).setInteractive({ useHandCursor: true })
    .on("pointerdown", () => go("Game"))
    .on("pointerover", () => buttonArt.setAlpha(0.86))
    .on("pointerout", () => buttonArt.setAlpha(1));
  text(270, 822, level.hint, 13, "#738d9c").setWordWrapWidth(440);
  text(270, 880, "← Voltar à seleção", 17, "#e9ce9d")
    .setInteractive({ useHandCursor: true }).on("pointerdown", () => go("Menu"));
  text(270, 924, "Espaço ou Enter para tentar novamente", 13, "#5f7c88");
  const retry = () => go("Game");
  s.input.keyboard?.on("keydown-SPACE", retry);
  s.input.keyboard?.on("keydown-ENTER", retry);
  s.events.once("shutdown", () => {
    s.input.keyboard?.off("keydown-SPACE", retry);
    s.input.keyboard?.off("keydown-ENTER", retry);
  });

  if (reducedMotion) { drawFill(progress); return; }
  s.cameras.main.fadeIn(300, 13, 27, 38);
  s.tweens.add({ targets: hero, y: 270, angle: -4, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  s.tweens.add({ targets: button, scale: 1.03, duration: 800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  // Count the printed percentage up so the result is felt, not just read.
  const counter = { value: 0 };
  drawFill(0);
  s.tweens.add({ targets: counter, value: progress, duration: 900, delay: 250, ease: "Cubic.Out",
    onUpdate: () => {
      drawFill(counter.value);
      label.setText(`${Math.floor(counter.value * 100)}% IMPRESSO`);
    } });
}
