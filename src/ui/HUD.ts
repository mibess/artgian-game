import Phaser from "phaser";
import { TOTAL_FILAMENTS } from "../systems/LevelSystem";
export class HUD {
  hearts: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
  count: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Graphics;
  percent: Phaser.GameObjects.Text;
  toast: Phaser.GameObjects.Text;
  constructor(private s: Phaser.Scene, private total = TOTAL_FILAMENTS, hint = "A / D para mover • Espaço para pular") {
    for (let i = 0; i < 3; i++) {
      const h = s.textures.exists("heart")
        ? s.add.image(38 + i * 46, 35, "heart").setDisplaySize(44, 43)
        : s.add
            .text(38 + i * 46, 35, "♥", {
              fontSize: "45px",
              color: "#ff3439",
              stroke: "#0d7ad6",
              strokeThickness: 5,
            })
            .setOrigin(0.5);
      this.hearts.push(h.setScrollFactor(0).setDepth(91));
    }
    s.add
      .rectangle(477, 35, 102, 52, 0x101923, 0.58)
      .setStrokeStyle(1, 0xf2c16e, 0.3)
      .setScrollFactor(0)
      .setDepth(90);
    s.add
      .image(445, 35, "filament")
      .setDisplaySize(25, 29)
      .setScrollFactor(0)
      .setDepth(91);
    s.add
      .text(466, 17, "FILAMENTO", {
        fontFamily: "Arial",
        fontSize: "8px",
        letterSpacing: 0.7,
        color: "#f2d3a1",
      })
      .setScrollFactor(0)
      .setDepth(91);
    this.count = s.add
      .text(466, 32, `0 / ${this.total}`, {
        fontFamily: "Arial",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#fff1d4",
      })
      .setScrollFactor(0)
      .setDepth(91);
    this.percent = s.add
      .text(475, 78, "0%", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#fff2d5",
        stroke: "#1a2027",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(91);
    this.progress = s.add.graphics().setScrollFactor(0).setDepth(91);
    this.toast = s.add
      .text(270, 800, hint, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#f8eedb",
        backgroundColor: "#15212cbb",
        padding: { x: 12, y: 8 },
        wordWrap: { width: 420 }, align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(95);
    s.time.delayedCall(4200, () => this.toast.setAlpha(0));
  }
  update(lives: number, count: number, p: number) {
    this.count.setText(`${count} / ${this.total}`);
    this.percent.setText(Math.floor(p * 100) + "%");
    this.progress
      .clear()
      .fillStyle(0x151f2c, 0.8)
      .fillRoundedRect(432, 66, 86, 3, 1)
      .fillStyle(0xffc268)
      .fillRoundedRect(432, 66, Math.max(1, 86 * p), 3, 1);
    this.hearts.forEach((h, i) => {
      h.setAlpha(i < lives ? 1 : 0.3);
      if (h instanceof Phaser.GameObjects.Image) {
        if (i < lives) h.clearTint();
        else h.setTint(0x33445a);
      }
    });
  }
  damage(lives: number) {
    const h = this.hearts[lives];
    if (h)
      this.s.tweens.add({
        targets: h,
        scaleX: h.scaleX * 1.25,
        scaleY: h.scaleY * 1.25,
        duration: 160,
        yoyo: true,
      });
  }
  message(text: string) {
    this.s.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(1);
    this.s.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: 2200,
      duration: 500,
    });
  }
}
