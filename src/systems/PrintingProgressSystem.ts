import Phaser from "phaser";
import { getLevel, type Level } from "../config/levels";

/** 20% of the original printer dimensions, fixed in the upper-right HUD. */
export class PrintingProgressSystem {
  value = 0;
  hat: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Graphics;
  head: Phaser.GameObjects.Image;
  light: Phaser.GameObjects.Graphics;
  ghost: Phaser.GameObjects.Image;
  private level: Level;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly scale = 0.2;
  private readonly x = 358;
  private readonly base = 79;
  constructor(private s: Phaser.Scene) {
    this.level = getLevel(s.registry.get("level"));
    const k = this.scale;
    s.add.graphics().setScrollFactor(0).setDepth(92)
      .fillStyle(0x071824, 0.9).fillRoundedRect(318, 25, 80, 68, 12)
      .lineStyle(1, 0x74daca, 0.18).strokeRoundedRect(318, 25, 80, 68, 12)
      .fillStyle(0x728996).fillRect(this.x - 165 * k, 35, 330 * k, 3);
    s.add.image(this.x, this.base + 3 * k, "bed").setDisplaySize(282 * k, 107 * k)
      .setScrollFactor(0).setDepth(93);
    this.ghost = s.add.image(this.x, this.base, this.level.product).setOrigin(0.5, 1)
      .setDisplaySize(this.level.productWidth * k, this.level.productHeight * k)
      .setTint(0x9aeedb).setAlpha(0.22).setScrollFactor(0).setDepth(94);
    this.hat = s.add.image(this.x, this.base, this.level.product).setOrigin(0.5, 1)
      .setDisplaySize(this.level.productWidth * k, this.level.productHeight * k)
      .setScrollFactor(0).setDepth(95);
    this.mask = s.make.graphics({ x: 0, y: 0 }).setScrollFactor(0);
    this.hat.setMask(this.mask.createGeometryMask());
    this.head = s.add.image(this.x, 45, "head").setDisplaySize(145 * k, 112 * k)
      .setScrollFactor(0).setDepth(96);
    this.light = s.add.graphics().setScrollFactor(0).setDepth(97);
  }
  update(progress: number, time: number) {
    this.value = Math.max(this.value, Phaser.Math.Clamp(progress, 0, 1));
    const k = this.scale, height = this.level.productHeight * k * this.value;
    this.mask.clear().fillStyle(0xffffff)
      .fillRect(this.x - this.level.productWidth * k / 2, this.base - height,
        this.level.productWidth * k, height);
    const moving = !this.reducedMotion && this.value < 1;
    this.head.setPosition(this.x + (moving ? Math.sin(time / 650) * 38 * k : 0), this.base - height - 70 * k);
    this.light.clear();
    if (this.value < 1) {
      this.light.fillStyle(0xffd18a, 0.2)
        .fillTriangle(this.head.x, this.head.y + 49 * k, this.head.x - 31 * k,
          this.base - height, this.head.x + 31 * k, this.base - height)
        .fillStyle(0xffe6af, 0.9).fillCircle(this.head.x, this.base - height, 1.4);
    }
    this.ghost.setAlpha(0.22 * (1 - this.value));
  }
  destroy() { this.hat.clearMask(true); this.mask.destroy(); }
}
