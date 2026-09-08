import Phaser from "phaser";
import { getLevel, type Level } from "../config/levels";
/** Independent printer plane: the bed never collides with the playable platforms. */
export class PrintingProgressSystem {
  lastLayer: Phaser.GameObjects.Text;
  value = 0;
  hat: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Graphics;
  head: Phaser.GameObjects.Container;
  light: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  ghost: Phaser.GameObjects.Image;
  bed: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Image | undefined;
  private level: Level;
  constructor(private s: Phaser.Scene) {
    this.level = getLevel(s.registry.get("level"));
    const rail = s.add.graphics().setScrollFactor(0).setDepth(-10);
    rail.fillStyle(0x17222d);
    rail.fillRect(180, 20, 330, 16);
    rail.fillStyle(0x7a8a95);
    rail.fillRect(180, 24, 330, 3);
    rail.fillStyle(0xdda553);
    rail.fillRect(180, 35, 330, 2);
    this.bed = s.textures.exists("bed")
      ? s.add
          .image(350, 227, "bed")
          .setDisplaySize(282, 107)
          .setScrollFactor(0)
          .setDepth(-9)
      : s.add
          .graphics()
          .setScrollFactor(0)
          .setDepth(-9)
          .fillStyle(0x384859)
          .fillTriangle(235, 174, 471, 174, 500, 251)
          .fillTriangle(235, 174, 500, 251, 213, 251);
    this.ghost = s.add
      .image(347, 224, this.level.product).setOrigin(0.5, 1)
      .setDisplaySize(this.level.productWidth, this.level.productHeight)
      .setTint(0x719ecd)
      .setAlpha(0.12)
      .setScrollFactor(0)
      .setDepth(-8);
    this.hat = s.add
      .image(347, 224, this.level.product).setOrigin(0.5, 1)
      .setDisplaySize(this.level.productWidth, this.level.productHeight)
      .setScrollFactor(0)
      .setDepth(-7);
    this.mask = s.make.graphics({ x: 0, y: 0 }).setScrollFactor(0);
    this.hat.setMask(this.mask.createGeometryMask());
    const body = s.textures.exists("head")
      ? s.add.image(0, 0, "head").setDisplaySize(145, 112)
      : s.add.rectangle(0, 0, 105, 65, 0x697482).setStrokeStyle(3, 0xeab65c);
    const text = s.add
      .text(0, -10, "3D", {
        fontFamily: "Arial",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#b7a2eb",
      })
      .setOrigin(0.5)
      .setVisible(!s.textures.exists("head"));
    this.head = s.add
      .container(345, 57, [body, text])
      .setScrollFactor(0)
      .setDepth(-6);
    this.light = s.add.graphics().setScrollFactor(0).setDepth(-5);
    this.label = s.add
      .text(282, 242, "CAMADA POR CAMADA", {
        fontFamily: "Trebuchet MS",
        fontStyle: "italic",
        fontSize: "14px",
        color: "#c3b5bd",
      })
      .setOrigin(0.5)
      .setAngle(-3)
      .setScrollFactor(0)
      .setDepth(-5);
    this.lastLayer = s.add
      .text(456, 121, "ÚLTIMA\nCAMADA!", {
        fontFamily: "Trebuchet MS",
        fontStyle: "bold italic",
        fontSize: "17px",
        align: "center",
        color: "#ffe193",
        stroke: "#614d30",
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setAngle(-9)
      .setScrollFactor(0)
      .setDepth(-4)
      .setAlpha(0);
    if (s.textures.exists("glow"))
      this.glow = s.add
        .image(347, 205, "glow")
        .setDisplaySize(255, 105)
        .setTint(0xffba38)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5)
        .setScrollFactor(0)
        .setDepth(-8);
  }
  update(progress: number, time: number) {
    this.value = Math.max(this.value, progress);
    const base = 224,
      printedHeight = this.level.productHeight * this.value;
    this.mask
      .clear()
      .fillStyle(0xffffff)
      .fillRect(347 - this.level.productWidth / 2, base - printedHeight, this.level.productWidth, printedHeight);
    this.head.setPosition(
      345 + Math.sin(time / 650) * 38,
      base - printedHeight - 70,
    );
    this.light
      .clear()
      .fillStyle(0xffbc47, 0.08)
      .fillTriangle(
        this.head.x,
        this.head.y + 49,
        this.head.x - 31,
        base - printedHeight + 4,
        this.head.x + 31,
        base - printedHeight + 4,
      )
      .fillStyle(0xffdda2, 0.9);
    for (let i = 0; i < 5; i++)
      this.light.fillCircle(
        this.head.x + Math.sin(time / 120 + i * 2) * 13,
        base - printedHeight + Math.cos(time / 180 + i) * 6,
        1,
      );
    this.lastLayer.setAlpha(this.value > 0.75 ? 1 : 0);
    this.ghost.setAlpha(0.12 * (1 - this.value));
    this.label.setText(
      this.value >= 1
        ? "IMPRESSÃO CONCLUÍDA!"
        : this.value > 0.75
          ? "Quase lá! ☺"
          : this.level.productName.toUpperCase(),
    );
  }
  destroy() {
    this.mask.destroy();
  }
}
