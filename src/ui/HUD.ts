import Phaser from "phaser";
export class HUD {
  hearts: Phaser.GameObjects.Text[] = [];
  count: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Graphics;
  percent: Phaser.GameObjects.Text;
  toast: Phaser.GameObjects.Text;
  constructor(private s: Phaser.Scene) {
    const g = s.add.graphics().setScrollFactor(0).setDepth(90);
    g.fillStyle(0x09131d, 0.92);
    g.fillRect(0, 0, 540, 120);
    g.lineStyle(1, 0x52606a, 0.35);
    g.lineBetween(22, 119, 518, 119);
    s.add
      .text(23, 19, "ARTGIAN", {
        fontFamily: "Arial",
        fontSize: "12px",
        letterSpacing: 4,
        color: "#e1c99c",
      })
      .setScrollFactor(0)
      .setDepth(91);
    s.add
      .text(23, 42, "CAMADA POR CAMADA", {
        fontFamily: "Arial",
        fontSize: "19px",
        fontStyle: "bold",
        color: "#f5f2e9",
      })
      .setScrollFactor(0)
      .setDepth(91);
    for (let i = 0; i < 3; i++)
      this.hearts.push(
        s.add
          .text(23 + i * 30, 76, "♥", {
            fontSize: "29px",
            color: "#ff6868",
            stroke: "#562937",
            strokeThickness: 3,
          })
          .setScrollFactor(0)
          .setDepth(91),
      );
    s.add
      .image(424, 37, "spool")
      .setDisplaySize(28, 28)
      .setScrollFactor(0)
      .setDepth(91);
    s.add
      .text(450, 20, "FILAMENTO", {
        fontFamily: "Arial",
        fontSize: "9px",
        letterSpacing: 1,
        color: "#91a9b7",
      })
      .setScrollFactor(0)
      .setDepth(91);
    this.count = s.add
      .text(450, 36, "0 / 15", {
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffce7e",
      })
      .setScrollFactor(0)
      .setDepth(91);
    s.add
      .text(180, 80, "IMPRESSÃO", {
        fontFamily: "Arial",
        fontSize: "9px",
        letterSpacing: 1.5,
        color: "#9caebb",
      })
      .setScrollFactor(0)
      .setDepth(91);
    this.percent = s.add
      .text(371, 77, "0%", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#bdefff",
      })
      .setScrollFactor(0)
      .setDepth(91);
    this.progress = s.add.graphics().setScrollFactor(0).setDepth(91);
    this.toast = s.add
      .text(270, 154, "FASE 01  /  A PRIMEIRA IMPRESSÃO", {
        fontFamily: "Arial",
        fontSize: "12px",
        letterSpacing: 1.4,
        color: "#efdab4",
        backgroundColor: "#12212ddd",
        padding: { x: 15, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(95);
    s.time.delayedCall(4500, () => this.toast.setAlpha(0));
  }
  update(lives: number, count: number, p: number) {
    this.count.setText(count + " / 15");
    this.percent.setText(Math.floor(p * 100) + "%");
    this.progress
      .clear()
      .fillStyle(0x2d414e)
      .fillRoundedRect(180, 101, 225, 4, 2)
      .fillStyle(0x59cce9)
      .fillRoundedRect(180, 101, Math.max(2, 225 * p), 4, 2);
    this.hearts.forEach((h, i) =>
      h.setColor(i < lives ? "#ff6868" : "#37444e"),
    );
  }
  damage(lives: number) {
    const h = this.hearts[lives];
    if (h)
      this.s.tweens.add({ targets: h, scale: 1.4, duration: 160, yoyo: true });
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
