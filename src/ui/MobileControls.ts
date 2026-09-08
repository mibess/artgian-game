import Phaser from "phaser";
export class MobileControls {
  left = false;
  right = false;
  jump = false;
  private pointers = new Map<number, string>();
  private buttons: { key: string; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  constructor(s: Phaser.Scene) {
    // Opaque backing keeps controls readable against every level background.
    s.add.rectangle(270, 906, 540, 108, 0x061723, 0.94)
      .setScrollFactor(0).setDepth(99);
    const make = (
      x: number,
      y: number,
      w: number,
      label: string,
      key: string,
    ) => {
      const bg = s.add
        .rectangle(x, y, w, 92, key === "jump" ? 0xffca70 : 0x173e52, 1)
        .setStrokeStyle(3, key === "jump" ? 0xffe6b5 : 0x94dce9, 1)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });
      const caption = s.add
        .text(x, y, label, {
          fontFamily: "Arial",
          fontSize: key === "jump" ? "22px" : "44px",
          fontStyle: "bold",
          color: key === "jump" ? "#142d38" : "#ffffff",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
      this.buttons.push({ key, bg, label: caption });
      bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
        this.pointers.set(p.id, key);
        if (key === "jump") this.jump = true;
        this.sync();
      });
      const release = (p: Phaser.Input.Pointer) => {
        this.pointers.delete(p.id);
        this.sync();
      };
      bg.on("pointerup", release);
      bg.on("pointerout", release);
    };
    make(62, 904, 96, "←", "left");
    make(172, 904, 96, "→", "right");
    make(446, 904, 156, "PULAR ↑", "jump");
    const releasePointer = (p: Phaser.Input.Pointer) => {
      this.pointers.delete(p.id);
      this.sync();
    };
    s.input.on("pointerup", releasePointer);
    s.input.on("pointerupoutside", releasePointer);
    s.game.events.on("blur", this.clear, this);
    s.events.once("shutdown", () => {
      s.game.events.off("blur", this.clear, this);
      s.input.off("pointerup", releasePointer);
      s.input.off("pointerupoutside", releasePointer);
    });
  }
  sync() {
    this.left = [...this.pointers.values()].includes("left");
    this.right = [...this.pointers.values()].includes("right");
    for (const button of this.buttons) {
      const pressed = [...this.pointers.values()].includes(button.key);
      button.bg.setFillStyle(pressed ? 0x85f0dd : button.key === "jump" ? 0xffca70 : 0x173e52, 1);
      button.label.setColor(pressed || button.key === "jump" ? "#142d38" : "#ffffff");
    }
  }
  clear() {
    this.pointers.clear();
    this.left = this.right = this.jump = false;
    this.sync();
  }
  consumeJump() {
    const b = this.jump;
    this.jump = false;
    return b;
  }
}
