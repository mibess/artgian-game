import { animateGardenSprite } from "../art/Garden";
import Phaser from "phaser";
import type { PlatformSpec } from "../systems/LevelSystem";
import { beatState, getLevel } from "../config/levels";
export class Platform extends Phaser.Physics.Arcade.Sprite {
  spec: PlatformSpec;
  triggered = false;
  lastX: number;
  lastY: number;
  dx = 0;
  dy = 0;
  private lastTime = 0;
  private activatedAt = -1;
  constructor(s: Phaser.Scene, p: PlatformSpec) {
    const level = getLevel(s.registry.get("level"));
    super(s, p.x, p.y, ["temporary", "sink"].includes(p.kind) ? level.alternate : level.platform);
    this.spec = p;
    this.lastX = p.x;
    this.lastY = p.y;
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(p.w, 44)
      .setOrigin(0.5, 13.5 / 44)
      .setDepth(5);
    if (level.id === "garden") animateGardenSprite(this, ["temporary", "sink"].includes(p.kind) ? "cushion" : "plank");
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setSize(this.width, (this.height * 27) / 44).setOffset(0, 0);
    b.setAllowGravity(false).setImmovable(true);
    b.checkCollision.down = false;
    b.checkCollision.left = false;
    b.checkCollision.right = false;

    if (p.kind === "boost") this.setTint(0x80ffdc);
  }
  step(time: number) {
    this.lastTime = time;
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.spec.kind === "horizontal")
      this.x = this.spec.x + Math.sin(time / 1300) * 55;
    if (this.spec.kind === "vertical")
      this.y = this.spec.y + Math.sin(time / 1400) * 32;
    if (this.spec.kind === "sink" && this.activatedAt >= 0) {
      const elapsed = time - this.activatedAt;
      this.y = this.spec.y + (elapsed < 1600 ? Math.min(42, elapsed * 0.05) : Math.max(0, 42 - (elapsed - 1600) * 0.05));
      if (elapsed >= 2500) { this.activatedAt = -1; this.triggered = false; }
    }
    if (this.spec.kind === "beat") {
      const beat = beatState(time, this.spec.phase ?? 0);
      (this.body as Phaser.Physics.Arcade.Body).enable = beat.solid;
      this.setAlpha(beat.solid ? beat.warning ? 0.5 + Math.sin(time / 45) * 0.25 : 1 : 0.16);
      this.setTint(beat.warning ? 0xffcd79 : beat.solid ? 0xffffff : 0x77628e);
    }
    this.dx = this.x - this.lastX;
    this.dy = this.y - this.lastY;
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }
  touch() {
    if (this.spec.kind === "sink" && !this.triggered) {
      this.triggered = true;
      this.activatedAt = this.lastTime;
    }
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
