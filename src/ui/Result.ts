import Phaser from "phaser";
import { getCharacter } from "../config/characters";
import { getLevel } from "../config/levels";
export function result(
  s: Phaser.Scene,
  win: boolean,
  data: { count: number; time: number; lives?: number },
) {
  const character = getCharacter(s.registry.get("character"));
  const level = getLevel(s.registry.get("level"));
  const productScale = Math.min(288 / level.productWidth, 178 / level.productHeight);
  s.cameras.main.setBackgroundColor("#0d1b26");
  s.add
    .image(270, 480, level.background)
    .setDisplaySize(600, 1066)
    .setAlpha(0.22);
  s.add.rectangle(270, 480, 540, 960, 0x08111c, 0.74);
  const glow = s.add.graphics();
  glow.fillStyle(win ? 0x765530 : 0x633342, 0.18);
  glow.fillCircle(270, 340, 210);
  s.add
    .text(270, 112, "A R T G I A N", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#dac8a5",
    })
    .setOrigin(0.5);
  s.add
    .text(270, 150, level.name.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "12px",
      letterSpacing: 3,
      color: "#839eac",
    })
    .setOrigin(0.5);
  s.add
    .image(270, 308, win ? level.product : character.id + "-jump", win ? undefined : 63)
    .setDisplaySize(win ? level.productWidth * productScale : 184 * character.animationScale.jump,
      win ? level.productHeight * productScale : 184 * character.animationScale.jump);
  s.add
    .text(270, 460, win ? "IMPRESSÃO\nCONCLUÍDA!" : "IMPRESSÃO\nINTERROMPIDA", {
      fontFamily: "Arial",
      fontSize: "34px",
      fontStyle: "bold",
      align: "center",
      lineSpacing: 5,
      color: win ? "#f4dbac" : "#efbfc2",
    })
    .setOrigin(0.5);
  s.add
    .text(
      270,
      555,
      win
        ? "Impressão concluída! Mais uma conquista."
        : "Cada tentativa é uma nova camada.",
      { fontFamily: "Arial", fontSize: "16px", color: "#9db1bc" },
    )
    .setOrigin(0.5);
  const secs = Math.floor(data.time / 1000);
  s.add
    .text(
      270,
      625,
      `FILAMENTOS  ${data.count} / ${level.collectibles.length}     •     TEMPO  ${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`,
      { fontFamily: "Arial", fontSize: "14px", color: "#e9ce9d" },
    )
    .setOrigin(0.5);
  if (win)
    for (let i = 0; i < (data.lives ?? 0); i++)
      s.add
        .image(270 + (i - ((data.lives ?? 0) - 1) / 2) * 36, 667, "heart")
        .setDisplaySize(30, 30);
  if (data.count === level.collectibles.length)
    s.add
      .text(270, 709, "✦ FILAMENTO COMPLETO! ✦", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffd274",
      })
      .setOrigin(0.5);
  const b = s.add
    .rectangle(270, 788, 350, 65, 0xe4b56f)
    .setInteractive({ useHandCursor: true });
  s.add
    .text(270, 788, win ? "JOGAR NOVAMENTE  →" : "TENTAR NOVAMENTE  ↻", {
      fontFamily: "Arial",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#19242b",
    })
    .setOrigin(0.5);
  b.on("pointerdown", () => s.scene.start("Game"));
  s.add.text(270, 900, "← Voltar à seleção", { fontFamily: "Arial", fontSize: "17px", color: "#e9ce9d" })
    .setOrigin(0.5).setInteractive({ useHandCursor: true })
    .on("pointerdown", () => s.scene.start("Menu"));
  s.add
    .text(
      270,
      851,
      win
        ? "Escolha outro cenário e uma nova impressão."
        : "Uma nova tentativa espera por você.",
      { fontFamily: "Arial", fontSize: "12px", color: "#738d9c" },
    )
    .setOrigin(0.5);
  s.input.keyboard!.once("keydown-SPACE", () => s.scene.start("Game"));
}
