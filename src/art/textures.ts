import Phaser from "phaser";
import { loadAtlas } from "./atlas";

type CharacterRow = "idle" | "walk" | "run" | "jump";

const median = (values: number[]) => {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
};

function isolateCharacter(
  source: HTMLImageElement,
  sx: number,
  sy: number,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(source, sx, sy, width, height, 0, 0, width, height);
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  const alpha = new Uint8Array(width * height);

  // Sample the clear edges of every scanline to remove the sheet's shaded backdrop
  // without treating the character's navy shirt as a blue-screen color.
  for (let y = 0; y < height; y++) {
    const red: number[] = [];
    const green: number[] = [];
    const blue: number[] = [];
    for (let edge = 0; edge < 2; edge++) {
      const start = edge ? width - 16 : 4;
      const end = edge ? width - 4 : 16;
      for (let x = start; x < end; x++) {
        const offset = (y * width + x) * 4;
        red.push(pixels[offset]);
        green.push(pixels[offset + 1]);
        blue.push(pixels[offset + 2]);
      }
    }
    const r0 = median(red);
    const g0 = median(green);
    const b0 = median(blue);
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      const offset = pixel * 4;
      const dr = pixels[offset] - r0;
      const dg = pixels[offset + 1] - g0;
      const db = pixels[offset + 2] - b0;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      alpha[pixel] = Phaser.Math.Clamp(Math.round((distance - 18) * 9), 0, 255);
    }
  }

  // Frame numbers and divider highlights also differ from the backdrop. Keep the
  // largest connected foreground shape, which is the character in every cell.
  const labels = new Int32Array(width * height);
  labels.fill(-1);
  const queue = new Int32Array(width * height);
  let label = 0;
  let largestLabel = -1;
  let largestSize = 0;
  for (let start = 0; start < alpha.length; start++) {
    if (alpha[start] <= 36 || labels[start] !== -1) continue;
    let head = 0;
    let tail = 1;
    let size = 0;
    queue[0] = start;
    labels[start] = label;
    while (head < tail) {
      const point = queue[head++];
      size++;
      const x = point % width;
      const y = Math.floor(point / width);
      const visit = (next: number) => {
        if (alpha[next] > 36 && labels[next] === -1) {
          labels[next] = label;
          queue[tail++] = next;
        }
      };
      if (x > 0) visit(point - 1);
      if (x + 1 < width) visit(point + 1);
      if (y > 0) visit(point - width);
      if (y + 1 < height) visit(point + width);
    }
    if (size > largestSize) {
      largestSize = size;
      largestLabel = label;
    }
    label++;
  }

  let keep = new Uint8Array(width * height);
  for (let i = 0; i < keep.length; i++) keep[i] = labels[i] === largestLabel ? 1 : 0;
  for (let pass = 0; pass < 2; pass++) {
    const expanded = keep.slice();
    for (let point = 0; point < keep.length; point++) {
      if (!keep[point]) continue;
      const x = point % width;
      const y = Math.floor(point / width);
      if (x > 0) expanded[point - 1] = 1;
      if (x + 1 < width) expanded[point + 1] = 1;
      if (y > 0) expanded[point - width] = 1;
      if (y + 1 < height) expanded[point + width] = 1;
    }
    keep = expanded;
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const point = y * width + x;
      const offset = point * 4;
      if (!keep[point]) {
        pixels[offset + 3] = 0;
        continue;
      }
      pixels[offset + 3] = alpha[point];
      if (alpha[point] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  context.putImageData(image, 0, 0);
  return { canvas, minX, minY, maxX, maxY };
}

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

  const source = s.textures.get("sheet").getSourceImage() as HTMLImageElement;
  const rows: Array<{ name: CharacterRow; top: number; bottom: number }> = [
    { name: "idle", top: 54, bottom: 264 },
    { name: "walk", top: 275, bottom: 485 },
    { name: "run", top: 496, bottom: 696 },
    { name: "jump", top: 706, bottom: 915 },
  ];
  const left = 154;
  const right = 1659;
  const cellWidth = (right - left) / 10;

  for (const row of rows) {
    for (let frame = 0; frame < 10; frame++) {
      const cellLeft = Math.round(left + cellWidth * frame) + 2;
      const cellRight = Math.round(left + cellWidth * (frame + 1)) - 2;
      const isolated = isolateCharacter(
        source,
        cellLeft,
        row.top + 2,
        cellRight - cellLeft,
        row.bottom - row.top - 4,
      );
      tex(`char-${row.name}-${frame}`, 240, 336, (context) => {
        const width = isolated.maxX - isolated.minX + 1;
        const height = isolated.maxY - isolated.minY + 1;
        const scale = Math.min(228 / width, 322 / height);
        context.drawImage(
          isolated.canvas,
          isolated.minX,
          isolated.minY,
          width,
          height,
          120 - (width * scale) / 2,
          332 - height * scale,
          width * scale,
          height * scale,
        );
      });
    }
  }
}
