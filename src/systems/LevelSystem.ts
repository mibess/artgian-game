import { FLOOR, TOP } from "../config/gameConfig.ts";
export type PlatformKind =
  "normal" | "small" | "horizontal" | "vertical" | "temporary" | "boost";
export interface PlatformSpec {
  x: number;
  y: number;
  w: number;
  kind: PlatformKind;
  checkpoint?: number;
}
export const platforms: PlatformSpec[] = [
  { x: 105, y: FLOOR, w: 240, kind: "normal", checkpoint: 0 },
  ...Array.from({ length: 26 }, (_, i): PlatformSpec => ({
    x:
      i < 4
        ? [275, 265, 330, 180][i]
        : [155, 320, 405, 245, 115, 265, 405, 240][i % 8],
    y: FLOOR - (i + 1) * 133,
    w: i < 4 ? 150 : i % 5 === 3 ? 92 : 125,
    kind:
      i === 16
        ? "boost"
        : i % 7 === 5
          ? "temporary"
          : i % 6 === 4
            ? "horizontal"
            : i % 8 === 6
              ? "vertical"
              : i % 5 === 3
                ? "small"
                : "normal",
    ...([6, 13, 20].includes(i)
      ? {
          checkpoint: [6, 13, 20].indexOf(i) + 1,
          w: 175,
          kind: "normal" as const,
        }
      : {}),
  })),
  { x: 205, y: TOP, w: 220, kind: "normal" },
];
export function progressAt(y: number) {
  return Math.max(0, Math.min(1, (FLOOR - y) / (FLOOR - TOP)));
}
export const collectibleIndices = [
  1, 2, 4, 6, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27,
];
