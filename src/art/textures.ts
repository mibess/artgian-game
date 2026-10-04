import Phaser from "phaser";
import { loadAtlas } from "./atlas";

export function makeTextures(s: Phaser.Scene) {
  const tex = (
    name: string,
    w: number,
    h: number,
    draw: (c: CanvasRenderingContext2D) => void,
  ) => {
    // Generated artwork loaded in Boot takes precedence over these fallbacks.
    if (s.textures.exists(name)) return;
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

  // Fallback rounded five-point star and empty slot (artwork: assets/ui/star*.png).
  const star = (c: CanvasRenderingContext2D, r: number, inner: number) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? inner : r;
      c.lineTo(64 + Math.cos(a) * radius, 66 + Math.sin(a) * radius);
    }
    c.closePath();
  };
  tex("star", 128, 128, (c) => {
    c.lineJoin = "round";
    star(c, 56, 25);
    c.lineWidth = 9; c.strokeStyle = "#a3511c"; c.stroke();
    const g = c.createLinearGradient(0, 14, 0, 116);
    g.addColorStop(0, "#fff3b0"); g.addColorStop(0.45, "#ffc94d"); g.addColorStop(1, "#f08a24");
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    c.fillStyle = "rgba(255,255,255,0.45)";
    c.beginPath(); c.ellipse(54, 44, 30, 15, -0.5, 0, Math.PI * 2); c.fill();
    c.restore();
  });
  tex("star-empty", 128, 128, (c) => {
    c.lineJoin = "round";
    star(c, 56, 25);
    c.lineWidth = 7; c.strokeStyle = "rgba(160,214,214,0.45)"; c.stroke();
    c.fillStyle = "rgba(6,30,41,0.85)"; c.fill();
  });
  tex("ring", 128, 128, (c) => {
    c.lineWidth = 6; c.strokeStyle = "#fff";
    c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.stroke();
  });

  // Keep the original physics texture dimensions. This texture remains invisible.
  tex("pose0", 100, 140, () => undefined);
}
