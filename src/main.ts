import Phaser from "phaser";
import "./style.css";
import { W, H, GRAVITY } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { textResolution } from "./config/rendering";

const fontResolution = textResolution(window.devicePixelRatio);
Phaser.GameObjects.GameObjectFactory.remove("text");
Phaser.GameObjects.GameObjectFactory.register("text", function (
  this: Phaser.GameObjects.GameObjectFactory, x: number, y: number,
  value: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  return this.displayList.add(new Phaser.GameObjects.Text(this.scene, x, y, value,
    { ...style, resolution: fontResolution }));
});
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
  render: { antialias: true, roundPixels: true },
});
