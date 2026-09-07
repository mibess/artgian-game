import Phaser from "phaser";
export class MobileControls {
  left = false;
  right = false;
  jump = false;
  private pointers = new Map<number, string>();
  constructor(s: Phaser.Scene) {
    const make = (
      x: number,
      y: number,
      w: number,
      label: string,
      key: string,
    ) => {
      const bg = s.add
        .rectangle(x, y, w, 56, 0x0b1b28, 0.48)
        .setStrokeStyle(1, 0x9cbdd0, 0.35)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive();
      s.add
        .text(x, y, label, {
          fontFamily: "Arial",
          fontSize: key === "jump" ? "14px" : "26px",
          fontStyle: "bold",
          color: "#d7eef6",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
      bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
        this.pointers.set(p.id, key);
        if (key === "jump") this.jump = true;
        this.sync();
        bg.setFillStyle(0x22637a, 0.9);
      });
      const release = (p: Phaser.Input.Pointer) => {
        this.pointers.delete(p.id);
        this.sync();
        bg.setFillStyle(0x0b1b28, 0.76);
      };
      bg.on("pointerup", release);
      bg.on("pointerout", release);
    };
    make(56, 907, 70, "‹", "left");
    make(139, 907, 70, "›", "right");
    make(450, 907, 104, "PULAR ↑", "jump");
    s.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      this.pointers.delete(p.id);
      this.sync();
    });
    s.game.events.on("blur", this.clear, this);
    s.events.once("shutdown", () =>
      s.game.events.off("blur", this.clear, this),
    );
  }
  sync() {
    this.left = [...this.pointers.values()].includes("left");
    this.right = [...this.pointers.values()].includes("right");
  }
  clear() {
    this.pointers.clear();
    this.left = this.right = this.jump = false;
  }
  consumeJump() {
    const b = this.jump;
    this.jump = false;
    return b;
  }
}
