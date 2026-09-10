import { W, H } from "./gameConfig.ts";
/** Fit the entire logical playfield inside the usable browser viewport. */
export function fitPlayfield(width: number, height: number) {
  const scale = Math.max(0, Math.min(width / W, height / H));
  return { width: W * scale, height: H * scale };
}
