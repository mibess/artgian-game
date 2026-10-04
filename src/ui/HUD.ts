import Phaser from "phaser";
import { TOTAL_FILAMENTS } from "../systems/LevelSystem";
import { getLevel } from "../config/levels";
import { formatTime } from "../systems/Records";
export class HUD {
  hearts: Phaser.GameObjects.Image[] = [];
  count: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Graphics;
  percent: Phaser.GameObjects.Text;
  toast: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  private timer: Phaser.GameObjects.Text;
  private filamentIcon: Phaser.GameObjects.Image;
  private shownCount = 0;
  private calloutBusyUntil = 0;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    this.filamentIcon = s.add.image(158, 85, "filament").setDisplaySize(25, 28).setScrollFactor(0).setDepth(91);
    this.count = label(178, 76, `0 / ${total}`, 19, "#ffe3ac", true);
    label(411, 27, "IMPRESSÃO", 14, "#b3d9d6", true);
    this.percent = label(411, 46, "0%", 31, "#ffe1a1", true);
    this.status = label(411, 82, level.productName, 14, "#c3dfdf");
    this.progress = s.add.graphics().setScrollFactor(0).setDepth(91);
    this.timer = s.add.text(516, 146, "⏱ 00:00", {
      fontFamily: "Trebuchet MS, Arial", fontSize: "16px", fontStyle: "bold", color: "#d9f3ee",
      backgroundColor: "#0b2632d9", padding: { x: 10, y: 5 },
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(91);
    this.toast = s.add.text(270, 610, hint, {
      fontFamily: "Trebuchet MS, Arial", fontSize: "18px", color: "#eafff6",
      backgroundColor: "#0a2633ee", padding: { x: 18, y: 12 },
      wordWrap: { width: 430 }, align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(95).setAlpha(0);
  }
  update(lives: number, count: number, p: number, time = 0) {
    this.timer.setText("⏱ " + formatTime(time));
    if (count !== this.shownCount) {
      this.shownCount = count;
      this.pulse(this.count, 1.35);
      this.pulse(this.filamentIcon, 1.45);
      if (count === this.total) this.count.setColor("#9aeedb");
    }
    this.count.setText(`${count} / ${this.total}`);
    this.percent.setText(Math.floor(p * 100) + "%");
    this.status.setText(p >= 1 ? "Pronto!" : getLevel(this.s.registry.get("level")).productName);
    this.status.setScale(Math.min(1, 102 / this.status.width));
    this.progress.clear().fillStyle(0x071720).fillRoundedRect(320, 108, 190, 5, 2)
      .fillStyle(p >= 1 ? 0x9aeedb : 0xffcf83).fillRoundedRect(320, 108, Math.max(1, 190 * p), 5, 2);
    this.hearts.forEach((heart, i) => { heart.setAlpha(i < lives ? 1 : 0.25); });
  }
  private pulse(target: Phaser.GameObjects.Image | Phaser.GameObjects.Text, amount: number) {
    if (this.reducedMotion) return;
    const base = target.getData("baseScale") ?? [target.scaleX, target.scaleY];
    target.setData("baseScale", base);
    this.s.tweens.killTweensOf(target);
    target.setScale(base[0] * amount, base[1] * amount);
    this.s.tweens.add({ targets: target, scaleX: base[0], scaleY: base[1], duration: 260, ease: "Back.Out" });
  }
  damage(lives: number) {
    const heart = this.hearts[lives];
    if (!heart) return;
    heart.setTint(0xff4d5e);
    this.pulse(heart, 1.6);
    this.s.time.delayedCall(320, () => heart.clearTint());
    if (this.reducedMotion) return;
    // A small shard flies off the lost heart.
    const shard = this.s.add.image(heart.x, heart.y, "heart").setDisplaySize(22, 22)
      .setScrollFactor(0).setDepth(92).setTint(0xff7380);
    this.s.tweens.add({ targets: shard, y: heart.y + 60, x: heart.x + 18, angle: 70, alpha: 0,
      duration: 650, ease: "Quad.In", onComplete: () => shard.destroy() });
  }
  /** A short, centered announcement for moments that deserve emphasis. */
  callout(text: string, color = "#ffe1a1", size = 34) {
    // Simultaneous announcements stack instead of overlapping.
    const now = this.s.time.now, y = now < this.calloutBusyUntil ? 330 : 268;
    this.calloutBusyUntil = now + 1100;
    const label = this.s.add.text(270, y, text, {
      fontFamily: "Trebuchet MS, Arial", fontSize: `${size}px`, fontStyle: "bold", color, align: "center",
      stroke: "#06202b", strokeThickness: 7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setShadow(0, 4, "#0008", 8, true, true);
    if (this.reducedMotion) {
      this.s.time.delayedCall(1200, () => label.destroy());
      return label;
    }
    label.setScale(0.4).setAlpha(0);
    this.s.tweens.chain({ targets: label, tweens: [
      { scale: 1, alpha: 1, duration: 260, ease: "Back.Out" },
      { y: y - 28, alpha: 0, delay: 750, duration: 380, ease: "Quad.In" },
    ], onComplete: () => label.destroy() });
    return label;
  }
  message(text: string, hold = 2200) {
    this.s.tweens.killTweensOf(this.toast);
    this.toast.setText(text).setAlpha(1);
    this.s.tweens.add({ targets: this.toast, alpha: 0, delay: hold, duration: 500 });
  }
}
