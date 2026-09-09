import Phaser from "phaser";
import { makeTextures } from "../art/textures";
import { characters } from "../config/characters";
import { loadLevelAssets } from "../art/levelAssets";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    this.cameras.main.setBackgroundColor("#061e29");
    const title = this.add
      .text(270, 345, "ARTGIAN JUMP", {
        fontFamily: "Arial",
        fontSize: "25px",
        color: "#f3d6a2",
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    this.add
      .text(270, 562, "Preparando a oficina…", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#d7edf0",
      })
      .setOrigin(0.5);
    this.add.rectangle(270, 606, 280, 8, 0x234752);
    const bar = this.add.rectangle(130, 606, 0, 8, 0xffca70).setOrigin(0, 0.5);
    const percent = this.add.text(270, 634, "0%", {
      fontFamily: "Arial", fontSize: "14px", color: "#96c3ca",
    }).setOrigin(0.5);
    this.load.on("progress", (value: number) => {
      bar.width = 280 * value;
      percent.setText(Math.round(value * 100) + "%");
    });
    // Load these first so the real artwork can animate while the sheets load.
    this.load.once("filecomplete-image-jump-logo", () => {
      const logo = this.add.image(270, 345, "jump-logo");
      logo.setScale(Math.min(330 / logo.width, 150 / logo.height));
      title.setVisible(false);
    });
    this.load.once("filecomplete-image-filament", () => {
      const spool = this.add.image(270, 469, "filament").setDisplaySize(96, 96);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        this.tweens.add({ targets: spool, angle: 360, duration: 2400, repeat: -1, ease: "Linear" });
    });
    this.load.image("jump-logo", "assets/menu/artgian-jump-logo.png");
    this.load.image("filament", "assets/filament-real.png");
    this.load.image("jump-title", "assets/menu/artgian-jump.png");
    for (const character of characters) {
      for (const action of ["idle", "walk", "jump"]) {
        this.load.spritesheet(character.id + "-" + action,
          "assets/" + character.id + "/" + character.id + "_" + action + "_sheet.png" +
            (character.id === "giulinha" ? "?v=20260908-grid64" : ""),
          { frameWidth: 256, frameHeight: 256 });
      }
    }
    this.load.image("workshop-atlas", "assets/workshop-atlas.png");
    this.load.image("workshop-depth", "assets/workshop-clean.png");
    this.load.spritesheet("home-kettle-idle", "assets/levels/home/chaleira_idle_sheet.png",
      { frameWidth: 256, frameHeight: 256 });
    for (const theme of ["home", "studio"]) {
      this.load.image(theme + "-background", "assets/levels/" + theme + "/background.png");
      this.load.image(theme + "-atlas-source", "assets/levels/" + theme + "/assets.png");
      this.load.image(theme + "-product-source", "assets/levels/" + theme + "/product.png");
    }
  }
  create() {
    makeTextures(this);
    loadLevelAssets(this);
    // Keep the complete loading screen visible for a fixed extra second.
    this.time.delayedCall(1000, () => this.scene.start("Menu"));
  }
}
