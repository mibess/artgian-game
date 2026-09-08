import type Phaser from "phaser";

// ImageGen's source sheets have uneven row spacing and a baked preview backdrop.
// Parse them once at boot into the same 64 x 256px runtime frames as Mib/Angel.
const sources = [
  { action: "idle", rows: [0, 198, 379, 560, 741, 922, 1103] },
  { action: "walk", rows: [0, 192, 361, 530, 700, 870, 1040, 1254] },
  { action: "jump", rows: [0, 201, 360, 522, 681, 842, 1006, 1254] },
] as const;

function isolate(source: HTMLImageElement, left: number, top: number, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(source, left, top, width, height, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height);
  const pixels = data.data;
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  const visit = (p: number) => {
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (pixels[i + 3] === 0 || (min > 218 && max - min < 20)) {
      pixels[i + 3] = 0;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const p = queue[head++], x = p % width, y = Math.floor(p / width);
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (y > 0) visit(p - width);
    if (y < height - 1) visit(p + width);
  }
  // Discard isolated backdrop artifacts without changing enclosed white details.
  const labels = new Int32Array(width * height);
  let label = 0, largest = 0, largestSize = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || pixels[start * 4 + 3] === 0) continue;
    label++;
    head = 0; tail = 1; queue[0] = start; labels[start] = label;
    const connect = (p: number) => {
      if (!labels[p] && pixels[p * 4 + 3] > 0) {
        labels[p] = label; queue[tail++] = p;
      }
    };
    while (head < tail) {
      const p = queue[head++], x = p % width, y = Math.floor(p / width);
      if (x > 0) connect(p - 1);
      if (x < width - 1) connect(p + 1);
      if (y > 0) connect(p - width);
      if (y < height - 1) connect(p + width);
    }
    if (tail > largestSize) { largestSize = tail; largest = label; }
  }
  if (largestSize < 100) throw new Error("Giulinha frame is empty or incomplete");
  for (let p = 0; p < labels.length; p++)
    if (labels[p] !== largest) pixels[p * 4 + 3] = 0;
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (pixels[(y * width + x) * 4 + 3] > 30) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  // Anchor on the shoes, rather than recentering on an outstretched waving hand.
  let footLeft = width, footRight = 0;
  for (let y = Math.max(y0, y1 - 16); y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (pixels[(y * width + x) * 4 + 3] > 100) {
      footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x);
    }
  }
  context.putImageData(data, 0, 0);
  return { canvas, x0, y0, width: x1 - x0 + 1, height: y1 - y0 + 1, center: (footLeft + footRight) / 2 };
}

export function prepareGiulinhaSheets(scene: Phaser.Scene) {
  for (const { action, rows } of sources) {
    const sourceKey = "giulinha-source-" + action;
    const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
    const frames = [];
    for (let row = 0; row < rows.length - 1; row++) {
      for (let column = 0; column < 8; column++) {
        const left = Math.round(column * source.width / 8);
        const right = Math.round((column + 1) * source.width / 8);
        frames.push(isolate(source, left, rows[row], right - left, rows[row + 1] - rows[row]));
      }
    }
    // Frame 0 is a standing reference in all three source sheets. Keep one scale
    // throughout each animation so crouching never enlarges the character.
    const scale = 220 / frames[0].height;
    if (frames.some((frame) => frame.height * scale > 244 || frame.width * scale > 252))
      throw new Error("Giulinha animation exceeds its frame");
    const texture = scene.textures.createCanvas("giulinha-" + action, 2048, 2048)!;
    for (let i = 0; i < 64; i++) {
      const frame = frames[Math.round(i * (frames.length - 1) / 63)];
      const x = (i % 8) * 256, y = Math.floor(i / 8) * 256;
      texture.context.drawImage(frame.canvas, frame.x0, frame.y0, frame.width, frame.height,
        x + 128 + (frame.x0 - frame.center) * scale, y + 244 - frame.height * scale,
        frame.width * scale, frame.height * scale);
      texture.add(i, 0, x, y, 256, 256);
    }
    texture.refresh();
    scene.textures.remove(sourceKey);
  }
}
