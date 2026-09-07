import Phaser from "phaser";
import { H } from "../config/gameConfig";
export function workshop(s: Phaser.Scene) {
  const g = s.add.graphics().setScrollFactor(0).setDepth(-20);
  g.fillGradientStyle(0x142631, 0x0b1723, 0x273037, 0x112432);
  g.fillRect(0, 0, 540, H);
  const far = s.add.graphics().setScrollFactor(0.12).setDepth(-19);
  for (let y = -500; y < 4700; y += 270) {
    for (let x = 30; x < 540; x += 110) {
      far.fillStyle(0x263e49, 0.45);
      far.fillRect(x, y, 70, 220);
      far.fillStyle(x % 3 ? 0x42869b : 0xd89643, 0.16);
      far.fillRect(x + 8, y + 12, 6, 195);
    }
    far.fillStyle(0x08111c, 0.6);
    far.fillRect(0, y + 230, 540, 20);
  }
  const mid = s.add.graphics().setScrollFactor(0.35).setDepth(-16);
  for (let y = -300; y < 4300; y += 440) {
    mid.fillStyle(0x422d23);
    mid.fillRect(0, y + 170, 540, 13);
    for (let x = 25; x < 540; x += 95) {
      mid.fillStyle(0x111c24);
      mid.fillRoundedRect(x, y + 91, 58, 78, 8);
      mid.lineStyle(
        8,
        [0x277ca1, 0xb96937, 0x9d8248][Math.floor(x / 95) % 3],
        0.65,
      );
      mid.strokeEllipse(x + 29, y + 128, 40, 62);
      mid.lineStyle(2, 0x18232a);
      mid.strokeEllipse(x + 29, y + 128, 22, 42);
    }
  }
  const rail = s.add.graphics().setScrollFactor(0.65).setDepth(-12);
  [32, 495].forEach((x) => {
    rail.fillStyle(0x080f18);
    rail.fillRect(x - 13, -1000, 32, 6000);
    rail.fillStyle(0x34434e);
    rail.fillRect(x - 9, -1000, 6, 6000);
    rail.fillStyle(0xb78042, 0.8);
    rail.fillRect(x + 10, -1000, 2, 6000);
    for (let y = -900; y < 5000; y += 150) {
      rail.fillStyle(0x4d5960);
      rail.fillRect(x - 18, y, 43, 16);
      rail.fillStyle(0x111923);
      rail.fillCircle(x - 9, y + 8, 3);
      rail.fillCircle(x + 17, y + 8, 3);
    }
  });
  const signs = [
    ["PEQUENAS\nCAMADAS.\nGRANDES\nCOISAS.", 65, 3490],
    ["IDEIAS\n↓\nREALIDADE", 420, 2740],
    ["CAMADA\nPOR\nCAMADA ↑", 67, 1770],
    ["COISAS BOAS\nLEVAM\nCAMADAS.", 422, 800],
  ] as const;
  signs.forEach(([text, x, y]) => {
    s.add
      .rectangle(x, y, 115, 170, 0x202c37, 0.9)
      .setStrokeStyle(2, 0x45525b)
      .setDepth(-5)
      .setAngle(x < 100 ? -5 : 4);
    s.add
      .text(x, y, text, {
        fontFamily: "Arial",
        fontStyle: "bold",
        fontSize: "17px",
        align: "center",
        lineSpacing: 9,
        color: "#b7b8b5",
      })
      .setOrigin(0.5)
      .setAngle(x < 100 ? -5 : 4)
      .setDepth(-4);
  });
  for (let i = 0; i < 28; i++) {
    const x = (i * 137) % 540,
      y = (i * 229) % 960;
    const p = s.add
      .circle(x, y, 1 + (i % 2), 0xe6b65a, 0.3)
      .setScrollFactor(0)
      .setDepth(-3);
    s.tweens.add({
      targets: p,
      y: y - 50,
      alpha: 0.05,
      duration: 3000 + i * 80,
      yoyo: true,
      repeat: -1,
    });
  }
  // Foreground cables and frame move independently from the distant workshop.
  const near = s.add.graphics().setScrollFactor(0.9).setDepth(14);
  near.lineStyle(7, 0x0c1820, 0.85);
  near.beginPath();
  near.moveTo(4, -1000);
  for (let y = -950; y < 4600; y += 150) near.lineTo(y % 300 ? 11 : 19, y);
  near.strokePath();
  near.fillStyle(0x0b131b, 0.7);
  near.fillRect(532, -1000, 8, 6000);
}
