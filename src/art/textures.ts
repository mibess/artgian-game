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
  // Supplied 4 × 4 pose sheet. Each cell is trimmed and normalized to a shared foot anchor.
  const source = s.textures.get("sheet").getSourceImage() as HTMLImageElement;
  for (let i = 0; i < 16; i++) {
    const side = source.width / 4;
    const a = document.createElement("canvas");
    a.width = a.height = side;
    const c = a.getContext("2d")!;
    c.drawImage(
      source,
      (i % 4) * side,
      Math.floor(i / 4) * side,
      side,
      side,
      0,
      0,
      side,
      side,
    );
    const data = c.getImageData(0, 0, side, side);
    let minX = side,
      minY = side,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < side; y++)
      for (let x = 0; x < side; x++) {
        const n = (y * side + x) * 4;
        // Preserve the supplied alpha: dark hair and shoes are not background.
        if (data.data[n + 3] > 30) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    c.putImageData(data, 0, 0);
    tex("pose" + i, 100, 140, (d) => {
      const h = maxY - minY + 1,
        w = maxX - minX + 1,
        scale = 134 / h;
      d.drawImage(
        a,
        minX,
        minY,
        w,
        h,
        50 - (w * scale) / 2,
        140 - h * scale,
        w * scale,
        h * scale,
      );
    });
    tex("art-pose" + i, 240, 336, (d) => {
      const h = maxY - minY + 1,
        w = maxX - minX + 1,
        scale = 322 / h;
      d.drawImage(
        a,
        minX,
        minY,
        w,
        h,
        120 - (w * scale) / 2,
        336 - h * scale,
        w * scale,
        h * scale,
      );
    });
  }
}
