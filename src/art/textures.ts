import Phaser from "phaser";
import { loadAtlas } from "./atlas";

export function makeTextures(s: Phaser.Scene) {
  const tex = (
    name: string,
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D) => void,
  ) => {
    const t = s.textures.createCanvas(name, w, h)!;
    draw(t.context);
    t.refresh();
  };
  loadAtlas(s);
  tex("particle", 12, 12, (c) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(6, 6, 5, 0, 7);
    c.fill();
  });
  tex("glow", 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

  // Keep the original physics texture dimensions. This texture remains invisible.
  tex("pose0", 100, 140, () => undefined);
}
