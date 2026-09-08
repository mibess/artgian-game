import Phaser from "phaser";
import { platforms, TOTAL_FILAMENTS } from "../systems/LevelSystem";

export class MenuScene extends Phaser.Scene {
  private character!: Phaser.GameObjects.Image;
  constructor() { super("Menu"); }
  create() {
    this.add.image(270, 480, "workshop-depth").setDisplaySize(640, 960);
    this.add.rectangle(270, 480, 540, 960, 0x08131d, 0.78);
    const text = (x: number, y: number, value: string, size: number, color = "#edf3f2", bold = false) =>
      this.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color, fontStyle: bold ? "bold" : "normal" });
    const panel = (x: number, y: number, w: number, h: number) => {
      const g = this.add.graphics();
      g.fillStyle(0x142630, 0.94).fillRoundedRect(x, y, w, h, 22);
      g.lineStyle(1.5, 0xe7ba79, 0.7).strokeRoundedRect(x, y, w, h, 22);
    };
    text(38, 38, "A R T G I A N", 18, "#e7ba79", true);
    text(38, 87, "Camada\npor camada.", 49, "#f2f4ee", true).setLineSpacing(-3);
    text(40, 207, "Uma oficina. Muitas conquistas.", 17, "#9cb1bb");
    text(40, 261, "01  PERSONAGEM", 14, "#a9bdc6", true);
    panel(36, 290, 468, 244);
    this.character = this.add.image(154, 409, "mib-idle", 0).setDisplaySize(240, 240);
    text(277, 333, "Mib", 34, "#f2f4ee", true);
    text(278, 382, "O criador da oficina.", 16, "#a9bdc6");
    text(278, 409, "Pronto para subir\na próxima camada.", 15, "#a9bdc6").setLineSpacing(5);
    const characterBadge = text(278, 482, "✓ SELECIONADO", 13, "#e7ba79", true);
    this.add.zone(270, 412, 468, 244).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => characterBadge.setText("✓ MIB SELECIONADO"));
    text(40, 563, "02  FASE", 14, "#a9bdc6", true);
    panel(36, 592, 468, 153);
    this.add.image(111, 668, "workshop-depth").setDisplaySize(112, 116);
    text(190, 611, "OFICINA 01", 13, "#e7ba79", true);
    text(190, 639, "A primeira impressão", 21, "#f2f4ee", true);
    text(190, 675, platforms.length + " plataformas  ·  " + TOTAL_FILAMENTS + " filamentos", 14, "#a9bdc6");
    const levelBadge = text(190, 704, "✓ SELECIONADA", 12, "#e7ba79", true);
    this.add.zone(270, 668, 468, 153).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => levelBadge.setText("✓ OFICINA SELECIONADA"));
    const button = this.add.graphics();
    button.fillStyle(0xe7ba79).fillRoundedRect(36, 785, 468, 70, 18);
    text(270, 820, "COMEÇAR A SUBIR  →", 19, "#13232d", true).setOrigin(0.5);
    const start = () => this.scene.start("Game");
    this.add.zone(270, 820, 468, 70).setInteractive({ useHandCursor: true })
      .on("pointerdown", start)
      .on("pointerover", () => button.setAlpha(0.85))
      .on("pointerout", () => button.setAlpha(1));
    text(270, 886, "A / D ou ← → para mover  ·  Espaço para pular", 14, "#91a8b3").setOrigin(0.5);
    text(270, 911, "No celular, use os controles na tela.", 13, "#718995").setOrigin(0.5);
    this.input.keyboard?.once("keydown-SPACE", start);
    this.input.keyboard?.once("keydown-ENTER", start);
  }
  update(time: number) {
    this.character?.setFrame(Math.floor(time / 90) % 64);
  }
}
