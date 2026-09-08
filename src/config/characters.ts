export const characters = [
  {
    id: "mib", name: "Mib", originX: 0.4, originY: 0.93,
    animationScale: { idle: 1, walk: 0.99, jump: 1 },
  },
  {
    id: "angel", name: "Angel", originX: 0.5, originY: 0.96,
    // Match the idle model's proportions, not the full silhouette: raised arms
    // and bent knees must still change the visible height during a jump.
    animationScale: { idle: 1, walk: 0.98, jump: 0.84 },
  },
] as const;
export type Character = (typeof characters)[number];
export function getCharacter(id: unknown): Character {
  return characters.find((character) => character.id === id) ?? characters[0];
}
