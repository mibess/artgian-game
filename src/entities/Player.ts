import Phaser from "phaser";
import { SPEED, JUMP } from "../config/gameConfig";

export type PlayerState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "land"
  | "hurt"
  | "celebrate"
  | "dead";

export class Player extends Phaser.Physics.Arcade.Sprite {
  visual: Phaser.GameObjects.Image;
  state: PlayerState = "idle";
  groundTime = -999;
  bufferTime = -999;
  wasGround = false;
  landingUntil = 0;
  private visualKey = "char-idle-0";
  private forcedKey?: string;

  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "pose0");
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(58, 81).setVisible(false);
    this.visual = s.add
      .image(x, y + 40.5, this.visualKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(118, 164)
      .setDepth(10);
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setSize(44, 112).setOffset(28, 28);
    b.setMaxVelocity(SPEED, 1100);
    this.setCollideWorldBounds(false);
  }

  step(now: number, axis: number, jump: boolean) {
    const b = this.body as Phaser.Physics.Arcade.Body;
    const grounded = b.blocked.down || b.touching.down;
    if (grounded) {
      this.groundTime = now;
      if (!this.wasGround) this.landingUntil = now + 100;
    }
    if (jump) this.bufferTime = now;
    this.setAccelerationX(axis * 2000);
    this.setDragX(axis ? 0 : 2100);
    if (axis) this.setFlipX(axis < 0);
    let jumped = false;
    if (now - this.bufferTime < 130 && now - this.groundTime < 110) {
      this.setVelocityY(-JUMP);
      this.bufferTime = -999;
      this.groundTime = -999;
      jumped = true;
    }
    this.state =
      b.velocity.y < -35
        ? "jump"
        : b.velocity.y > 65
          ? "fall"
          : now < this.landingUntil
            ? "land"
            : Math.abs(b.velocity.x) > 20
              ? "run"
              : "idle";

    this.forcedKey = undefined;
    if (this.state === "jump" || this.state === "fall") {
      const frame =
        b.velocity.y < -470
          ? 2
          : b.velocity.y < -170
            ? 3
            : b.velocity.y < 100
              ? 4
              : b.velocity.y < 420
                ? 5
                : 6;
      this.visualKey = `char-jump-${frame}`;
    } else if (this.state === "land") {
      this.visualKey = "char-jump-8";
    } else if (this.state === "run") {
      const speed = Math.abs(b.velocity.x);
      const row = speed < SPEED * 0.62 ? "walk" : "run";
      const duration = row === "walk" ? 105 : 72;
      this.visualKey = `char-${row}-${Math.floor(now / duration) % 10}`;
    } else {
      this.visualKey = `char-idle-${Math.floor(now / 520) % 10}`;
    }

    this.wasGround = grounded;
    this.x = Phaser.Math.Clamp(this.x, 25, 515);
    return jumped;
  }

  syncVisual() {
    this.visual
      .setPosition(this.x, this.y + 40.5)
      .setTexture(this.forcedKey ?? this.visualKey)
      .setDisplaySize(118, 164)
      .setFlipX(this.flipX)
      .setAlpha(this.alpha);
  }

  pose(state: PlayerState) {
    this.state = state;
    this.forcedKey =
      {
        idle: "char-idle-0",
        run: "char-run-2",
        jump: "char-jump-3",
        fall: "char-jump-5",
        land: "char-jump-8",
        hurt: "char-jump-7",
        celebrate: "char-idle-6",
        dead: "char-jump-0",
      }[state];
  }
}
