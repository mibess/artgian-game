import Phaser from "phaser";
import "./style.css";
import { W, H, GRAVITY } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { textResolution } from "./config/rendering";
import { fitPlayfield } from "./config/viewport";

const viewport = document.querySelector<HTMLElement>("#viewport")!;
const surface = document.querySelector<HTMLElement>("#game")!;
const resizeSurface = () => {
  const visual = window.visualViewport;
  viewport.style.height = `${visual?.height ?? window.innerHeight}px`;
  viewport.style.width = `${visual?.width ?? window.innerWidth}px`;
  viewport.style.top = `${visual?.offsetTop ?? 0}px`;
  viewport.style.left = `${visual?.offsetLeft ?? 0}px`;
  const css = getComputedStyle(viewport);
  const size = fitPlayfield(
    viewport.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
    viewport.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom),
  );
  surface.style.width = `${size.width}px`;
  surface.style.height = `${size.height}px`;
};
resizeSurface();
window.addEventListener("resize", resizeSurface);
window.visualViewport?.addEventListener("resize", resizeSurface);
window.visualViewport?.addEventListener("scroll", resizeSurface);

const fontResolution = textResolution(window.devicePixelRatio);
Phaser.GameObjects.GameObjectFactory.remove("text");
Phaser.GameObjects.GameObjectFactory.register("text", function (
  this: Phaser.GameObjects.GameObjectFactory, x: number, y: number,
  value: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  return this.displayList.add(new Phaser.GameObjects.Text(this.scene, x, y, value,
    { ...style, resolution: fontResolution }));
});
const game = new Phaser.Game({
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
const resizeObserver = new ResizeObserver(() => game.scale.refresh());
resizeObserver.observe(surface);
game.events.once("destroy", () => {
  resizeObserver.disconnect();
  window.removeEventListener("resize", resizeSurface);
  window.visualViewport?.removeEventListener("resize", resizeSurface);
  window.visualViewport?.removeEventListener("scroll", resizeSurface);
});
