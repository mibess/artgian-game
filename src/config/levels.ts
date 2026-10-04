import { gardenCycle, beeFlight } from "./garden.ts";
import { FLOOR, TOP, W } from "./gameConfig.ts";
import { platforms as workshopPlatforms, collectibleIndices, type PlatformKind, type PlatformSpec } from "../systems/LevelSystem.ts";

export type HazardKind = "laser" | "head" | "spikes" | "arm" | "steam" | "pendant" | "sound" | "cymbal" | "sprinkler" | "bee"
  | "nozzle" | "drip" | "fan";
export interface HazardSpec {
  kind: HazardKind; x: number; y: number; w: number; h: number; phase: number;
}
export interface Level {
  id: string; name: string; subtitle: string; hint: string;
  background: string; platform: string; alternate: string; product: string;
  productName: string; productWidth: number; productHeight: number;
  accent: number; platforms: PlatformSpec[]; collectibles: number[]; hazards: HazardSpec[];
}

function themedPlatforms(theme: "home" | "studio" | "garden"): PlatformSpec[] {
  const route = theme === "home"
    ? [230, 350, 245, 135, 255, 385, 285, 160]
    : theme === "garden" ? [225, 345, 260, 140, 245, 375, 280, 155]
    : [245, 370, 280, 145, 230, 365, 255, 135];
  return [
    { x: 105, y: FLOOR, w: 240, kind: "normal", checkpoint: 0 },
    ...Array.from({ length: 47 }, (_, i): PlatformSpec => {
      const checkpoint = i % 7 === 6;
      return {
        x: route[i % route.length], y: FLOOR - (i + 1) * 133,
        w: checkpoint ? 185 : i < 4 ? 160 : theme === "home" ? 142 : 150,
        kind: checkpoint || i < 3 ? "normal" : theme !== "studio"
          ? i % 4 === 0 ? "sink" : i % 5 === 2 ? "horizontal" : "normal"
          : i % 8 === 3 || i % 8 === 4 ? "beat" : i % 6 === 0 ? "boost" : "normal",
        phase: (i % 2) * 1800,
        ...(checkpoint ? { checkpoint: Math.floor(i / 7) + 1 } : {}),
      };
    }),
    { x: 205, y: TOP, w: 220, kind: "normal" },
  ];
}

// Print bed: every platform type, with fast shuttles that track the bed's Y axis.
function bedPlatforms(): PlatformSpec[] {
  const route = [215, 330, 250, 175, 290, 360, 240, 185];
  const kinds: PlatformKind[] = ["shuttle", "normal", "beat", "temporary", "vertical", "sink"];
  return [
    { x: 105, y: FLOOR, w: 240, kind: "normal", checkpoint: 0 },
    ...Array.from({ length: 47 }, (_, i): PlatformSpec => {
      const checkpoint = i % 7 === 6;
      return {
        x: route[i % route.length], y: FLOOR - (i + 1) * 133,
        w: checkpoint ? 185 : i < 4 ? 160 : 140,
        kind: checkpoint || i < 3 ? "normal" : i === 22 || i === 37 ? "boost" : kinds[i % kinds.length],
        phase: (i % 3) * 1200,
        ...(checkpoint ? { checkpoint: Math.floor(i / 7) + 1 } : {}),
      };
    }),
    { x: 205, y: TOP, w: 220, kind: "normal" },
  ];
}
/** Platform top at a route index, for placing hazards relative to the climb. */
const rung = (index: number) => FLOOR - index * 133;
// Sweeping print heads sit between two rungs, clear of anyone standing on either
// (and away from vertical platforms, whose bobbing would reach the lane).
const bedHazards: HazardSpec[] = [
  ...[3, 6, 9, 13, 15, 19, 22, 25, 27, 31, 34, 37, 39, 43, 45].map((index, i): HazardSpec => ({
    kind: "nozzle", x: 270, y: rung(index) - 102, w: 66, h: 34, phase: i * 1700 })),
  // Drops fall onto the landing below (timing), never across a checkpoint.
  ...[[5, 360], [8, 185], [11, 240], [14, 240], [17, 215], [20, 170], [23, 240], [26, 330],
    [29, 290], [32, 130], [35, 130], [38, 360], [41, 210], [44, 175], [46, 360]].map(([index, x], i): HazardSpec => ({
    kind: "drip", x, y: rung(index) - 420, w: 26, h: 36, phase: i * 650 })),
  ...[4, 10, 16, 23, 30, 36, 43].map((index, i): HazardSpec => ({
    kind: "fan", x: i % 2 ? 512 : 28, y: rung(index) - 60, w: W, h: 150, phase: i * 1100 })),
];

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
  {
    id: "garden", name: "Quintal", subtitle: "Margô · A hora dourada",
    hint: "Espere a abelha cruzar e salte no intervalo da água.",
    background: "garden-background", platform: "garden-plank", alternate: "garden-cushion",
    product: "garden-bowl", productName: "Tigela da Margô", productWidth: 150, productHeight: 85,
    accent: 0xf5bf86, platforms: themedPlatforms("garden"), collectibles: collectibleIndices,
    hazards: [
      ...[8, 17, 25, 33, 42].map((index, i): HazardSpec => ({
        kind: "sprinkler", x: i % 2 ? 130 : 395, y: FLOOR - index * 133 - 65,
        w: 90, h: 118, phase: i * 700,
      })),
      ...[5, 12, 19, 26, 33, 40, 46].map((index, i): HazardSpec => ({
        kind: "bee", x: i % 2 ? 498 : 42, y: FLOOR - index * 133 - 190,
        w: 48, h: 32, phase: i * 650,
      })),
    ],
  },
  {
    id: "bed", name: "Mesa", subtitle: "Dentro da impressora",
    hint: "O bico varre a mesa, gotas quentes caem e a ventoinha empurra. Observe o ritmo antes de saltar.",
    background: "bed-background", platform: "bed-plate", alternate: "bed-support",
    product: "bed-product", productName: "Foguete", productWidth: 92, productHeight: 166,
    accent: 0xff9a52, platforms: bedPlatforms(), collectibles: collectibleIndices,
    hazards: bedHazards,
  },
];
export function getLevel(id: unknown): Level {
  return levels.find((level) => level.id === id) ?? levels[0];
}
export function beatState(time: number, phase: number) {
  const position = (time + phase) % 3600;
  return { solid: position < 2600, warning: position >= 2150 && position < 2600 };
}
export const dripCycle = { formingMs: 1300, fallingMs: 1000, restMs: 900, distance: 420 };
export const fanCycle = { idleMs: 1800, warningMs: 800, activeMs: 1600, push: 190 };
/** Print-head sweep: faster than walking, so jumps across its lane need timing. */
export const nozzleX = (time: number, phase: number) => 270 + Math.sin((time + phase) / 650) * 215;
/** Falling drop: forms (warning), falls with gravity (active), then rests out of play. */
export function dripFall(time: number, phase: number) {
  const position = (time + phase) % (dripCycle.formingMs + dripCycle.fallingMs + dripCycle.restMs);
  const falling = position >= dripCycle.formingMs && position < dripCycle.formingMs + dripCycle.fallingMs;
  const t = falling ? (position - dripCycle.formingMs) / dripCycle.fallingMs : 0;
  return { active: falling, warning: position < dripCycle.formingMs && position > dripCycle.formingMs * 0.35,
    offsetY: falling ? t * t * dripCycle.distance : 0, resting: !falling && position >= dripCycle.formingMs };
}
export function hazardState(kind: HazardKind, time: number, phase: number) {
  if (kind === "drip") { const { active, warning } = dripFall(time, phase); return { active, warning }; }
  if (kind === "fan") {
    const position = (time + phase) % (fanCycle.idleMs + fanCycle.warningMs + fanCycle.activeMs);
    return { active: position >= fanCycle.idleMs + fanCycle.warningMs,
      warning: position >= fanCycle.idleMs && position < fanCycle.idleMs + fanCycle.warningMs };
  }
  if (kind === "bee") {
    const { active, warning } = beeFlight(time, phase, true);
    return { active, warning };
  }
  if (kind === "sprinkler") {
    const position = (time + phase) % (gardenCycle.idleMs + gardenCycle.warningMs + gardenCycle.activeMs);
    return { active: position >= gardenCycle.idleMs + gardenCycle.warningMs,
      warning: position >= gardenCycle.idleMs && position < gardenCycle.idleMs + gardenCycle.warningMs };
  }
  const position = (time + phase) % (kind === "steam" ? 4400 : kind === "sound" ? 3000 : 3400);
  if (kind === "steam") return { active: position >= 2900, warning: position >= 2200 && position < 2900 };
  if (kind === "sound") return { active: position >= 2200, warning: position >= 1600 && position < 2200 };
  return { active: kind !== "laser" || position < 1600, warning: false };
}
