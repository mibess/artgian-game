import Phaser from "phaser";
import { gardenAssets, gardenSource, gardenSheet, gardenActions, gardenFrameSize, gardenFrameCount, keyGardenPixels, type GardenAsset } from "../config/garden";
import { H, W, WORLD_H } from "../config/gameConfig";

// Vite discovers supplied sheets at startup/build; absent animations make no HTTP requests.
const suppliedSheets = import.meta.glob("/public/assets/levels/garden/animations/*_sheet.png", { eager: true, query: "?url", import: "default" });
export function loadGarden(scene: Phaser.Scene) {
  for (const asset of gardenAssets) {
    scene.load.image(`garden-${asset}-source`, gardenSource(asset));
    for (const action of gardenActions(asset)) {
      const path = gardenSheet(asset, action);
      const url = suppliedSheets[`/public/${path}`];
      if (typeof url === "string") scene.load.image(`garden-${asset}-${action}-source`, url);
    }
  }
}

function keyedCanvas(source: HTMLImageElement, trim: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  keyGardenPixels(data.data);
  ctx.putImageData(data, 0, 0);
  if (!trim) return canvas;
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data.data[(y * canvas.width + x) * 4 + 3] < 30) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) throw new Error("Garden asset has no visible pixels");
  const cropped = document.createElement("canvas");
  cropped.width = right - left + 1; cropped.height = bottom - top + 1;
  cropped.getContext("2d")!.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}
export function prepareGarden(scene: Phaser.Scene) {
  for (const asset of gardenAssets) {
    const key = `garden-${asset}`;
    scene.textures.addCanvas(key, keyedCanvas(scene.textures.get(key + "-source").getSourceImage() as HTMLImageElement, true));
    scene.textures.remove(key + "-source");
    for (const action of gardenActions(asset)) {
      const sheet = `${key}-${action}`;
      if (!scene.textures.exists(sheet + "-source")) continue;
      const source = scene.textures.get(sheet + "-source").getSourceImage() as HTMLImageElement;
      const frameSize = gardenFrameSize(asset), frameCount = gardenFrameCount(asset);
      if (source.width !== frameSize * 8 || source.height !== frameSize * 8) {
        console.warn(`Ignoring ${sheet}: expected ${frameSize * 8} × ${frameSize * 8} (8 × 8 frames)`);
        scene.textures.remove(sheet + "-source");
        continue;
      }
      const texture = scene.textures.addCanvas(sheet, keyedCanvas(source, false))!;
      scene.textures.addSpriteSheet("", texture, { frameWidth: frameSize, frameHeight: frameSize, endFrame: frameCount - 1 });
      scene.textures.remove(sheet + "-source");
      scene.anims.create({ key: sheet, frames: scene.anims.generateFrameNumbers(sheet, { start: 0, end: frameCount - 1 }), frameRate: 12, repeat: -1 });
    }
  }
  const sky = scene.textures.createCanvas("garden-sky", 640, 1280)!;
  const ctx = sky.context, gradient = ctx.createLinearGradient(0, 0, 0, 1280);
  gradient.addColorStop(0, "#54465f"); gradient.addColorStop(0.45, "#bd7a86");
  gradient.addColorStop(0.78, "#f3b184"); gradient.addColorStop(1, "#f7cd91");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 640, 1280); sky.refresh();
  const preview = scene.textures.createCanvas("garden-background", 640, 1280)!;
  preview.context.drawImage(sky.canvas, 0, 0);
  for (const [asset, x, y, w, h] of [
    ["sun", 365, 700, 180, 180], ["cloud", 40, 360, 340, 105],
    ["cloud", 310, 560, 300, 85], ["meadow", -160, 800, 960, 480],
  ] as const) preview.context.drawImage(scene.textures.get(`garden-${asset}`).getSourceImage() as HTMLCanvasElement, x, y, w, h);
  preview.refresh();
}

export function animateGardenSprite(sprite: Phaser.GameObjects.Sprite, asset: GardenAsset) {
  const animation = `garden-${asset}-idle`;
  if (sprite.scene.anims.exists(animation) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const width = sprite.displayWidth, height = sprite.displayHeight;
    sprite.play(animation).setDisplaySize(width, height);
  }
  return sprite;
}
export function gardenEnvironment(scene: Phaser.Scene, reducedMotion: boolean) {
  scene.add.image(W / 2, H / 2, "garden-sky").setDisplaySize(W, H).setScrollFactor(0).setDepth(-45);
  const sun = animateGardenSprite(scene.add.sprite(396, 655, "garden-sun").setDisplaySize(150, 150), "sun")
    .setScrollFactor(0).setDepth(-43);
  // A distant horizon stays in sight throughout the ascent, unlike an indoor ceiling.
  animateGardenSprite(scene.add.sprite(W / 2, H + 20, "garden-meadow").setDisplaySize(760, 320).setOrigin(0.5, 1), "meadow")
    .setScrollFactor(0).setDepth(-41);
  for (let i = 0; i < 5; i++) {
    const factor = 0.035 + i % 2 * 0.025;
    const cloud = animateGardenSprite(scene.add.sprite(65 + (i * 173) % 430,
      (WORLD_H - H) * factor + 160 + i * 110, "garden-cloud").setDisplaySize(240 + i % 2 * 70, 70 + i % 2 * 20), "cloud")
      .setScrollFactor(factor).setDepth(-42).setAlpha(0.75);
    if (!reducedMotion) scene.tweens.add({ targets: cloud, x: cloud.x + 24, duration: 12000 + i * 1600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }
  if (!reducedMotion) scene.tweens.add({ targets: sun, alpha: 0.88, duration: 5000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
}
