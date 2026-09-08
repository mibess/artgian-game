export const characters = [
  { id: "mib", name: "Mib", originX: 0.4, originY: 0.93 },
  { id: "angel", name: "Angel", originX: 0.5, originY: 0.96 },
] as const;
export type Character = (typeof characters)[number];
export function getCharacter(id: unknown): Character {
  return characters.find((character) => character.id === id) ?? characters[0];
}
