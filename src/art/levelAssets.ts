import type Phaser from "phaser";

// Convert isolated white-backed concept art into transparent, tightly framed
// game textures; enclosed highlights remain intact.
function cutout(scene: Phaser.Scene, source: HTMLImageElement, key: string, x: number, y: number, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h), pixels = image.data;
  const seen = new Uint8Array(w * h), queue = new Int32Array(w * h);
  let head = 0, tail = 0;
  const visit = (p: number) => {
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4, min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (!pixels[i + 3] || (min > 216 && max - min < 22)) {
      pixels[i + 3] = 0; queue[tail++] = p;
    }
  };
  for (let i = 0; i < w; i++) { visit(i); visit((h - 1) * w + i); }
  for (let i = 0; i < h; i++) { visit(i * w); visit(i * w + w - 1); }
  while (head < tail) {
    const p = queue[head++], xx = p % w, yy = Math.floor(p / w);
    if (xx) visit(p - 1); if (xx < w - 1) visit(p + 1);
    if (yy) visit(p - w); if (yy < h - 1) visit(p + w);
  }
  let left = w, top = h, right = 0, bottom = 0;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++)
    if (pixels[(yy * w + xx) * 4 + 3] > 30) {
      left = Math.min(left, xx); top = Math.min(top, yy);
      right = Math.max(right, xx); bottom = Math.max(bottom, yy);
    }
  if (right <= left || bottom <= top) throw new Error("Empty level asset: " + key);
  ctx.putImageData(image, 0, 0);
  const texture = scene.textures.createCanvas(key, right - left + 5, bottom - top + 5)!;
  texture.context.drawImage(canvas, left, top, right - left + 1, bottom - top + 1, 2, 2, right - left + 1, bottom - top + 1);
  texture.refresh();
}

export function loadLevelAssets(scene: Phaser.Scene) {
  for (const [theme, keys] of [
    ["home", ["shelf", "cushion", "kettle", "lamp"]],
    ["studio", ["keys", "speaker", "cymbal", "microphone"]],
  ] as const) {
    const source = scene.textures.get(theme + "-atlas-source").getSourceImage() as HTMLImageElement;
    const w = Math.floor(source.width / 2), split = Math.round(source.height * 560 / 1254);
    // The lower props extend slightly above the geometric midpoint.
    keys.forEach((key, i) => cutout(scene, source, theme + "-" + key,
      (i % 2) * w, i < 2 ? 0 : split, w, i < 2 ? split : source.height - split));
    const product = scene.textures.get(theme + "-product-source").getSourceImage() as HTMLImageElement;
    cutout(scene, product, theme + "-product", 0, 0, product.width, product.height);
    scene.textures.remove(theme + "-atlas-source");
    scene.textures.remove(theme + "-product-source");
  }
}
