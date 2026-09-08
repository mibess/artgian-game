import Phaser from "phaser";
import { makeTextures } from "../art/textures";
import { characters } from "../config/characters";
import { prepareGiulinhaSheets } from "../art/characterSheets";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    this.add
      .text(270, 460, "ARTGIAN", {
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
        if (character.id === "giulinha") {
          this.load.image("giulinha-source-" + action,
            "assets/giulinha/giulinha_" + action + "_sheet.png");
          continue;
        }
        this.load.spritesheet(character.id + "-" + action,
          "assets/" + character.id + "/" + character.id + "_" + action + "_sheet.png",
          { frameWidth: 256, frameHeight: 256 });
      }
    }
    this.load.image("workshop-atlas", "assets/workshop-atlas.png");
    this.load.image("workshop-depth", "assets/workshop-clean.png");
    this.load.image("filament", "assets/filament-real.png");
  }
  create() {
    makeTextures(this);
    prepareGiulinhaSheets(this);
    this.scene.start("Menu");
  }
}
