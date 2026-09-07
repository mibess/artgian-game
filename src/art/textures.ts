import Phaser from "phaser";
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
  tex("platform", 220, 40, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, "#adbecb");
    g.addColorStop(0.12, "#425363");
    g.addColorStop(0.45, "#26323e");
    g.addColorStop(1, "#0c1119");
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(1, 1, 218, 37, 8);
    c.fill();
    c.strokeStyle = "#8194a1";
    c.stroke();
    c.fillStyle = "#0b1620";
    c.fillRect(32, 10, 156, 20);
    c.shadowColor = "#00bfff";
    c.shadowBlur = 14;
    c.fillStyle = "#17caff";
    c.fillRect(39, 14, 142, 7);
    c.fillStyle = "#beffff";
    c.fillRect(39, 14, 142, 2);
    c.shadowBlur = 0;
    [12, 208].forEach((x) => {
      c.fillStyle = "#121a24";
      c.beginPath();
      c.arc(x, 19, 7, 0, 7);
      c.fill();
      c.strokeStyle = "#82929c";
      c.stroke();
      c.fillStyle = "#d4a450";
      c.fillRect(x - 2, 16, 4, 5);
    });
    c.fillStyle = "#f5b855";
    c.fillRect(20, 1, 22, 4);
    c.fillRect(178, 1, 22, 4);
  });
  tex("spool", 48, 48, (c) => {
    c.translate(24, 24);
    c.rotate(-0.35);
    c.shadowColor = "#ffad28";
    c.shadowBlur = 12;
    c.fillStyle = "#ffb73f";
    c.beginPath();
    c.ellipse(0, 0, 17, 22, 0, 0, 7);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "#161c24";
    c.fillRect(-8, -17, 17, 34);
    c.strokeStyle = "#6d6250";
    for (let i = -7; i < 10; i += 3) {
      c.beginPath();
      c.moveTo(i, -16);
      c.lineTo(i, 16);
      c.stroke();
    }
    c.fillStyle = "#ffd174";
    c.beginPath();
    c.ellipse(-9, 0, 9, 20, 0, 0, 7);
    c.fill();
    c.fillStyle = "#422c1b";
    c.beginPath();
    c.ellipse(-9, 0, 5, 14, 0, 0, 7);
    c.fill();
    c.strokeStyle = "#fff2b0";
    c.stroke();
  });
  tex("particle", 12, 12, (c) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(6, 6, 5, 0, 7);
    c.fill();
  });
  tex("hat", 240, 150, (c) => {
    c.shadowColor = "#ffbb4d";
    c.shadowBlur = 15;
    c.fillStyle = "#f6dfac";
    c.beginPath();
    c.ellipse(120, 107, 108, 32, -0.08, 0, 7);
    c.fill();
    c.fillStyle = "#51352b";
    c.beginPath();
    c.ellipse(120, 100, 105, 30, -0.08, 0, 7);
    c.fill();
    c.beginPath();
    c.moveTo(61, 94);
    c.lineTo(81, 26);
    c.quadraticCurveTo(92, 8, 110, 28);
    c.quadraticCurveTo(124, 39, 152, 20);
    c.quadraticCurveTo(174, 10, 175, 35);
    c.lineTo(187, 94);
    c.quadraticCurveTo(120, 123, 61, 94);
    c.fill();
    c.strokeStyle = "#f5dab1";
    c.lineWidth = 4;
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = "#ddc8b0";
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(66, 82);
    c.quadraticCurveTo(124, 111, 183, 83);
    c.stroke();
    c.strokeStyle = "#e5d0ad";
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(153, 30, 7, 4, 0, 0, 7);
    c.stroke();
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
        if (data.data[n] + data.data[n + 1] + data.data[n + 2] < 24)
          data.data[n + 3] = 0;
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
  }
}
