import Phaser from "phaser";
import { SPEED, JUMP } from "../config/gameConfig";
import { getCharacter, characterFrameCount, landingFrame, type Character } from "../config/characters";

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
  private character: Character;
  private visualFrame = 0;
  private forcedPose?: { texture: string; frame: number };

  constructor(s: Phaser.Scene, x: number, y: number) {
    super(s, x, y, "pose0");
    this.character = getCharacter(s.registry.get("character"));
    this.visualTexture = this.character.id + "-idle";
    s.add.existing(this);
    s.physics.add.existing(this);
    this.setDisplaySize(58, 81).setVisible(false);
    this.visual = s.add
      .image(x, y + 40.5, this.visualTexture, this.visualFrame)
      // Anchor each character's sheets on the physics body's feet.
      .setOrigin(this.character.originX, this.character.originY)
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
      this.visualTexture = this.character.id + "-jump";
      const { start, apex } = this.character.jumpFrames;
      this.visualFrame = start + Math.round(progress * (apex - start));
    } else if (this.state === "fall") {
      const progress = Phaser.Math.Clamp(b.velocity.y / JUMP, 0, 1);
      this.visualTexture = this.character.id + "-jump";
      const { apex, fallEnd } = this.character.jumpFrames;
      this.visualFrame = apex + Math.round(progress * (fallEnd - apex));
    } else if (this.state === "land") {
      const progress = Phaser.Math.Clamp(
        1 - (this.landingUntil - now) / 180,
        0,
        1,
      );
      this.visualTexture = this.character.id + "-jump";
      this.visualFrame = landingFrame(this.character, progress);
    } else if (this.state === "run") {
      const frameDuration = Phaser.Math.Linear(
        62,
        38,
        Math.abs(b.velocity.x) / SPEED,
      );
      this.visualTexture = this.character.id + "-walk";
      this.visualFrame = Math.floor(now / frameDuration) % characterFrameCount(this.character);
    } else {
      this.visualTexture = this.character.id + "-idle";
      this.visualFrame = Math.floor(now / (this.character.idleFrameMs ?? 90)) % characterFrameCount(this.character);
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
    const action = pose.texture.endsWith("-jump")
      ? "jump"
      : pose.texture.endsWith("-walk") ? "walk" : "idle";
    const size = 165.6 * this.character.animationScale[action];
    this.visual
      .setPosition(this.x, this.y + 40.5)
      .setTexture(pose.texture, Math.min(pose.frame, characterFrameCount(this.character) - 1))
      .setDisplaySize(size, size)
      .setFlipX(this.flipX)
      .setAlpha(this.alpha);
  }

  pose(state: PlayerState) {
    this.state = state;
    this.forcedPose =
      {
        idle: { texture: this.character.id + "-idle", frame: 0 },
        run: { texture: this.character.id + "-walk", frame: 18 },
        jump: { texture: this.character.id + "-jump", frame: 20 },
        fall: { texture: this.character.id + "-jump", frame: 42 },
        land: { texture: this.character.id + "-jump", frame: 60 },
        hurt: { texture: this.character.id + "-jump", frame: 23 },
        celebrate: { texture: this.character.id + "-jump", frame: 45 },
        dead: { texture: this.character.id + "-jump", frame: 63 },
      }[state];
  }
}
