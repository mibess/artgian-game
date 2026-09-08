export const characters = [
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
    // The extended jump pose is 188px versus ~213px in idle. Apply one
    // uniform correction to the entire jump, preserving crouches and poses.
    animationScale: { idle: 1, walk: 1, jump: 1.13 },
    jumpFrames: { start: 12, apex: 35, fallEnd: 53 },
  },
] as const;
export type Character = (typeof characters)[number];
export function getCharacter(id: unknown): Character {
  return characters.find((character) => character.id === id) ?? characters[0];
}
