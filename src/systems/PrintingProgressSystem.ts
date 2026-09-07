import Phaser from "phaser";
export class PrintingProgressSystem {
  value = 0;
  hat: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Graphics;
  head: Phaser.GameObjects.Container;
  light: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  constructor(private s: Phaser.Scene) {
    const rig = s.add.graphics().setScrollFactor(0).setDepth(-10);
    rig.fillStyle(0x08131e, 0.65);
    rig.fillRoundedRect(105, 198, 330, 345, 14);
    rig.lineStyle(3, 0x48545e, 0.7);
    rig.strokeRoundedRect(105, 198, 330, 345, 14);
    [126, 411].forEach((x) => {
      rig.fillStyle(0x56616a);
      rig.fillRect(x, 212, 5, 299);
      rig.fillStyle(0xd59a53, 0.55);
      rig.fillRect(x + 7, 212, 2, 299);
    });
    rig.fillStyle(0x33434d);
    rig.fillRect(120, 485, 300, 17);
    rig.fillStyle(0x47ccea, 0.5);
    rig.fillRect(130, 485, 280, 2);
    rig.fillStyle(0x1c2b35);
    rig.fillRect(136, 504, 268, 22);
    this.hat = s.add
      .image(270, 425, "hat")
      .setScrollFactor(0)
      .setDepth(-9)
      .setAlpha(0.95);
    this.mask = s.make.graphics({ x: 0, y: 0 }).setScrollFactor(0);
    this.hat.setMask(this.mask.createGeometryMask());
    const body = s.add
      .rectangle(0, 0, 75, 54, 0x48525c)
      .setStrokeStyle(3, 0x839098);
    const panel = s.add.rectangle(0, -2, 48, 32, 0x292b43);
    const text = s.add
      .text(0, -3, "3D", {
        fontFamily: "Arial",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#bbabdc",
      })
      .setOrigin(0.5);
    const tip = s.add.triangle(0, 42, -9, -14, 9, -14, 0, 11, 0xe6ac54);
    this.head = s.add
      .container(270, 436, [body, panel, text, tip])
      .setScrollFactor(0)
      .setDepth(-7);
    this.light = s.add.graphics().setScrollFactor(0).setDepth(-8);
    this.label = s.add
      .text(270, 519, "IMPRIMINDO • CHAVEIRO COWBOY", {
        fontFamily: "Arial",
        fontSize: "10px",
        letterSpacing: 1.3,
        color: "#82969e",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(-7);
  }
  update(progress: number, time: number) {
    this.value = Math.max(this.value, progress);
    const base = 498,
      height = 150 * this.value;
    this.mask
      .clear()
      .fillStyle(0xffffff)
      .fillRect(140, base - height, 260, height);
    this.head.setPosition(270 + Math.sin(time / 550) * 83, base - height - 57);
    this.light.clear();
    this.light.fillStyle(0xffb43e, 0.08);
    this.light.fillTriangle(
      this.head.x,
      this.head.y + 35,
      this.head.x - 32,
      base - height + 8,
      this.head.x + 32,
      base - height + 8,
    );
    this.light.fillStyle(0xffdd85, 0.9);
    for (let i = 0; i < 6; i++)
      this.light.fillCircle(
        this.head.x + Math.sin(time / 100 + i * 2) * 16,
        base - height + Math.cos(time / 170 + i) * 8,
        1.1,
      );
    if (this.value >= 1) this.label.setText("ÚLTIMA CAMADA • PEÇA CONCLUÍDA");
  }
  destroy() {
    this.mask.destroy();
  }
}
