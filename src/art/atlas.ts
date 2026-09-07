import Phaser from "phaser";
/** Rectangles describe the generated sheet, not a repeated tile grid: tall assets cross cell boundaries. */
const regions: Record<string, [number, number, number, number]> = {
  platform: [10, 190, 340, 150],
  spikes: [390, 160, 340, 180],
  striped: [770, 195, 340, 150],
  boost: [1200, 50, 150, 335],
  head: [10, 430, 330, 250],
  bed: [362, 460, 361, 193],
  hat: [756, 432, 322, 214],
  spool: [1150, 417, 255, 265],
  heart: [42, 753, 270, 235],
  fan: [385, 729, 300, 267],
  rail: [842, 670, 144, 350],
  shelf: [1110, 700, 300, 310],
};
export function loadAtlas(s: Phaser.Scene) {
  const source = s.textures
    .get("workshop-atlas")
    .getSourceImage() as HTMLImageElement;
  for (const [key, [x, y, w, h]] of Object.entries(regions)) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h),
      pixels = data.data,
      visited = new Uint8Array(w * h),
      queue = new Int32Array(w * h);
    let tail = 0,
      head = 0;
    // The delivered atlas has a baked pale preview checkerboard. Key only the
    // neutral background connected to the crop boundary, preserving interior highlights.
    const visit = (p: number) => {
      if (visited[p]) return;
      visited[p] = 1;
      const n = p * 4,
        r = pixels[n],
        g = pixels[n + 1],
        b = pixels[n + 2];
      if (
        Math.min(r, g, b) > 221 &&
        Math.max(r, g, b) - Math.min(r, g, b) < 15
      ) {
        queue[tail++] = p;
        pixels[n + 3] = 0;
      }
    };
    for (let xx = 0; xx < w; xx++) {
      visit(xx);
      visit((h - 1) * w + xx);
    }
    for (let yy = 0; yy < h; yy++) {
      visit(yy * w);
      visit(yy * w + w - 1);
    }
    while (head < tail) {
      const p = queue[head++],
        xx = p % w,
        yy = Math.floor(p / w);
      if (xx) visit(p - 1);
      if (xx < w - 1) visit(p + 1);
      if (yy) visit(p - w);
      if (yy < h - 1) visit(p + w);
    }
    let left = w,
      top = h,
      right = 0,
      bottom = 0;
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) {
        if (pixels[(yy * w + xx) * 4 + 3] > 30) {
          left = Math.min(left, xx);
          right = Math.max(right, xx);
          top = Math.min(top, yy);
          bottom = Math.max(bottom, yy);
        }
      }
    ctx.putImageData(data, 0, 0);
    const tw = right - left + 5,
      th = bottom - top + 5;
    const t = s.textures.createCanvas(key, tw, th)!;
    t.context.drawImage(
      canvas,
      left,
      top,
      tw - 4,
      th - 4,
      2,
      2,
      tw - 4,
      th - 4,
    );
    t.refresh();
  }
}
