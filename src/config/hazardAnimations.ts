import type { HazardKind } from "./levels.ts";

export interface HazardSheet {
  key: string; path: string; originX: number; originY: number; size: number;
}
export interface HazardAnimation {
  idle: HazardSheet;
  warn?: HazardSheet;
  idleMs: number; warningMs: number; activeMs: number; burstFrame: number;
}
// Register only supplied sheets. Missing entries keep their existing artwork.
export const hazardAnimations: Partial<Record<HazardKind, HazardAnimation>> = {
  steam: {
    idle: { key: "home-kettle-idle", path: "assets/levels/home/chaleira_idle_sheet.png", originX: 0.29, originY: 0.70, size: 140 },
    warn: { key: "home-kettle-warn", path: "assets/levels/home/chaleira_warn_sheet.png", originX: 0.48, originY: 0.70, size: 154 },
    idleMs: 2200, warningMs: 700, activeMs: 1500, burstFrame: 25,
  },
};

export function hazardAnimationPose(kind: HazardKind, elapsed: number, phase: number,
  available: (key: string) => boolean) {
  const animation = hazardAnimations[kind];
  if (!animation || !available(animation.idle.key)) return undefined;
  const position = (elapsed + phase) % (animation.idleMs + animation.warningMs + animation.activeMs);
  if (position >= animation.idleMs && animation.warn && available(animation.warn.key)) {
    const warningTime = position - animation.idleMs;
    const frame = warningTime < animation.warningMs
      ? Math.floor(warningTime / animation.warningMs * animation.burstFrame)
      : animation.burstFrame + Math.floor((warningTime - animation.warningMs) / animation.activeMs * (64 - animation.burstFrame));
    return { sheet: animation.warn, frame: Math.min(63, frame), state: "warn" as const };
  }
  return { sheet: animation.idle, frame: Math.floor((elapsed + phase) / (1000 / 12)) % 64, state: "idle" as const };
}
