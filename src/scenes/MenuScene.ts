import Phaser from "phaser";
import { getLevel, levels } from "../config/levels";
import { characters, getCharacter } from "../config/characters";

export class MenuScene extends Phaser.Scene {
  private portraits: Phaser.GameObjects.Image[] = [];
  constructor() { super("Menu"); }
  create() {
    this.portraits = [];
    const backdrop = this.add.image(270, 480, getLevel(this.registry.get("level")).background).setDisplaySize(640, 960);
    this.add.rectangle(270, 480, 540, 960, 0x08131d, 0.78);
    const text = (x: number, y: number, value: string, size: number, color = "#edf3f2", bold = false) =>
      this.add.text(x, y, value, { fontFamily: "Arial", fontSize: size + "px", color, fontStyle: bold ? "bold" : "normal" });
    text(38, 38, "A R T G I A N", 18, "#e7ba79", true);
    text(38, 87, "Camada\npor camada.", 49, "#f2f4ee", true).setLineSpacing(-3);
    text(40, 207, "Novos lugares. Muitas conquistas.", 17, "#9cb1bb");
    text(40, 261, "01  PERSONAGEM", 14, "#a9bdc6", true);
    const selected = getCharacter(this.registry.get("character"));
    this.registry.set("character", selected.id);
    const cardGap = 12;
    const cardWidth = (468 - cardGap * (characters.length - 1)) / characters.length;
    const cards = characters.map((character, index) => {
      const x = 36 + index * (cardWidth + cardGap);
      const center = x + cardWidth / 2;
      const background = this.add.graphics();
      const portrait = this.add.image(center, 468, character.id + "-idle", 0)
        .setOrigin(character.originX, character.originY).setDisplaySize(168, 168);
      this.portraits.push(portrait);
      text(center, 312, character.name, 23, "#f2f4ee", true).setOrigin(0.5);
      const badge = text(center, 507, "", 12, "#e7ba79", true).setOrigin(0.5);
      const zone = this.add.zone(center, 412, cardWidth, 244).setInteractive({ useHandCursor: true });
      return { character, x, background, badge, zone };
    });
    const select = (id: string) => {
      this.registry.set("character", id);
      for (const card of cards) {
        const active = card.character.id === id;
        card.background.clear().fillStyle(active ? 0x20343d : 0x142630, 0.94)
          .fillRoundedRect(card.x, 290, cardWidth, 244, 22)
          .lineStyle(active ? 2 : 1, active ? 0xe7ba79 : 0x30444f)
          .strokeRoundedRect(card.x, 290, cardWidth, 244, 22);
        card.badge.setText(active ? "✓ SELECIONADO" : "SELECIONAR");
      }
    };
    for (const card of cards) card.zone.on("pointerdown", () => select(card.character.id));
    select(selected.id);
    const cycle = (direction: number) => {
      const index = characters.findIndex((character) => character.id === this.registry.get("character"));
      select(characters[(index + direction + characters.length) % characters.length].id);
    };
    const previous = () => cycle(-1);
    const next = () => cycle(1);
    this.input.keyboard?.on("keydown-LEFT", previous);
    this.input.keyboard?.on("keydown-RIGHT", next);
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown-LEFT", previous);
      this.input.keyboard?.off("keydown-RIGHT", next);
    });
    text(40, 563, "02  FASE", 14, "#a9bdc6", true);
    const stageCards = levels.map((level, index) => {
      const x = 36 + index * 160, center = x + 74;
      const background = this.add.graphics();
      text(center, 612, level.name, 20, "#f2f4ee", true).setOrigin(0.5);
      const scale = Math.min(108 / level.productWidth, 63 / level.productHeight);
      this.add.image(center, 663, level.product)
        .setDisplaySize(level.productWidth * scale, level.productHeight * scale);
      text(center, 706, level.productName, 12, "#b9ccd4").setOrigin(0.5);
      const badge = text(center, 730, "", 12, "#e7ba79", true).setOrigin(0.5);
      const zone = this.add.zone(center, 668, 148, 153).setInteractive({ useHandCursor: true });
      return { level, x, background, badge, zone };
    });
    const stageInfo = text(270, 764, "", 13, "#b9ccd4").setOrigin(0.5);
    const selectLevel = (id: string) => {
      const level = getLevel(id);
      this.registry.set("level", level.id);
      backdrop.setTexture(level.background);
      stageInfo.setText(level.name + " · " + level.platforms.length + " plataformas · " + level.collectibles.length + " filamentos");
      for (const card of stageCards) {
        const active = card.level.id === level.id;
        card.background.clear().fillStyle(active ? 0x20343d : 0x142630, 0.94)
          .fillRoundedRect(card.x, 592, 148, 153, 18)
          .lineStyle(active ? 2 : 1, active ? card.level.accent : 0x30444f)
          .strokeRoundedRect(card.x, 592, 148, 153, 18);
        card.badge.setText(active ? "✓ SELECIONADA" : "SELECIONAR");
      }
    };
    for (const card of stageCards) card.zone.on("pointerdown", () => selectLevel(card.level.id));
    selectLevel(getLevel(this.registry.get("level")).id);
    const nextLevel = () => selectLevel(levels[(levels.findIndex((level) => level.id === this.registry.get("level")) + 1) % levels.length].id);
    const previousLevel = () => selectLevel(levels[(levels.findIndex((level) => level.id === this.registry.get("level")) + levels.length - 1) % levels.length].id);
    this.input.keyboard?.on("keydown-DOWN", nextLevel);
    this.input.keyboard?.on("keydown-UP", previousLevel);
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown-DOWN", nextLevel);
      this.input.keyboard?.off("keydown-UP", previousLevel);
    });
    const button = this.add.graphics();
    button.fillStyle(0xe7ba79).fillRoundedRect(36, 785, 468, 70, 18);
    text(270, 820, "COMEÇAR A SUBIR  →", 19, "#13232d", true).setOrigin(0.5);
    const start = () => this.scene.start("Game");
    this.add.zone(270, 820, 468, 70).setInteractive({ useHandCursor: true })
      .on("pointerdown", start)
      .on("pointerover", () => button.setAlpha(0.85))
      .on("pointerout", () => button.setAlpha(1));
    text(270, 886, "A / D ou ← → para mover  ·  Espaço para pular", 14, "#91a8b3").setOrigin(0.5);
    text(270, 911, "No celular, use os controles na tela.", 13, "#718995").setOrigin(0.5);
    this.input.keyboard?.once("keydown-SPACE", start);
    this.input.keyboard?.once("keydown-ENTER", start);
  }
  update(time: number) {
    for (const portrait of this.portraits) portrait.setFrame(Math.floor(time / 90) % 64);
  }
}
