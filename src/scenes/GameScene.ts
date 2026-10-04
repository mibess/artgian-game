import Phaser from "phaser";
import { W, H, WORLD_H, FLOOR, TOP } from "../config/gameConfig";
import { Player } from "../entities/Player";
import { Platform } from "../entities/Platform";
import { Collectible } from "../entities/Collectible";
import { getLevel, hazardState, beatState, dripCycle, dripFall, nozzleX, type HazardKind } from "../config/levels";
import { CheckpointSystem } from "../systems/CheckpointSystem";
import { PrintingProgressSystem } from "../systems/PrintingProgressSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { NavigationGuard } from "../systems/NavigationGuard";
import { MobileControls } from "../ui/MobileControls";
import { HUD } from "../ui/HUD";
import { workshop } from "../art/Workshop";
import { getAtmosphere } from "../config/atmospheres";
import type { VisualQA } from "../dev/VisualQA";
import { GameSession } from "../systems/GameSession";
import { initialState, stepSimulation, platformAt, STEP_MS, type Simulation } from "../shared/simulation";
import { hazardAnimationPose } from "../config/hazardAnimations";
import { refreshCanvasTextures } from "../art/runtimeTextures";
import { beeFlight, beeAnimationPose } from "../config/garden";
import { hasStar, loadHeroClears, loadRecords, saveHeroClear, saveRun } from "../systems/Records";
import { levelIntro } from "../ui/LevelIntro";

const MILESTONES = [0.25, 0.5, 0.75];
const vibrate = (pattern: number | number[]) => {
  // Browsers reject vibration before the first user gesture.
  if (!navigator.userActivation?.hasBeenActive) return;
  try { navigator.vibrate?.(pattern); } catch { /* Unsupported. */ }
};
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
  simulation!: Simulation;
  gameSession?: GameSession;
  simulationReady = false;
  accumulator = 0;
  pendingJump = false;
  collectibleObjects: Collectible[] = [];
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
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  support?: Platform;
  highestCameraY = WORLD_H - H;
  collectStreak = 0;
  lastCollectAt = -99999;
  milestone = 0;
  bestProgress = 0;
  bestMarker?: Phaser.GameObjects.Container;
  flags = new Map<number, Phaser.GameObjects.Image>();
  constructor() {
    super("Game");
  }
  create() {
    this.time.paused = false;
    this.physics.resume();
    this.level = getLevel(this.registry.get("level"));
    this.simulation = initialState(this.level);
    this.simulationReady = false;
    this.accumulator = 0;
    this.pendingJump = false;
    this.collectibleObjects = [];
    this.gameSession = undefined;
    this.registry.remove("rewardSession");
    this.registry.remove("rewardCompletionId");
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
    this.collectStreak = 0;
    this.lastCollectAt = -99999;
    this.milestone = 0;
    this.bestProgress = loadRecords()[this.level.id]?.bestProgress ?? 0;
    this.bestMarker = undefined;
    this.flags = new Map();
    this.checkpoint = new CheckpointSystem();
    this.audio = new AudioSystem();
    this.audio.startLevelMusic(this.level.id);
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
      if (p.checkpoint && this.textures.exists("checkpoint-flag")) {
        // Origin at the pole's base; grey until the checkpoint is reached.
        const flag = this.add.image(p.x + p.w / 2 - 16, p.y - 9, "checkpoint-flag")
          .setOrigin(0.8, 0.98).setDepth(6).setTint(0x6d8790).setAlpha(0.85);
        flag.setScale(58 / flag.height);
        this.flags.set(p.checkpoint, flag);
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
      if (p.kind === "shuttle") a.setData("label", this.add.text(p.x, p.y + 26, "⇆  DESLIZA", {
        fontFamily: "Arial", fontSize: "12px", fontStyle: "bold", color: "#ffc58a",
      }).setOrigin(0.5).setDepth(6));
      return a;
    });
    this.player = new Player(this, 105, FLOOR - 57);
    if (this.bestProgress > 0.03 && this.bestProgress < 1) this.drawBestMarker();
    this.cameras.main.setBounds(0, 0, W, WORLD_H);
    this.cameras.main.scrollY = WORLD_H - H;
    // Rendering uses Phaser; all gameplay is predicted by the same fixed-step
    // simulation the server replays. Arcade must not apply a second physics step.
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    for (const index of this.level.collectibles) {
      const p = this.level.platforms[index];
      const c = new Collectible(this, p.x, p.y - 63);
      this.collectibleObjects.push(c);
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
      muted: this.audio.muted,
    });
    const connection = new GameSession();
    const startToken = {};
    this.registry.set("activeRunStart", startToken);
    const intro = levelIntro(this, this.level, this.reducedMotion);
    const minimumIntro = new Promise<void>(resolve =>
      this.time.delayedCall(this.reducedMotion ? 400 : 1500, () => resolve()));
    const current = () => this.scene.isActive() && this.registry.get("activeRunStart") === startToken;
    void connection.start(this.level.id).then(() => {
      if (!current()) return;
      this.gameSession = connection;
      this.registry.set("rewardSession", connection);
      intro.setStatus("PARTIDA VALENDO CUPOM ✓");
    }).catch(() => {
      if (current()) intro.setStatus("SEM CONEXÃO • CUPOM INDISPONÍVEL");
    }).finally(() => minimumIntro.then(() => {
      if (!current()) return;
      intro.close();
      this.simulationReady = true;
      this.hud.callout("VAI!", "#9aeedb", 52);
      this.audio.play("go");
      this.hud.message(this.gameSession ? this.level.hint : "Sem conexão: jogue à vontade, mas esta partida não gera cupom.", 3800);
    }));
    this.keys = this.input.keyboard!.addKeys(
      "A,D,LEFT,RIGHT,SPACE",
    ) as typeof this.keys;
    this.input.on("pointerdown", () => this.audio.unlock());
    this.input.keyboard!.on("keydown", () => this.audio.unlock());
    this.game.events.on("blur", this.onBlur, this);
    this.game.events.on("hidden", this.onBlur, this);
    const refreshTextures = () => refreshCanvasTextures(this.textures);
    this.game.renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, refreshTextures);
    const navigationGuard = new NavigationGuard(() => this.onBlur());
    this.events.once("shutdown", () => {
      if (this.registry.get("activeRunStart") === startToken) this.registry.remove("activeRunStart");
      this.audio.destroy();
      this.printer.destroy();
      this.game.events.off("blur", this.onBlur, this);
      this.game.events.off("hidden", this.onBlur, this);
      this.game.renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, refreshTextures);
      navigationGuard.destroy();
    });
  }
  onBlur() {
    if (!this.paused && !this.locked) this.togglePause();
  }
  togglePause() {
    if (this.locked) return;
    this.paused = !this.paused;
    this.time.paused = this.paused;
    for (const object of this.children.list) {
      if (object instanceof Phaser.GameObjects.Sprite && object.anims.currentAnim) {
        if (this.paused) object.anims.pause(); else object.anims.resume();
      }
    }
    if (this.paused) {
      const sim = this.simulation, total = this.level.collectibles.length;
      const record = loadRecords()[this.level.id];
      this.controls.setGoals([
        { label: `Concluir a fase · ${Math.floor(sim.maxProgress * 100)}% impresso`, done: hasStar(record, 0) },
        { label: `Todos os filamentos · ${sim.collected.length}/${total}`, done: sim.collected.length >= total || hasStar(record, 1) },
        { label: sim.lives >= 3 ? "Sem perder vidas · até agora, perfeito!" : "Sem perder vidas · tente de novo depois",
          done: hasStar(record, 2) },
      ]);
    }
    this.controls.setPaused(this.paused);
    this.controls.clear();
    this.pendingJump = false;
    this.input.keyboard?.resetKeys();
    if (this.paused) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.audio.pauseMusic();
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      // Some Android browsers discard canvas-backed GPU textures while a
      // modal is composited over WebGL. Re-upload them before the next frame.
      refreshCanvasTextures(this.textures);
      this.audio.resumeMusic();
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
    if (this.checkpoint.activate(this.simulation.checkpoint, this.simulation.checkpointX,
      this.simulation.checkpointFeet + 16.5)) {
      this.hud.message("CHECKPOINT SALVO • CAMADA " + this.simulation.checkpoint);
      this.raiseFlag(this.flags.get(this.simulation.checkpoint));
      this.audio.play("platform");
      this.burst(p.x, p.y - 20, 0x81f1ce, 20);
    }
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
    if (kind === "nozzle") {
      // A rail spans the lane so the sweep reads before the head arrives.
      this.add.rectangle(W / 2, y - 30, W, 6, 0x24333d).setDepth(4);
      this.add.rectangle(W / 2, y - 32, W, 1.5, 0x7b93a0, 0.7).setDepth(4);
      const heat = this.add.image(0, 22, "glow").setTint(0xff7a2f).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(90, 60).setAlpha(0.7);
      const head = this.add.image(0, -4, "bed-nozzle").setDisplaySize(78, 78);
      art.add([heat, head]);
      this.hazards.push({ obj, art, kind, x, y, active: true, phase, animatedItem: head });
      return;
    }
    if (kind === "drip") {
      // A small emitter at the top of the column; the drop forms under it, then falls.
      this.add.image(x, y - 34, "bed-nozzle").setDisplaySize(40, 40).setDepth(7).setAlpha(0.9);
      const glow = this.add.image(0, 0, "glow").setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(60, 60).setAlpha(0.6);
      const drop = this.add.image(0, 0, "bed-drip").setDisplaySize(25, 48);
      const warning = this.add.text(22, -26, "!", { fontFamily: "Arial", fontSize: "22px", fontStyle: "bold",
        color: "#ffcf78", stroke: "#3a1d0f", strokeThickness: 4 }).setOrigin(0.5);
      art.add([glow, drop, warning]);
      this.hazards.push({ obj, art, kind, x, y, active: false, phase, warning, animatedItem: drop });
      return;
    }
    if (kind === "fan") {
      obj.setPosition(x, y);
      const effect = this.add.graphics().setDepth(7);
      const blades = this.add.image(0, 0, "bed-fan").setDisplaySize(84, 84);
      const warning = this.add.text(x < W / 2 ? 40 : -40, -46, "!", { fontFamily: "Arial", fontSize: "22px",
        fontStyle: "bold", color: "#9fe8ff", stroke: "#0b2a32", strokeThickness: 4 }).setOrigin(0.5);
      art.add([blades, warning]);
      this.hazards.push({ obj, art, kind, x, y, active: false, phase, effect, warning, animatedItem: blades });
      return;
    }
    if (kind === "bee") {
      const effect = this.add.graphics();
      const animatedItem = this.add.image(0, 0, "garden-bee").setDisplaySize(64, 48);
      const warning = this.add.text(0, -45, "!", {
        fontFamily: "Arial", fontSize: "24px", fontStyle: "bold", color: "#fff0a6",
        stroke: "#533322", strokeThickness: 4,
      }).setOrigin(0.5);
      art.add([effect, animatedItem, warning]);
      this.hazards.push({ obj, art, kind, x, y, active: false, phase, effect, warning, animatedItem });
      return;
    }
    if (["steam", "pendant", "sound", "cymbal", "sprinkler"].includes(kind)) {
      let effect: Phaser.GameObjects.Graphics | undefined;
      let warning: Phaser.GameObjects.Text | undefined;
      let animatedItem: Phaser.GameObjects.Image | undefined;
      if (kind === "steam" || kind === "sound" || kind === "sprinkler") {
        effect = this.add.graphics();
        art.add(effect);
        if (kind === "sprinkler") {
          animatedItem = this.add.image(0, h / 2 + 40, "garden-sprinkler")
            .setOrigin(0.5, 1).setDisplaySize(85, 62);
          art.add(animatedItem);
        } else if (kind === "steam") {
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
  /** Height reached in an earlier attempt, so every run has a target to beat. */
  drawBestMarker() {
    const y = FLOOR - this.bestProgress * (FLOOR - TOP) - 65;
    const line = this.add.graphics();
    line.lineStyle(2, 0xffcf7a, 0.75);
    for (let x = 0; x < W; x += 22) line.lineBetween(x, 0, x + 12, 0);
    const label = this.add.text(W - 12, -14, `SEU RECORDE · ${Math.floor(this.bestProgress * 100)}%`, {
      fontFamily: "Trebuchet MS, Arial", fontSize: "13px", fontStyle: "bold", color: "#ffe1a1",
      backgroundColor: "#0b2632cc", padding: { x: 8, y: 3 },
    }).setOrigin(1, 0.5);
    this.bestMarker = this.add.container(0, y, [line, label]).setDepth(4);
  }
  passBestMarker() {
    const marker = this.bestMarker;
    if (!marker) return;
    this.bestMarker = undefined;
    this.flags = new Map();
    this.hud.callout("NOVO RECORDE!", "#ffd27a", 40);
    this.audio.play("milestone");
    this.burst(W / 2, marker.y, 0xffd27a, 24);
    this.tweens.add({ targets: marker, alpha: 0, duration: 600, onComplete: () => marker.destroy() });
  }
  raiseFlag(flag?: Phaser.GameObjects.Image) {
    if (!flag) return;
    flag.clearTint().setAlpha(1);
    if (this.reducedMotion) return;
    const scale = flag.scale;
    flag.setScale(scale * 0.3, scale * 1.4);
    this.tweens.add({ targets: flag, scaleX: scale, scaleY: scale, duration: 420, ease: "Back.Out" });
    this.tweens.add({ targets: flag, angle: { from: -6, to: 4 }, duration: 900, delay: 420,
      yoyo: true, repeat: -1, ease: "Sine.InOut" });
    const glow = this.add.image(flag.x, flag.y - 30, "glow").setTint(0x81f1ce)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(40, 40).setDepth(5);
    this.tweens.add({ targets: glow, displayWidth: 170, displayHeight: 170, alpha: 0, duration: 700,
      onComplete: () => glow.destroy() });
  }
  dust(x: number, y: number, count: number, spread = 1) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const puff = this.add.image(x + side * 6, y, "particle")
        .setTint(getAtmosphere(this.level.id).jump).setAlpha(0.7)
        .setScale(0.35 + Math.random() * 0.3).setDepth(9);
      this.tweens.add({ targets: puff, x: puff.x + side * (18 + Math.random() * 26) * spread,
        y: y - Math.random() * 12, scale: 0.9, alpha: 0, duration: 380 + Math.random() * 200,
        ease: "Quad.Out", onComplete: () => puff.destroy() });
    }
  }
  floatText(x: number, y: number, value: string, color: string, size = 22) {
    const label = this.add.text(x, y, value, {
      fontFamily: "Trebuchet MS, Arial", fontSize: `${size}px`, fontStyle: "bold", color,
      stroke: "#06202b", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(31);
    this.tweens.add({ targets: label, y: y - 52, alpha: 0, duration: 800, ease: "Cubic.Out",
      onComplete: () => label.destroy() });
  }
  saveResult(won: boolean) {
    return saveRun(this.level.id, {
      won, count: this.simulation.collected.length, total: this.level.collectibles.length,
      lives: this.simulation.lives, time: this.elapsed, progress: this.simulation.maxProgress,
    });
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
  complete() {
    if (this.locked) return;
    this.locked = true;
    this.maxProgress = 1;
    this.player.setVelocity(0, 0);
    this.player.setAccelerationX(0);
    this.player.pose("celebrate");
    this.audio.duckMusic(3.0);
    this.audio.play("complete");
    vibrate([40, 60, 40]);
    const update = this.saveResult(true);
    const hero = String(this.registry.get("character") ?? "");
    const heroFirst = saveHeroClear(hero, this.level.id);
    const heroClears = loadHeroClears()[hero]?.length ?? 0;
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
        update,
        heroFirst,
        heroClears,
      }),
    );
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    if (this.paused) return;
    if (!this.simulationReady) return;
    const qaInput = this.qa?.input();
    const axis = Math.sign(qaInput?.axis ||
      Number(this.keys.D.isDown || this.keys.RIGHT.isDown || this.controls.right) -
      Number(this.keys.A.isDown || this.keys.LEFT.isDown || this.controls.left)) as -1 | 0 | 1;
    this.pendingJump ||= !!qaInput?.jump || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.controls.consumeJump();
    this.accumulator += Math.min(delta, 100);
    while (this.accumulator >= STEP_MS && !this.locked) {
      const beforeLives = this.simulation.lives;
      const beforeLanding = this.simulation.lastLanding;
      const beforeYVelocity = this.simulation.vy;
      const beforeSupport = this.simulation.support;
      // Dev QA can replay a verified route command-by-command (one per fixed step).
      const command = this.qa?.routeCommand() ?? { axis, jump: this.pendingJump };
      this.pendingJump = false;
      stepSimulation(this.simulation, this.level, command);
      this.gameSession?.record(command);
      this.accumulator -= STEP_MS;
      this.elapsed = this.simulation.tick * STEP_MS;
      if (this.simulation.lastLanding !== beforeLanding)
        this.land(this.ledges[this.simulation.lastLanding]);
      if (beforeYVelocity >= 0 && this.simulation.vy < 0) {
        const boost = this.simulation.vy < -800;
        this.audio.play(boost ? "milestone" : "jump");
        this.player.squash(boost ? 0.72 : 0.84, boost ? 1.32 : 1.18);
        this.dust(this.simulation.x, this.simulation.feet, boost ? 10 : 5, boost ? 1.6 : 1);
      } else if (beforeSupport < 0 && this.simulation.support >= 0) {
        this.audio.play("land");
        this.player.squash(1.2, 0.82);
      }
      if (this.simulation.lives < beforeLives) {
        this.hud.damage(this.simulation.lives);
        this.audio.play("hurt");
        this.cameras.main.shake(180, 0.009);
        if (!this.reducedMotion) this.cameras.main.flash(260, 255, 70, 80, true);
        vibrate(90);
        this.collectStreak = 0;
        this.floatText(this.simulation.x, this.simulation.feet - 90, "−1 ♥", "#ff8a95", 26);
      }
      if (this.simulation.status === "won") this.complete();
      else if (this.simulation.status === "lost") {
        this.locked = true;
        // Persist the final loss commands, too; no reward is created.
        void this.gameSession?.finish().catch(() => {});
        const update = this.saveResult(false);
        this.time.delayedCall(650, () => this.scene.start("GameOver", {
          count: this.simulation.collected.length, time: this.elapsed,
          progress: this.simulation.maxProgress, update,
        }));
      }
    }
    const sim = this.simulation;
    this.lives = sim.lives;
    this.collected = sim.collected.length;
    this.maxProgress = sim.maxProgress;
    this.invulnerable = sim.invulnerableUntil;
    this.support = sim.support >= 0 ? this.ledges[sim.support] : undefined;
    this.ledges.forEach((p, i) => {
      const at = platformAt(this.level, sim, i);
      p.dx = at.x - p.x; p.dy = at.y - p.y;
      const age = sim.activated[i] < 0 ? -1 : this.elapsed - sim.activated[i];
      const warning = p.spec.kind === "beat" ? beatState(this.elapsed, p.spec.phase ?? 0).warning :
        p.spec.kind === "temporary" && age >= 0 && age < 1700;
      (p.getData("label") as Phaser.GameObjects.Text | undefined)?.setX(at.x);
      p.setPosition(at.x, at.y).setVisible(true)
        .setAlpha(at.solid ? warning ? 0.65 + Math.sin(this.elapsed / 70) * 0.25 : 1 : 0.16);
      if (p.spec.kind === "beat") p.setTint(warning ? 0xffcd79 : at.solid ? 0xffffff : 0x77628e);
    });
    for (let i = 0; i < this.collectibleObjects.length; i++) {
      const c = this.collectibleObjects[i];
      if (c.active && sim.collected.includes(this.level.collectibles[i])) {
        // Quick successive pickups climb the scale, rewarding a flowing route.
        this.collectStreak = this.elapsed - this.lastCollectAt < 3200 ? this.collectStreak + 1 : 0;
        this.lastCollectAt = this.elapsed;
        c.collect();
        this.audio.play("collect", this.collectStreak);
        this.burst(c.x, c.y, 0xffcc69, 12);
        this.floatText(c.x + (c.x < W / 2 ? 62 : -62), c.y - 20, this.collectStreak >= 2 ? `+1  ×${this.collectStreak + 1}` : "+1",
          this.collectStreak >= 2 ? "#ffd27a" : "#fff1cf");
        if (this.collected === this.level.collectibles.length) {
          this.hud.callout("TODOS OS FILAMENTOS!", "#9aeedb", 30);
          vibrate([30, 40, 30]);
        }
      }
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.touching.down = sim.support >= 0;
    body.velocity.set(sim.vx, sim.vy);
    this.player.step(this.elapsed, axis, false);
    body.velocity.set(sim.vx, sim.vy);
    this.player.setPosition(sim.x, sim.feet - 40.5);
    if (sim.status === "won") this.player.pose("celebrate");
    else if (sim.status === "lost") this.player.pose("dead");
    else if (sim.respawnAt) this.player.pose("hurt");
    this.cameras.main.scrollY = sim.cameraY;
    for (const h of this.hazards) {
      const was = h.active;
      const pulse = hazardState(h.kind, this.elapsed, h.phase);
      h.active = pulse.active;
      if (h.kind === "bee") {
        const flight = beeFlight(this.elapsed, h.phase, h.x < W / 2);
        h.obj.setPosition(flight.x, h.y + flight.offsetY);
        h.animatedItem!.setFlipX(!flight.rightward);
        const pose = beeAnimationPose(this.elapsed, h.phase, key => this.textures.exists(key), this.reducedMotion);
        if (pose) h.animatedItem!.setTexture(pose.key, pose.frame).setOrigin(0.5, 0.57).setDisplaySize(80, 80);
        h.warning!.setVisible(flight.warning);
        h.effect!.clear();
        if (flight.warning) {
          const direction = flight.rightward ? 1 : -1;
          h.effect!.lineStyle(2, 0xffe4a6, 0.6);
          for (let offset = 40; offset < 450; offset += 24)
            h.effect!.lineBetween(direction * offset, 0, direction * (offset + 10), 0);
          h.effect!.fillStyle(0xffe4a6, 0.9).fillTriangle(
            direction * 77, -7, direction * 89, 0, direction * 77, 7);
        }
      }
      if (h.kind === "nozzle") {
        h.obj.x = nozzleX(this.elapsed, h.phase);
        h.art.setAngle(Math.cos((this.elapsed + h.phase) / 650) * -6);
      }
      if (h.kind === "drip") {
        const fall = dripFall(this.elapsed, h.phase);
        h.obj.y = h.y + fall.offsetY;
        // Forming: the drop swells under the emitter; resting: out of play.
        const cycle = dripCycle.formingMs + dripCycle.fallingMs + dripCycle.restMs;
        const grow = fall.active ? 1 : fall.resting ? 0 : Math.min(1, ((this.elapsed + h.phase) % cycle) / dripCycle.formingMs);
        h.art.setVisible(grow > 0).setScale(0.35 + grow * 0.65);
        h.warning!.setVisible(fall.warning).setAlpha(0.65 + Math.sin(this.elapsed / 70) * 0.35);
      }
      if (h.kind === "fan") {
        const spin = pulse.active ? 0.9 : pulse.warning ? 0.35 : 0.06;
        h.animatedItem!.setAngle(h.animatedItem!.angle + spin * delta);
        h.warning!.setVisible(pulse.warning).setAlpha(0.65 + Math.sin(this.elapsed / 70) * 0.35);
        // Wind streaks across the band show its reach and direction.
        h.effect!.clear();
        if (pulse.active || pulse.warning) {
          const direction = h.x < W / 2 ? 1 : -1, alpha = pulse.active ? 0.5 : 0.18;
          for (let i = 0; i < 9; i++) {
            const lane = h.y - 60 + (i * 37) % 120;
            const travel = ((this.elapsed * (pulse.active ? 0.6 : 0.25) + i * 97) % (W + 120)) - 60;
            const start = direction > 0 ? travel : W - travel;
            h.effect!.lineStyle(2, 0xbfefff, alpha).lineBetween(start, lane, start + direction * 46, lane);
          }
        }
      }
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
      if (h.kind === "steam" || h.kind === "sound" || h.kind === "sprinkler") {
        const pose = hazardAnimationPose(h.kind, this.elapsed, h.phase, key => this.textures.exists(key));
        if (h.animatedItem && pose) h.animatedItem.setTexture(pose.sheet.key, pose.frame)
          .setOrigin(pose.sheet.originX, pose.sheet.originY).setDisplaySize(pose.sheet.size, pose.sheet.size);
        h.effect!.clear();
        h.warning?.setVisible(pulse.warning).setAlpha(0.65 + Math.sin(this.elapsed / 70) * 0.35);
        // The warning sheet already contains the steam; keep legacy particles
        // only as fallback. Collision rectangles remain unchanged.
        const sheetHasSteam = (h.kind === "steam" || h.kind === "sprinkler") && h.animatedItem && pose?.state === "warn";
        if (h.active && !sheetHasSteam) {
          if (h.kind === "sprinkler") {
            h.effect!.fillStyle(0xa9e7ff, 0.2).fillRoundedRect(-h.obj.width / 2, -h.obj.height / 2, h.obj.width, h.obj.height, 12);
            for (let i = 0; i < 9; i++) {
              const t = ((this.elapsed / 700 + i / 9) % 1);
              h.effect!.fillStyle(0xc9f2ff, 0.8).fillEllipse(
                Math.sin(i * 2.4) * h.obj.width * 0.42 * t,
                h.obj.height / 2 - t * h.obj.height, 4, 9);
            }
          } else if (h.kind === "steam") {
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
      h.art.setPosition(h.obj.x, h.obj.y).setAlpha(h.kind === "bee" ? pulse.warning || pulse.active ? 1 : 0.65
        : ["steam", "sound", "sprinkler", "nozzle", "drip", "fan"].includes(h.kind) ? 1 : h.active ? 1 : 0.15);
      if (
        h.kind === "laser" &&
        h.active &&
        !was &&
        Math.abs(h.y - this.player.y) < 400
      )
        this.audio.play("laser");
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
    this.hud.update(this.lives, this.collected, this.maxProgress, this.elapsed);
    if (!this.locked && this.milestone < MILESTONES.length && this.maxProgress >= MILESTONES[this.milestone]) {
      this.hud.callout(`${Math.round(MILESTONES[this.milestone] * 100)}% IMPRESSO`, "#ffe1a1", 32);
      this.audio.play("milestone");
      this.milestone++;
    }
    if (this.bestMarker && this.maxProgress > this.bestProgress + 0.005) this.passBestMarker();
  }
}
