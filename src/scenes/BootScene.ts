import Phaser from "phaser";
import { makeTextures } from "../art/textures";
import { characters } from "../config/characters";
import { loadLevelAssets } from "../art/levelAssets";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    this.add
      .text(270, 460, "ARTGIAN JUMP", {
        fontFamily: "Arial",
        fontSize: "25px",
        color: "#f3d6a2",
        letterSpacing: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(270, 500, "Preparando a oficina…", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#9baebc",
      })
      .setOrigin(0.5);
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
    this.load.image("filament", "assets/filament-real.png");
    this.load.image("jump-title", "assets/menu/artgian-jump.png");
    for (const theme of ["home", "studio"]) {
      this.load.image(theme + "-background", "assets/levels/" + theme + "/background.png");
      this.load.image(theme + "-atlas-source", "assets/levels/" + theme + "/assets.png");
      this.load.image(theme + "-product-source", "assets/levels/" + theme + "/product.png");
    }
  }
  create() {
    makeTextures(this);
    loadLevelAssets(this);
    this.scene.start("Menu");
  }
}
