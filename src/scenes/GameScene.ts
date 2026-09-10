import Phaser from "phaser";
import { W, H, WORLD_H, FLOOR, TOP } from "../config/gameConfig";
import { Player } from "../entities/Player";
import { Platform } from "../entities/Platform";
import { Collectible } from "../entities/Collectible";
import { progressAt } from "../systems/LevelSystem";
import { getLevel, hazardState, type HazardKind } from "../config/levels";
import { CheckpointSystem } from "../systems/CheckpointSystem";
import { PrintingProgressSystem } from "../systems/PrintingProgressSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { MobileControls } from "../ui/MobileControls";
import { HUD } from "../ui/HUD";
import { workshop } from "../art/Workshop";
import { getAtmosphere } from "../config/atmospheres";
import type { VisualQA } from "../dev/VisualQA";
import { hazardAnimationPose } from "../config/hazardAnimations";
interface Hazard {
  obj: Phaser.GameObjects.Rectangle;
  kind: HazardKind;
  x: number;
  y: number;
  active: boolean;
  phase: number;
  art: Phaser.GameObjects.Container;
  effect?: Phaser.GameObjects.Graphics;
  warning?: Phaser.GameObjects.Text;
  animatedItem?: Phaser.GameObjects.Image;
}
export class GameScene extends Phaser.Scene {
  qa?: VisualQA;
  player!: Player;
  level = getLevel(undefined);
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
  highestCameraY = WORLD_H - H;
  constructor() {
    super("Game");
  }
  create() {
    this.time.paused = false;
    this.physics.resume();
    this.level = getLevel(this.registry.get("level"));
    this.qa = undefined;
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
    this.highestCameraY = WORLD_H - H;
    this.checkpoint = new CheckpointSystem();
    this.audio = new AudioSystem();
    this.physics.world.setBounds(0, 0, W, WORLD_H);
    workshop(this);
    this.printer = new PrintingProgressSystem(this);
    this.ledges = this.level.platforms.map((p) => {
      const a = new Platform(this, p);
      if (p.checkpoint !== undefined && p.checkpoint > 0) {
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
      if (p.kind === "sink" || p.kind === "beat")
        this.add.text(p.x, p.y + 26, p.kind === "sink" ? "CEDE AO PESO" : "NO RITMO", {
          fontFamily: "Arial", fontSize: "12px", color: p.kind === "sink" ? "#c5e5bc" : "#d7bbff",
        }).setOrigin(0.5).setDepth(6);
      return a;
    });
    this.player = new Player(this, 105, FLOOR - 57);
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
    for (const index of this.level.collectibles) {
      const p = this.level.platforms[index];
      const c = new Collectible(this, p.x, p.y - 63);
      this.physics.add.overlap(this.player, c, () => {
        if (this.locked || !c.active) return;
        c.disableBody(true, true);
        this.collected++;
        this.audio.play("collect");
        this.burst(c.x, c.y, 0xffcc69, 12);
        if (this.collected === this.level.collectibles.length) this.hud.message("FILAMENTO COMPLETO! ✦");
      });
    }
    for (const hazard of this.level.hazards)
      this.makeHazard(hazard.kind, hazard.x, hazard.y, hazard.w, hazard.h, hazard.phase);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has("qa")) {
      void import("../dev/VisualQA").then(({ VisualQA }) => {
        this.qa = new VisualQA(this);
      });
    }
    this.hud = new HUD(this, this.level.collectibles.length, this.level.hint);
    this.controls = new MobileControls(this, {
      pause: () => this.togglePause(),
      menu: () => this.scene.start("Menu"),
      sound: () => { this.audio.unlock(); return this.audio.toggle(); },
      unlock: () => this.audio.unlock(),
    });
    this.keys = this.input.keyboard!.addKeys(
      "A,D,LEFT,RIGHT,SPACE,ESC",
    ) as typeof this.keys;
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
    this.controls.setPaused(this.paused);
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
    if (this.support !== p &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      this.burst(this.player.x, p.y - 12, getAtmosphere(this.level.id).land, 4);
    this.support = p;
    this.qa?.landed(this.ledges.indexOf(p));
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
    if (["steam", "pendant", "sound", "cymbal"].includes(kind)) {
      let effect: Phaser.GameObjects.Graphics | undefined;
      let warning: Phaser.GameObjects.Text | undefined;
      let animatedItem: Phaser.GameObjects.Image | undefined;
      if (kind === "steam" || kind === "sound") {
        effect = this.add.graphics();
        art.add(effect);
        if (kind === "steam") {
          // Anchor the kettle body, not the full silhouette including steam.
          animatedItem = this.add.image(0, h / 2 + 21, this.textures.exists("home-kettle-idle") ? "home-kettle-idle" : "home-kettle", 0)
            .setOrigin(0.29, 0.70).setDisplaySize(140, 140);
          art.add(animatedItem);
        } else art.add(this.add.image(0, 0, "studio-speaker").setDisplaySize(58, 42));
        warning = this.add.text(0, -h / 2 - 18, "!", {
          fontFamily: "Arial", fontSize: "24px", fontStyle: "bold", color: "#ffcf78",
        }).setOrigin(0.5);
        art.add(warning);
      } else {
        if (kind === "pendant") {
          effect = this.add.graphics();
          art.add(effect);
        }
        art.add(this.add.image(0, 0, kind === "pendant" ? "home-lamp" : "studio-cymbal")
          .setDisplaySize(kind === "pendant" ? 52 : 65, kind === "pendant" ? 70 : 43));
      }
      this.hazards.push({ obj, art, kind, x, y, active: false, phase, effect, warning, animatedItem });
      return;
    }
    if (kind === "laser") {
      art.add(
        this.add
          .image(0, 0, "glow")
          .setDisplaySize(w + 20, 44)
          .setTint(0xff203b)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.5),
      );
      art.add(this.add.rectangle(0, 0, w, 4, 0xff3355));
      art.add(this.add.rectangle(0, 0, w, 1, 0xffc8c8));
      [-w / 2, w / 2].forEach((a) =>
        art.add(this.add.image(a, 0, "fan").setDisplaySize(19, 31)),
      );
    } else if (kind === "spikes") {
      art.add(this.add.image(0, 23, "spikes").setDisplaySize(w + 8, 80));
    } else if (kind === "head") {
      art.add(this.add.image(0, 0, "head").setDisplaySize(w + 32, h + 40));
    } else {
      art.add(this.add.image(0, 0, "platform").setDisplaySize(w + 25, h + 12));
      art.add(
        this.add.image(36, 0, "rail").setDisplaySize(20, 130).setAngle(90),
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
    if (this.qa)
      console.info(
        "QA_DAMAGE",
        JSON.stringify({
          x: this.player.x,
          y: this.player.y,
          target: this.qa.target,
          elapsed: this.elapsed,
          checkpoint: this.checkpoint.index,
        }),
      );
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
      this.highestCameraY = this.cameras.main.scrollY;
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
          this.support.body?.enable && (b.blocked.down || b.touching.down) &&
          Math.abs(b.bottom - (this.support.y - 13.5)) < 15
        ) {
          this.player.x += this.support.dx;
          this.player.y += this.support.dy;
        }
      }
      const qaInput = this.qa?.input();
      const axis =
        qaInput?.axis ||
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
          qaInput?.jump ||
            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            this.controls.consumeJump(),
        )
      ) {
        this.audio.play("jump");
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          this.burst(this.player.x, this.player.y + 35, getAtmosphere(this.level.id).jump, 5);
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
      this.highestCameraY = Math.min(this.highestCameraY, cam.scrollY);
      target = Math.min(target, this.highestCameraY + 180);
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
      const pulse = hazardState(h.kind, this.elapsed, h.phase);
      h.active = pulse.active;
      if (h.kind === "head") h.obj.x = h.x + Math.sin(this.elapsed / 950) * 175;
      if (h.kind === "arm") h.obj.x = h.x + Math.sin(this.elapsed / 800) * 70;
      if (h.kind === "pendant") {
        h.obj.x = h.x + Math.sin((this.elapsed + h.phase) / 1100) * 115;
        h.obj.y = h.y + (1 - Math.cos((this.elapsed + h.phase) / 1100)) * 16;
        h.effect?.clear().lineStyle(2, 0xaaa28d).lineBetween(h.x - h.obj.x, -105, 0, -22);
      }
      if (h.kind === "cymbal") {
        h.obj.x = h.x + Math.sin((this.elapsed + h.phase) / 750) * 140;
        h.art.setAngle(Math.sin((this.elapsed + h.phase) / 250) * 16);
      }
      if (h.kind === "steam" || h.kind === "sound") {
        const pose = hazardAnimationPose(h.kind, this.elapsed, h.phase, key => this.textures.exists(key));
        if (h.animatedItem && pose) h.animatedItem.setTexture(pose.sheet.key, pose.frame)
          .setOrigin(pose.sheet.originX, pose.sheet.originY).setDisplaySize(pose.sheet.size, pose.sheet.size);
        h.effect!.clear();
        h.warning?.setVisible(pulse.warning).setAlpha(0.65 + Math.sin(this.elapsed / 70) * 0.35);
        // The warning sheet already contains the steam; keep legacy particles
        // only as fallback. Collision rectangles remain unchanged.
        const sheetHasSteam = h.kind === "steam" && h.animatedItem && pose?.state === "warn";
        if (h.active && !sheetHasSteam) {
          if (h.kind === "steam") {
            h.effect!.fillStyle(0xeaf1dc, 0.42).fillRoundedRect(-h.obj.width / 2, -h.obj.height / 2, h.obj.width, h.obj.height, 20);
            for (let i = 0; i < 5; i++)
              h.effect!.fillStyle(0xffffff, 0.3).fillCircle(Math.sin(this.elapsed / 170 + i) * 24,
                h.obj.height / 2 - ((this.elapsed / 10 + i * 27) % h.obj.height), 13);
          } else {
            for (let i = 0; i < 3; i++)
              h.effect!.lineStyle(3, 0xe7a6ff, 0.75 - i * 0.18)
                .strokeCircle(0, 0, 15 + ((this.elapsed / 25 + i * 12) % 29));
          }
        }
      }
      h.art.setPosition(h.obj.x, h.obj.y).setAlpha(["steam", "sound"].includes(h.kind) ? 1 : h.active ? 1 : 0.15);
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
    this.player.syncVisual();
    this.printer.update(this.maxProgress, this.elapsed);
    this.hud.update(this.lives, this.collected, this.maxProgress);
  }
}
