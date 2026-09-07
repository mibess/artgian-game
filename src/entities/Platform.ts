import Phaser from "phaser";
import type { PlatformSpec } from "../systems/LevelSystem";
export class Platform extends Phaser.Physics.Arcade.Sprite {
  spec: PlatformSpec;
  triggered = false;
  lastX: number;
  lastY: number;
  dx = 0;
  dy = 0;
  constructor(s: Phaser.Scene, p: PlatformSpec) {
    super(s, p.x, p.y, "platform");
    this.spec = p;
    this.lastX = p.x;
    this.lastY = p.y;
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(p.w, 27).setDepth(5);
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setAllowGravity(false).setImmovable(true);
    b.checkCollision.down = false;
    b.checkCollision.left = false;
    b.checkCollision.right = false;
    if (p.kind === "temporary") this.setTint(0xffbc60);
    if (p.kind === "boost") this.setTint(0x80ffdc);
  }
  step(time: number) {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.spec.kind === "horizontal")
      this.x = this.spec.x + Math.sin(time / 1300) * 55;
    if (this.spec.kind === "vertical")
      this.y = this.spec.y + Math.sin(time / 1400) * 32;
    this.dx = this.x - this.lastX;
    this.dy = this.y - this.lastY;
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }
  touch() {
    if (this.spec.kind !== "temporary" || this.triggered) return;
    this.triggered = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 180,
      yoyo: true,
      repeat: 4,
    });
    this.scene.time.delayedCall(1700, () => {
      this.disableBody(true, true);
      this.scene.time.delayedCall(2800, () => {
        this.enableBody(false, this.spec.x, this.spec.y, true, true);
        this.setAlpha(1);
        this.triggered = false;
      });
    });
  }
}
