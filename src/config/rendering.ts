// Supersample text textures independently from world coordinates and physics.
// Cap density to avoid excessive GPU memory use on high-DPI phones.
export function textResolution(devicePixelRatio: number) {
  return Math.min(3, Math.max(2, Math.ceil(Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1)));
}
