/** Every new illustrated element has its original green-screen source here. */
export const gardenAssets = ["sun", "cloud", "meadow", "plank", "cushion", "sprinkler", "bowl", "bee"] as const;
export type GardenAsset = typeof gardenAssets[number];
export const gardenSource = (asset: GardenAsset) => `assets/levels/garden/green-screen/${asset}.png`;
export const gardenSheet = (asset: GardenAsset, action = "idle") => `assets/levels/garden/animations/${asset}_${action}_sheet.png`;
export const gardenCycle = { idleMs: 2200, warningMs: 700, activeMs: 1500, burstFrame: 25 };

export const beeCycle = { idleMs: 1800, warningMs: 900, activeMs: 2500 };
export const beeAnimation = { frameSize: 128, frameCount: 60, frameRate: 24, burstFrame: 16 };
export const gardenActions = (asset: GardenAsset) => asset === "sprinkler" || asset === "bee" ? ["idle", "warn"] : ["idle"];
export const gardenFrameSize = (asset: GardenAsset) => asset === "bee" ? beeAnimation.frameSize : 256;
export const gardenFrameCount = (asset: GardenAsset) => asset === "bee" ? beeAnimation.frameCount : 64;

export function beeAnimationPose(time: number, phase: number, available: (key: string) => boolean, reducedMotion = false) {
  const position = (time + phase) % (beeCycle.idleMs + beeCycle.warningMs + beeCycle.activeMs);
  if (position >= beeCycle.idleMs && available("garden-bee-warn")) {
    const warningTime = position - beeCycle.idleMs;
    const frame = warningTime < beeCycle.warningMs
      ? Math.floor(warningTime / beeCycle.warningMs * beeAnimation.burstFrame)
      : beeAnimation.burstFrame + Math.floor((warningTime - beeCycle.warningMs) / beeCycle.activeMs * (beeAnimation.frameCount - beeAnimation.burstFrame));
    return { key: "garden-bee-warn", frame: reducedMotion ? warningTime < beeCycle.warningMs ? 0 : beeAnimation.burstFrame : Math.min(59, frame) };
  }
  if (available("garden-bee-idle")) return { key: "garden-bee-idle", frame: reducedMotion ? 0 : Math.floor(position / (1000 / beeAnimation.frameRate)) % beeAnimation.frameCount };
  return undefined;
}
/** Shared by rendering and server replay: warning at the edge, then a crossing. */
export function beeFlight(time: number, phase: number, startsLeft: boolean) {
  const duration = beeCycle.idleMs + beeCycle.warningMs + beeCycle.activeMs;
  const cycle = Math.floor((time + phase) / duration);
  const position = (time + phase) % duration;
  // Turn around at the far edge; never teleport back across the playfield.
  const rightward = startsLeft !== (cycle % 2 === 1);
  const active = position >= beeCycle.idleMs + beeCycle.warningMs;
  const progress = active ? (position - beeCycle.idleMs - beeCycle.warningMs) / beeCycle.activeMs : 0;
  return {
    x: rightward ? 42 + 456 * progress : 498 - 456 * progress,
    offsetY: active ? Math.sin(progress * Math.PI * 2) * 14 : 0,
    rightward, active,
    warning: position >= beeCycle.idleMs && !active,
  };
}

/** Remove chroma green, including edge spill, without touching warm artwork. */
export function keyGardenPixels(pixels: Uint8ClampedArray) {
  for (let i = 0; i < pixels.length; i += 4) {
    const other = Math.max(pixels[i], pixels[i + 2]);
    const excess = pixels[i + 1] - other;
    if (pixels[i + 1] > 80 && excess > 30) {
      pixels[i + 3] = Math.round(pixels[i + 3] * (1 - Math.min(1, (excess - 30) / 65)));
      pixels[i + 1] = Math.min(pixels[i + 1], other + 15);
    }
  }
}
