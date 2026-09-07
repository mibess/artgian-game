import Phaser from "phaser";
import { W, H, WORLD_H, FLOOR, TOP } from "../config/gameConfig";
import { Player } from "../entities/Player";
import { Platform } from "../entities/Platform";
import { Collectible } from "../entities/Collectible";
import {
  platforms,
  collectibleIndices,
  progressAt,
} from "../systems/LevelSystem";
import { CheckpointSystem } from "../systems/CheckpointSystem";
import { PrintingProgressSystem } from "../systems/PrintingProgressSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { MobileControls } from "../ui/MobileControls";
import { HUD } from "../ui/HUD";
import { workshop } from "../art/Workshop";
interface Hazard {
  obj: Phaser.GameObjects.Rectangle;
  kind: "laser" | "head" | "spikes" | "arm";
  x: number;
  y: number;
  active: boolean;
  phase: number;
  art: Phaser.GameObjects.Container;
}
export class GameScene extends Phaser.Scene {
  player!: Player;
  ledges: Platform[] = [];
  hud!: HUD;
  controls!: MobileControls;
  printer!: PrintingProgressSystem;
  checkpoint = new CheckpointSystem();
  audio = new AudioSystem();
  hazards: Hazard[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  lives = 3;
  collected = 0;
  elapsed = 0;
  maxProgress = 0;
  invulnerable = 0;
  locked = false;
  paused = false;
  support?: Platform;
  pauseLabel!: Phaser.GameObjects.Text;
  constructor() {
    super("Game");
  }
  create() {
    this.ledges = [];
    this.hazards = [];
    this.lives = 3;
    this.collected = 0;
    this.elapsed = 0;
    this.maxProgress = 0;
    this.invulnerable = 0;
    this.locked = false;
    this.paused = false;
    this.support = undefined;
    this.checkpoint = new CheckpointSystem();
    this.audio = new AudioSystem();
    this.physics.world.setBounds(0, 0, W, WORLD_H);
    workshop(this);
    this.printer = new PrintingProgressSystem(this);
    this.ledges = platforms.map((p) => {
      const a = new Platform(this, p);
      if (p.checkpoint !== undefined) {
        this.add
          .text(
            p.x,
            p.y + 24,
            p.checkpoint === 0
              ? "INÍCIO  ›››"
              : "◈  CHECKPOINT " + p.checkpoint,
            {
              fontFamily: "Arial",
              fontSize: "11px",
              fontStyle: "bold",
              letterSpacing: 2,
              color: p.checkpoint === 0 ? "#c0e6f6" : "#86e6ca",
            },
          )
          .setOrigin(0.5)
          .setDepth(6);
      }
      if (p.kind === "boost")
        this.add
          .text(p.x, p.y - 25, "↑ ↑ ↑", { fontSize: "23px", color: "#66ffe0" })
          .setOrigin(0.5)
          .setDepth(6);
      return a;
    });
    this.player = new Player(this, 270, FLOOR - 57);
    this.cameras.main.setBounds(0, 0, W, WORLD_H);
    this.cameras.main.scrollY = WORLD_H - H;
    this.physics.add.collider(
      this.player,
      this.ledges,
      (_p, l) => this.land(l as Platform),
      (_p, l) => {
        const p = l as Platform;
        const b = this.player.body as Phaser.Physics.Arcade.Body;
        return b.velocity.y >= 0 && b.bottom <= p.y + 24;
      },
      this,
    );
    for (const index of collectibleIndices) {
      const p = platforms[index];
      const c = new Collectible(this, p.x, p.y - 63);
      this.physics.add.overlap(this.player, c, () => {
        if (this.locked || !c.active) return;
        c.disableBody(true, true);
        this.collected++;
        this.audio.play("collect");
        this.burst(c.x, c.y, 0xffcc69, 12);
        if (this.collected === 15) this.hud.message("FILAMENTO COMPLETO! ✦");
      });
    }
    this.makeHazard("laser", 340, 2100, 150, 7, 0);
    this.makeHazard("laser", 150, 1300, 170, 7, 1700);
    this.makeHazard("spikes", 475, 1600, 80, 20, 0);
    this.makeHazard("spikes", 49, 1070, 80, 20, 0);
    this.makeHazard("head", 270, 640, 65, 45, 0);
    this.makeHazard("arm", 430, 1850, 65, 20, 0);
    this.add
      .text(270, FLOOR - 160, "PEQUENOS SALTOS.\nGRANDES CRIAÇÕES.", {
        fontFamily: "Arial",
        fontSize: "21px",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 7,
        color: "#dfd2b8",
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.hud = new HUD(this);
    this.controls = new MobileControls(this);
    this.keys = this.input.keyboard!.addKeys(
      "A,D,LEFT,RIGHT,SPACE,ESC",
    ) as typeof this.keys;
    this.pauseLabel = this.add
      .text(483, 81, "Ⅱ", { fontSize: "23px", color: "#c4dce7" })
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.togglePause());
    const sound = this.add
      .text(437, 81, "♫", { fontSize: "23px", color: "#c4dce7" })
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.audio.unlock();
        sound.setAlpha(this.audio.toggle() ? 0.35 : 1);
      });
    this.input.on("pointerdown", () => this.audio.unlock());
    this.input.keyboard!.on("keydown", () => this.audio.unlock());
    this.game.events.on("blur", this.onBlur, this);
    this.events.once("shutdown", () => {
      this.audio.destroy();
      this.printer.destroy();
      this.game.events.off("blur", this.onBlur, this);
    });
  }
  onBlur() {
    if (!this.paused && !this.locked) this.togglePause();
  }
  togglePause() {
    if (this.locked) return;
    this.paused = !this.paused;
    this.time.paused = this.paused;
    this.pauseLabel.setText(this.paused ? "▶" : "Ⅱ");
    this.controls.clear();
    if (this.paused) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.hud.message("PAUSADO • TOQUE EM ▶ PARA CONTINUAR");
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.hud.toast.setAlpha(0);
    }
  }
  land(p: Platform) {
    if (this.locked) return;
    this.support = p;
    p.touch();
    if (
      p.spec.checkpoint !== undefined &&
      this.checkpoint.activate(p.spec.checkpoint, p.x, p.y)
    ) {
      this.hud.message("CHECKPOINT SALVO • CAMADA " + p.spec.checkpoint);
      this.audio.play("platform");
      this.burst(p.x, p.y - 20, 0x81f1ce, 20);
    }
    if (p.spec.kind === "boost") {
      this.player.setVelocityY(-930);
      this.player.groundTime = -999;
      this.audio.play("jump");
      this.burst(p.x, p.y - 20, 0x72fff0, 12);
    }
    if (p.spec.y === TOP) this.complete();
  }
  makeHazard(
    kind: Hazard["kind"],
    x: number,
    y: number,
    w: number,
    h: number,
    phase: number,
  ) {
    const obj = this.add.rectangle(x, y, w, h, 0xff5362, 0);
    const art = this.add.container(x, y).setDepth(8);
    if (kind === "laser") {
      art.add(this.add.rectangle(0, 0, w, 18, 0xff244a, 0.1));
      art.add(this.add.rectangle(0, 0, w, 4, 0xff3355));
      art.add(this.add.rectangle(0, 0, w, 1, 0xffc8c8));
      [-w / 2, w / 2].forEach((a) =>
        art.add(
          this.add
            .rectangle(a, 0, 13, 30, 0x586976)
            .setStrokeStyle(2, 0xbd765b),
        ),
      );
    } else if (kind === "spikes") {
      art.add(this.add.rectangle(0, 12, w, 12, 0x4e5661));
      for (let i = -w / 2 + 8; i < w / 2; i += 15)
        art.add(
          this.add
            .triangle(i, 0, 0, 12, 6, -10, 12, 12, 0xff5b55)
            .setStrokeStyle(1, 0xffb09a),
        );
    } else {
      art.add(
        this.add.rectangle(0, 0, w, h, 0x53606b).setStrokeStyle(3, 0x8a939c),
      );
      art.add(this.add.rectangle(0, 0, w - 15, h - 12, 0x272d3b));
      art.add(this.add.rectangle(0, h / 2, w - 10, 4, 0xff8350));
      if (kind === "head")
        art.add(
          this.add.triangle(0, h / 2 + 9, -8, -10, 8, -10, 0, 8, 0xffb750),
        );
    }
    this.hazards.push({ obj, art, kind, x, y, active: true, phase });
  }
  burst(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.add
        .image(x, y, "particle")
        .setTint(color)
        .setScale(0.15 + Math.random() * 0.25)
        .setDepth(30);
      this.tweens.add({
        targets: p,
        x: x + (Math.random() - 0.5) * 130,
        y: y - 20 - Math.random() * 100,
        alpha: 0,
        duration: 500 + Math.random() * 500,
        onComplete: () => p.destroy(),
      });
    }
  }
  damage() {
    if (this.locked || this.elapsed < this.invulnerable) return;
    this.lives--;
    this.hud.damage(this.lives);
    this.audio.play("hurt");
    this.cameras.main.shake(180, 0.009);
    this.player.pose(this.lives ? "hurt" : "dead");
    this.locked = true;
    this.player.setAccelerationX(0);
    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    if (!this.lives) {
      this.time.delayedCall(650, () =>
        this.scene.start("GameOver", {
          count: this.collected,
          time: this.elapsed,
        }),
      );
      return;
    }
    this.time.delayedCall(450, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      (this.player.body as Phaser.Physics.Arcade.Body).reset(
        this.checkpoint.x,
        this.checkpoint.y,
      );
      (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
      this.player.groundTime = this.player.bufferTime = -999;
      this.support = undefined;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.player.y - H * 0.72,
        0,
        WORLD_H - H,
      );
      this.invulnerable = this.elapsed + 2000;
      this.locked = false;
      this.hud.message("DE VOLTA AO CHECKPOINT");
    });
  }
  complete() {
    if (this.locked) return;
    this.locked = true;
    this.maxProgress = 1;
    this.player.setVelocity(0, 0);
    this.player.setAccelerationX(0);
    this.player.pose("celebrate");
    this.audio.play("complete");
    this.hud.message("ÚLTIMA CAMADA…");
    this.time.delayedCall(1300, () => {
      this.cameras.main.flash(450, 255, 213, 139);
      this.burst(this.player.x, this.player.y, 0xffdc85, 55);
    });
    this.time.delayedCall(2700, () =>
      this.scene.start("LevelComplete", {
        count: this.collected,
        time: this.elapsed,
        lives: this.lives,
      }),
    );
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.togglePause();
    if (this.paused) return;
    const dt = Math.min(delta, 40);
    this.elapsed += dt;
    this.ledges.forEach((p) => p.step(this.elapsed));
    if (!this.locked) {
      if (this.support && this.support.active) {
        const b = this.player.body as Phaser.Physics.Arcade.Body;
        if (
          (b.blocked.down || b.touching.down) &&
          Math.abs(b.bottom - (this.support.y - 13.5)) < 15
        ) {
          this.player.x += this.support.dx;
          this.player.y += this.support.dy;
        }
      }
      const axis =
        Number(
          this.keys.D.isDown || this.keys.RIGHT.isDown || this.controls.right,
        ) -
        Number(
          this.keys.A.isDown || this.keys.LEFT.isDown || this.controls.left,
        );
      if (
        this.player.step(
          this.elapsed,
          axis,
          Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            this.controls.consumeJump(),
        )
      ) {
        this.audio.play("jump");
        this.support = undefined;
      }
      this.maxProgress = Math.max(
        this.maxProgress,
        progressAt(this.player.y + 40),
      );
      const cam = this.cameras.main;
      const sy = this.player.y - cam.scrollY;
      let target = cam.scrollY;
      if (sy < 400) target = this.player.y - 400;
      else if (sy > 760) target = this.player.y - 760;
      cam.scrollY = Phaser.Math.Clamp(
        Phaser.Math.Linear(cam.scrollY, target, 1 - Math.exp(-dt / 200)),
        0,
        WORLD_H - H,
      );
      if (this.player.y > WORLD_H + 30 || this.player.y > cam.scrollY + H + 110)
        this.damage();
    }
    for (const h of this.hazards) {
      const was = h.active;
      h.active = h.kind !== "laser" || (this.elapsed + h.phase) % 3400 < 1600;
      if (h.kind === "head") h.obj.x = h.x + Math.sin(this.elapsed / 950) * 175;
      if (h.kind === "arm") h.obj.x = h.x + Math.sin(this.elapsed / 800) * 70;
      h.art.setPosition(h.obj.x, h.obj.y).setAlpha(h.active ? 1 : 0.15);
      if (
        h.kind === "laser" &&
        h.active &&
        !was &&
        Math.abs(h.y - this.player.y) < 400
      )
        this.audio.play("laser");
      const b = this.player.body as Phaser.Physics.Arcade.Body;
      if (
        h.active &&
        Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height),
          h.obj.getBounds(),
        )
      )
        this.damage();
    }
    this.player.setAlpha(
      this.elapsed < this.invulnerable
        ? Math.floor(this.elapsed / 100) % 2
          ? 0.35
          : 1
        : 1,
    );
    this.printer.update(this.maxProgress, this.elapsed);
    this.hud.update(this.lives, this.collected, this.maxProgress);
  }
}
