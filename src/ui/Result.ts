import Phaser from "phaser";
export function result(
  s: Phaser.Scene,
  win: boolean,
  data: { count: number; time: number; lives?: number },
) {
  s.cameras.main.setBackgroundColor("#0d1b26");
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
    .text(270, 150, "CAMADA POR CAMADA", {
      fontFamily: "Arial",
      fontSize: "12px",
      letterSpacing: 3,
      color: "#839eac",
    })
    .setOrigin(0.5);
  s.add.image(270, 320, win ? "hat" : "pose11").setScale(win ? 1.3 : 1.1);
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
        ? "Pequenas camadas. Grandes conquistas."
        : "Cada tentativa é uma nova camada.",
      { fontFamily: "Arial", fontSize: "16px", color: "#9db1bc" },
    )
    .setOrigin(0.5);
  const secs = Math.floor(data.time / 1000);
  s.add
    .text(
      270,
      625,
      `FILAMENTOS  ${data.count} / 15     •     TEMPO  ${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`,
      { fontFamily: "Arial", fontSize: "14px", color: "#e9ce9d" },
    )
    .setOrigin(0.5);
  if (win)
    s.add
      .text(270, 667, "♥ ".repeat(data.lives ?? 0), {
        fontSize: "27px",
        color: "#ff737a",
      })
      .setOrigin(0.5);
  if (data.count === 15)
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
    .text(270, 788, win ? "PRÓXIMA IMPRESSÃO  →" : "TENTAR NOVAMENTE  ↻", {
      fontFamily: "Arial",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#19242b",
    })
    .setOrigin(0.5);
  b.on("pointerdown", () => s.scene.start("Game"));
  s.add
    .text(
      270,
      851,
      win
        ? "Por enquanto, pratique nesta impressão."
        : "A oficina espera por você.",
      { fontFamily: "Arial", fontSize: "12px", color: "#738d9c" },
    )
    .setOrigin(0.5);
  s.input.keyboard!.once("keydown-SPACE", () => s.scene.start("Game"));
}
