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
  private visualTexture = "mib-idle";
  private visualFrame = 0;
  private forcedPose?: { texture: string; frame: number };

  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "pose0");
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(58, 81).setVisible(false);
    this.visual = s.add
      .image(x, y + 40.5, this.visualTexture, this.visualFrame)
      // The character is centered around x=102 and stands near y=238 inside
      // each 256px cell, so anchor the sheets on the physics body's feet.
      .setOrigin(0.4, 0.93)
      .setDisplaySize(165.6, 165.6)
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
      if (!this.wasGround) this.landingUntil = now + 180;
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
      b.velocity.y < 0
        ? "jump"
        : !grounded
          ? "fall"
          : now < this.landingUntil
            ? "land"
            : Math.abs(b.velocity.x) > 20
              ? "run"
              : "idle";

    this.forcedPose = undefined;
    if (this.state === "jump") {
      const progress = Phaser.Math.Clamp((JUMP + b.velocity.y) / JUMP, 0, 1);
      this.visualTexture = "mib-jump";
      this.visualFrame = 6 + Math.round(progress * 24);
    } else if (this.state === "fall") {
      const progress = Phaser.Math.Clamp(b.velocity.y / JUMP, 0, 1);
      this.visualTexture = "mib-jump";
      this.visualFrame = 30 + Math.round(progress * 23);
    } else if (this.state === "land") {
      const progress = Phaser.Math.Clamp(
        1 - (this.landingUntil - now) / 180,
        0,
        1,
      );
      this.visualTexture = "mib-jump";
      this.visualFrame = 54 + Math.round(progress * 9);
    } else if (this.state === "run") {
      const frameDuration = Phaser.Math.Linear(
        62,
        38,
        Math.abs(b.velocity.x) / SPEED,
      );
      this.visualTexture = "mib-walk";
      this.visualFrame = Math.floor(now / frameDuration) % 64;
    } else {
      this.visualTexture = "mib-idle";
      this.visualFrame = Math.floor(now / 90) % 64;
    }

    this.wasGround = grounded;
    this.x = Phaser.Math.Clamp(this.x, 25, 515);
    return jumped;
  }

  syncVisual() {
    const pose = this.forcedPose ?? {
      texture: this.visualTexture,
      frame: this.visualFrame,
    };
    this.visual
      .setPosition(this.x, this.y + 40.5)
      .setTexture(pose.texture, pose.frame)
      .setDisplaySize(165.6, 165.6)
      .setFlipX(this.flipX)
      .setAlpha(this.alpha);
  }

  pose(state: PlayerState) {
    this.state = state;
    this.forcedPose =
      {
        idle: { texture: "mib-idle", frame: 0 },
        run: { texture: "mib-walk", frame: 18 },
        jump: { texture: "mib-jump", frame: 20 },
        fall: { texture: "mib-jump", frame: 42 },
        land: { texture: "mib-jump", frame: 60 },
        hurt: { texture: "mib-jump", frame: 23 },
        celebrate: { texture: "mib-jump", frame: 45 },
        dead: { texture: "mib-jump", frame: 63 },
      }[state];
  }
}
