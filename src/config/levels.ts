import { FLOOR, TOP } from "./gameConfig.ts";
import { platforms as workshopPlatforms, collectibleIndices, type PlatformSpec } from "../systems/LevelSystem.ts";

export type HazardKind = "laser" | "head" | "spikes" | "arm" | "steam" | "pendant" | "sound" | "cymbal";
export interface HazardSpec {
  kind: HazardKind; x: number; y: number; w: number; h: number; phase: number;
}
export interface Level {
  id: string; name: string; subtitle: string; hint: string;
  background: string; platform: string; alternate: string; product: string;
  productName: string; productWidth: number; productHeight: number;
  accent: number; platforms: PlatformSpec[]; collectibles: number[]; hazards: HazardSpec[];
}

function themedPlatforms(theme: "home" | "studio"): PlatformSpec[] {
  const route = theme === "home"
    ? [230, 350, 245, 135, 255, 385, 285, 160]
    : [245, 370, 280, 145, 230, 365, 255, 135];
  return [
    { x: 105, y: FLOOR, w: 240, kind: "normal", checkpoint: 0 },
    ...Array.from({ length: 47 }, (_, i): PlatformSpec => {
      const checkpoint = i % 7 === 6;
      return {
        x: route[i % route.length], y: FLOOR - (i + 1) * 133,
        w: checkpoint ? 185 : i < 4 ? 160 : theme === "home" ? 142 : 150,
        kind: checkpoint || i < 3 ? "normal" : theme === "home"
          ? i % 4 === 0 ? "sink" : i % 5 === 2 ? "horizontal" : "normal"
          : i % 8 === 3 || i % 8 === 4 ? "beat" : i % 6 === 0 ? "boost" : "normal",
        phase: (i % 2) * 1800,
        ...(checkpoint ? { checkpoint: Math.floor(i / 7) + 1 } : {}),
      };
    }),
    { x: 205, y: TOP, w: 220, kind: "normal" },
  ];
}

const themedHazards = (theme: "home" | "studio"): HazardSpec[] =>
  [8, 17, 25, 33, 42].flatMap((index, i) => {
    const y = FLOOR - index * 133 - 64;
    return [
      { kind: theme === "home" ? "steam" as const : "sound" as const,
        x: i % 2 ? 100 : 430, y, w: 82, h: theme === "home" ? 125 : 86, phase: i * 700 },
      { kind: theme === "home" ? "pendant" as const : "cymbal" as const,
        x: 270, y: y - 300, w: 48, h: 40, phase: i * 550 },
    ];
  });

export const levels: Level[] = [
  {
    id: "workshop", name: "Oficina", subtitle: "A primeira impressão",
    hint: "Desvie das máquinas e alcance a última camada.",
    background: "workshop-depth", platform: "platform", alternate: "striped",
    product: "hat", productName: "Chapéu", productWidth: 177, productHeight: 107,
    accent: 0xe7ba79, platforms: workshopPlatforms, collectibles: collectibleIndices,
    hazards: [
      { kind: "spikes", x: 450, y: FLOOR - 28, w: 174, h: 28, phase: 0 },
      { kind: "laser", x: 340, y: 2100, w: 150, h: 7, phase: 0 },
      { kind: "laser", x: 150, y: 1300, w: 170, h: 7, phase: 1700 },
      { kind: "spikes", x: 475, y: 1600, w: 80, h: 20, phase: 0 },
      { kind: "spikes", x: 49, y: 1070, w: 80, h: 20, phase: 0 },
      { kind: "head", x: 270, y: 640, w: 65, h: 45, phase: 0 },
      { kind: "arm", x: 430, y: 1850, w: 65, h: 20, phase: 0 },
    ],
  },
  {
    id: "home", name: "Casa", subtitle: "Camadas de aconchego",
    hint: "Almofadas cedem. Espere o vapor passar para saltar.",
    background: "home-background", platform: "home-shelf", alternate: "home-cushion",
    product: "home-product", productName: "Bandeja facetada", productWidth: 207, productHeight: 84,
    accent: 0xb7d5b0, platforms: themedPlatforms("home"), collectibles: collectibleIndices,
    hazards: themedHazards("home"),
  },
  {
    id: "studio", name: "Estúdio", subtitle: "No ritmo da impressão",
    hint: "Teclas piscando vão sumir. Salte no intervalo dos pulsos.",
    background: "studio-background", platform: "studio-keys", alternate: "studio-speaker",
    product: "studio-product", productName: "Porta-palhetas", productWidth: 97, productHeight: 146,
    accent: 0xc2a6ef, platforms: themedPlatforms("studio"), collectibles: collectibleIndices,
    hazards: themedHazards("studio"),
  },
];
export function getLevel(id: unknown): Level {
  return levels.find((level) => level.id === id) ?? levels[0];
}
export function beatState(time: number, phase: number) {
  const position = (time + phase) % 3600;
  return { solid: position < 2600, warning: position >= 2150 && position < 2600 };
}
export function hazardState(kind: HazardKind, time: number, phase: number) {
  const position = (time + phase) % (kind === "steam" ? 4400 : kind === "sound" ? 3000 : 3400);
  if (kind === "steam") return { active: position >= 2900, warning: position >= 2200 && position < 2900 };
  if (kind === "sound") return { active: position >= 2200, warning: position >= 1600 && position < 2200 };
  return { active: kind !== "laser" || position < 1600, warning: false };
}
