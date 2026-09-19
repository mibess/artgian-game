export interface Character {
  id: string; name: string; originX: number; originY: number;
  animationScale: { idle: number; walk: number; jump: number };
  jumpFrames: { start: number; apex: number; fallEnd: number };
  frameCount?: number;
  idleFrameMs?: number;
}
export const margo: Character = {
  id: "margo", name: "Margô", originX: 0.5, originY: 238 / 256,
  // The seated idle artwork is larger than the walking model; keep its
  // proportions consistent while preserving the common paw anchor.
  animationScale: { idle: 0.8, walk: 1, jump: 1 },
  jumpFrames: { start: 6, apex: 23, fallEnd: 34 },
  frameCount: 60, idleFrameMs: 1000 / 12,
};
export const characters: Character[] = [
  {
    id: "mib", name: "Mib", originX: 0.4, originY: 0.93,
    animationScale: { idle: 1, walk: 0.99, jump: 1 },
    jumpFrames: { start: 6, apex: 30, fallEnd: 53 },
  },
  {
    id: "angel", name: "Angel", originX: 0.5, originY: 0.96,
    // Match the idle model's proportions, not the full silhouette: raised arms
    // and bent knees must still change the visible height during a jump.
    animationScale: { idle: 1, walk: 0.98, jump: 0.84 },
    jumpFrames: { start: 12, apex: 35, fallEnd: 53 },
  },
  {
    id: "giulinha", name: "Giulinha", originX: 0.5, originY: 248 / 256,
    // Idle is ~213px, walk ~205px, extended jump 188px. Use a constant
    // scale per animation so poses change naturally without size pumping.
    animationScale: { idle: 1, walk: 1.04, jump: 1.13 },
    jumpFrames: { start: 12, apex: 35, fallEnd: 53 },
  },
  margo,
];
export const characterFrameCount = (character: Character) => character.frameCount ?? 64;
export function characterSheetPath(character: Character, action: string) {
  return `assets/${character.id}/${character.id === "margo" ? "runtime/" : ""}${character.id}_${action}_sheet.png`;
}
export function landingFrame(character: Character, progress: number) {
  const start = character.jumpFrames.fallEnd + 1;
  return start + Math.round(Math.max(0, Math.min(1, progress)) * (characterFrameCount(character) - 1 - start));
}
export function getCharacter(id: unknown): Character {
  return characters.find((character) => character.id === id) ?? characters[0];
}
