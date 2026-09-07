import Phaser from "phaser";
import { SPEED, JUMP } from "../config/gameConfig";
export type PlayerState =
  "idle" | "run" | "jump" | "fall" | "land" | "hurt" | "celebrate" | "dead";
export class Player extends Phaser.Physics.Arcade.Sprite {
  state: PlayerState = "idle";
  groundTime = -999;
  bufferTime = -999;
  wasGround = false;
  landingUntil = 0;
  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "pose0");
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(58, 81).setDepth(10);
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
    const pose =
      this.state === "run"
        ? [5, 14][Math.floor(now / 140) % 2]
        : this.state === "jump"
          ? 6
          : this.state === "fall"
            ? 10
            : this.state === "land"
              ? 4
              : Math.floor(now / 1800) % 2;
    this.setTexture("pose" + pose);
    this.wasGround = grounded;
    this.x = Phaser.Math.Clamp(this.x, 25, 515);
    return jumped;
  }
  pose(state: PlayerState) {
    this.state = state;
    this.setTexture(
      "pose" +
        {
          idle: 0,
          run: 5,
          jump: 6,
          fall: 10,
          land: 4,
          hurt: 9,
          celebrate: 7,
          dead: 11,
        }[state],
    );
  }
}
