import Phaser from "phaser";
import { makeTextures } from "../art/textures";
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
    this.load.spritesheet("mib-idle", "assets/mib/mib_idle_sheet.png", {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet("mib-walk", "assets/mib/mib_walk_sheet.png", {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet("mib-jump", "assets/mib/mib_jump_sheet.png", {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.image("workshop-atlas", "assets/workshop-atlas.png");
    this.load.image("workshop-depth", "assets/workshop-clean.png");
    this.load.image("filament", "assets/filament-real.png");
  }
  create() {
    makeTextures(this);
    this.scene.start("Menu");
  }
}
