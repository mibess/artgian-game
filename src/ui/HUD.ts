import Phaser from "phaser";
import { TOTAL_FILAMENTS } from "../systems/LevelSystem";
import { getLevel } from "../config/levels";
export class HUD {
  hearts: Phaser.GameObjects.Image[] = [];
  count: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Graphics;
  percent: Phaser.GameObjects.Text;
  toast: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  constructor(private s: Phaser.Scene, private total = TOTAL_FILAMENTS, hint = "A / D para mover • Espaço para pular") {
    const level = getLevel(s.registry.get("level"));
    const label = (x: number, y: number, text: string, size: number, color: string, bold = false) =>
      s.add.text(x, y, text, { fontFamily: "Trebuchet MS, Arial", fontSize: `${size}px`, color,
        fontStyle: bold ? "bold" : "normal" }).setScrollFactor(0).setDepth(91);
    s.add.graphics().setScrollFactor(0).setDepth(89)
      .fillGradientStyle(0x061923, 0x061923, 0x061923, 0x061923, 0.95, 0.95, 0, 0)
      .fillRect(0, 0, 540, 190);
    s.add.graphics().setScrollFactor(0).setDepth(90)
      .fillStyle(0x0b2632, 0.94).fillRoundedRect(304, 14, 222, 112, 18)
      .lineStyle(1, 0xc0ffee, 0.23).strokeRoundedRect(304, 14, 222, 112, 18);
    label(20, 19, level.name.toUpperCase(), 22, "#ecfff7", true);
    label(20, 46, level.subtitle, 15, "#afd2d3");
    for (let i = 0; i < 3; i++)
      this.hearts.push(s.add.image(36 + i * 39, 85, "heart").setDisplaySize(33, 32).setScrollFactor(0).setDepth(91));
    s.add.image(158, 85, "filament").setDisplaySize(25, 28).setScrollFactor(0).setDepth(91);
    this.count = label(178, 76, `0 / ${total}`, 19, "#ffe3ac", true);
    label(411, 27, "IMPRESSÃO", 14, "#b3d9d6", true);
    this.percent = label(411, 46, "0%", 31, "#ffe1a1", true);
    this.status = label(411, 82, level.productName, 14, "#c3dfdf");
    this.progress = s.add.graphics().setScrollFactor(0).setDepth(91);
    this.toast = s.add.text(270, 792, hint, {
      fontFamily: "Trebuchet MS, Arial", fontSize: "18px", color: "#eafff6",
      backgroundColor: "#0a2633ee", padding: { x: 18, y: 12 },
      wordWrap: { width: 430 }, align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95);
    s.time.delayedCall(4200, () => this.toast.setAlpha(0));
  }
  update(lives: number, count: number, p: number) {
    this.count.setText(`${count} / ${this.total}`);
    this.percent.setText(Math.floor(p * 100) + "%");
    this.status.setText(p >= 1 ? "Pronto!" : getLevel(this.s.registry.get("level")).productName);
    this.status.setScale(Math.min(1, 102 / this.status.width));
    this.progress.clear().fillStyle(0x071720).fillRoundedRect(320, 108, 190, 5, 2)
      .fillStyle(p >= 1 ? 0x9aeedb : 0xffcf83).fillRoundedRect(320, 108, Math.max(1, 190 * p), 5, 2);
    this.hearts.forEach((heart, i) => { heart.setAlpha(i < lives ? 1 : 0.25); });
  }
  damage(lives: number) {
    const heart = this.hearts[lives];
    if (heart) this.s.tweens.add({ targets: heart, scaleX: heart.scaleX * 1.25,
      scaleY: heart.scaleY * 1.25, duration: 160, yoyo: true });
  }
  message(text: string) {
    this.s.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(1);
    this.s.tweens.add({ targets: this.toast, alpha: 0, delay: 2200, duration: 500 });
  }
}
