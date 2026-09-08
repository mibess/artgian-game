import Phaser from "phaser";
import "./style.css";
import { W, H, GRAVITY } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#101c26",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: false },
  },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, LevelCompleteScene],
  render: { antialias: true, roundPixels: false },
});
