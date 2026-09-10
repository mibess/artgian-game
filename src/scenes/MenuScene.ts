import Phaser from "phaser";
import { getLevel, levels } from "../config/levels";
import { characters, getCharacter } from "../config/characters";

export class MenuScene extends Phaser.Scene {
  private portraits: Phaser.GameObjects.Image[] = [];
  private reducedMotion = false;
  private starting = false;
  constructor() { super("Menu"); }
  create() {
    this.portraits = [];
    this.starting = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.cameras.main.resetFX();
    this.input.enabled = true;
    const duration = this.reducedMotion ? 0 : 280;
    const text = (x: number, y: number, value: string, size: number, color = "#f2fbf8", bold = false) =>
      this.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color,
        fontStyle: bold ? "bold" : "normal" }).setOrigin(0.5);
    this.add.image(270, 480, "jump-title").setDisplaySize(540, 960);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x062b33, 0x062b33, 0x041b25, 0x041b25, 0, 0, 1, 1)
      .fillRect(0, 440, 540, 140);
    shade.fillStyle(0x041b25).fillRect(0, 580, 540, 380);
    if (!this.reducedMotion) {
      for (let i = 0; i < 12; i++) {
        const mote = this.add.circle(35 + (i * 97) % 470, 80 + (i * 43) % 360, i % 3 + 1,
          i % 2 ? 0xffce76 : 0x87f0e1, 0.35);
        this.tweens.add({ targets: mote, y: mote.y - 38, alpha: 0, duration: 2100 + i * 170,
          delay: i * 140, repeat: -1, yoyo: true, ease: "Sine.InOut" });
      }
    }
    text(270, 506, "ESCOLHA QUEM VAI SALTAR", 14, "#d9fff4", true)
      .setShadow(0, 2, "#031a23", 5, true, true);
    const selected = getCharacter(this.registry.get("character"));
    const colors = [0x71e6df, 0xcbb2ff, 0xffb9d8];
    const cards = characters.map((character, index) => {
      const x = 108 + index * 162;
      const root = this.add.container(x, 439);
      const halo = this.add.ellipse(0, -62, 128, 160, colors[index], 0.12);
      const ring = this.add.ellipse(0, 0, 110, 18, colors[index], 0.16).setStrokeStyle(2, colors[index], 0.4);
      const portrait = this.add.image(0, 0, character.id + "-idle", 0)
        .setOrigin(character.originX, character.originY).setDisplaySize(190, 190);
      this.portraits.push(portrait);
      const pill = this.add.graphics();
      const label = text(0, 36, character.name, 20, "#fff6df", true);
      root.add([halo, ring, portrait, pill, label]);
      const zone = this.add.zone(x, 394, 148, 220).setInteractive({ useHandCursor: true });
      return { character, root, portrait, halo, ring, pill, label, zone };
    });
    const selectCharacter = (id: string, animate = true) => {
      if (this.starting) return;
      this.registry.set("character", id);
      for (const card of cards) {
        const active = card.character.id === id;
        card.pill.clear().fillStyle(active ? 0xffce79 : 0x0b3540, 0.96)
          .fillRoundedRect(-65, 20, 130, 34, 17);
        card.label.setText((active ? "✓ " : "") + card.character.name).setColor(active ? "#172d30" : "#d7edee");
        this.tweens.killTweensOf(card.portrait);
        this.tweens.add({ targets: card.portrait, scaleX: (active ? 212 : 185) / 256,
          scaleY: (active ? 212 : 185) / 256, alpha: active ? 1 : 0.82,
          duration: animate ? duration : 0, ease: "Back.Out" });
        card.halo.setAlpha(active ? 1 : 0.18);
        card.ring.setAlpha(active ? 1 : 0.35);
        card.portrait.setY(0);
        if (active && animate && !this.reducedMotion)
          this.tweens.add({ targets: card.portrait, y: -16, duration: 180, yoyo: true, ease: "Sine.Out" });
      }
    };
    cards.forEach(card => card.zone.on("pointerdown", () => selectCharacter(card.character.id)));
    selectCharacter(selected.id, false);
    text(35, 538, "ESCOLHA SEU MUNDO", 15, "#a8d9d9", true).setOrigin(0, 0.5);
    text(504, 538, "3 FASES", 14, "#a8d9d9", true).setOrigin(1, 0.5);
    const stageCards = levels.map((level, index) => {
      const x = 108 + index * 162, root = this.add.container(x, 651);
      const border = this.add.graphics();
      const preview = this.add.image(0, -18, level.background).setDisplaySize(138, 96);
      const tint = this.add.rectangle(0, -18, 138, 96, 0x061e29, 0.23);
      const scale = Math.min(103 / level.productWidth, 65 / level.productHeight);
      const product = this.add.image(0, -16, level.product).setDisplaySize(level.productWidth * scale, level.productHeight * scale);
      const label = text(0, 53, level.name, 20, "#f3f9f6", true);
      const badge = text(53, -65, "✓", 17, "#132d35", true);
      const badgeBg = this.add.circle(53, -65, 12, 0xffce79);
      root.add([border, preview, tint, product, label, badgeBg, badge]);
      const zone = this.add.zone(x, 651, 148, 166).setInteractive({ useHandCursor: true });
      return { level, root, border, badge, badgeBg, zone };
    });
    const productLabel = text(270, 754, "", 16, "#ffdc9e", true);
    const hint = text(270, 787, "", 14, "#a6c7ce").setWordWrapWidth(456).setAlign("center");
    const selectLevel = (id: string, animate = true) => {
      if (this.starting) return;
      const level = getLevel(id);
      this.registry.set("level", level.id);
      productLabel.setText("NA IMPRESSORA  ·  " + level.productName.toUpperCase());
      hint.setText(level.hint);
      if (animate && !this.reducedMotion) {
        this.tweens.killTweensOf([productLabel, hint]);
        productLabel.setAlpha(0); hint.setAlpha(0);
        this.tweens.add({ targets: [productLabel, hint], alpha: 1, duration });
      }
      for (const card of stageCards) {
        const active = card.level.id === level.id;
        card.border.clear().fillStyle(active ? 0x16454c : 0x0c2b37)
          .fillRoundedRect(-74, -83, 148, 166, 18)
          .lineStyle(active ? 3 : 1, active ? 0xffce79 : 0x28505a)
          .strokeRoundedRect(-74, -83, 148, 166, 18);
        card.badge.setVisible(active); card.badgeBg.setVisible(active);
        this.tweens.killTweensOf(card.root);
        this.tweens.add({ targets: card.root, y: active ? 643 : 651,
          alpha: active ? 1 : 0.78, duration: animate ? duration : 0, ease: "Cubic.Out" });
      }
    };
    stageCards.forEach(card => card.zone.on("pointerdown", () => selectLevel(card.level.id)));
    selectLevel(getLevel(this.registry.get("level")).id, false);
    const button = this.add.container(270, 859);
    const buttonArt = this.add.graphics().fillStyle(0xa65c25).fillRoundedRect(-234, -31, 468, 70, 22)
      .fillStyle(0xffc568).fillRoundedRect(-234, -38, 468, 70, 22)
      .lineStyle(2, 0xffe0a2).strokeRoundedRect(-232, -36, 464, 66, 21);
    button.add([buttonArt, text(0, -3, "VAMOS SALTAR!  →", 25, "#183136", true)]);
    const start = () => {
      if (this.starting) return;
      this.starting = true;
      this.input.enabled = false;
      if (this.reducedMotion) { this.scene.start("Game"); return; }
      const hero = cards.find(card => card.character.id === this.registry.get("character"))!.portrait;
      this.tweens.killTweensOf(hero);
      this.tweens.add({ targets: hero, y: -100, alpha: 0, duration: 330, ease: "Cubic.In" });
      this.cameras.main.fadeOut(380, 4, 27, 37);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("Game"));
    };
    this.add.zone(270, 859, 468, 78).setInteractive({ useHandCursor: true })
      .on("pointerdown", start).on("pointerover", () => buttonArt.setAlpha(0.9))
      .on("pointerout", () => buttonArt.setAlpha(1));
    text(270, 919, "← → personagem   ·   ↑ ↓ fase   ·   Enter jogar", 14, "#b3d4db");
    text(270, 942, "Conclua uma fase para ganhar um cupom Artgian", 14, "#a5c8d1");
    const cycleCharacter = (direction: number) => {
      const index = characters.findIndex(c => c.id === this.registry.get("character"));
      selectCharacter(characters[(index + direction + characters.length) % characters.length].id);
    };
    const cycleLevel = (direction: number) => {
      const index = levels.findIndex(l => l.id === this.registry.get("level"));
      selectLevel(levels[(index + direction + levels.length) % levels.length].id);
    };
    const keys: Record<string, () => void> = {
      LEFT: () => cycleCharacter(-1), RIGHT: () => cycleCharacter(1),
      UP: () => cycleLevel(-1), DOWN: () => cycleLevel(1), SPACE: start, ENTER: start,
    };
    for (const [key, handler] of Object.entries(keys)) this.input.keyboard?.on("keydown-" + key, handler);
    this.events.once("shutdown", () => {
      for (const [key, handler] of Object.entries(keys)) this.input.keyboard?.off("keydown-" + key, handler);
    });
    if (!this.reducedMotion) {
      this.cameras.main.fadeIn(500, 4, 27, 37);
      cards.forEach((card, index) => {
        card.root.setY(457).setAlpha(0);
        this.tweens.add({ targets: card.root, y: 439, alpha: 1, duration: 500,
          delay: 100 + index * 90, ease: "Cubic.Out" });
      });
    }
  }
  update(time: number) {
    if (this.reducedMotion) return;
    this.portraits.forEach((portrait, index) => portrait.setFrame((Math.floor(time / 90) + index * 13) % 64));
  }
}
