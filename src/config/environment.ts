import { H, WORLD_H } from "./gameConfig.ts";

export type EnvironmentZone = "ground" | "middle" | "upper";
export const ZONE_HEIGHT = H;
export const ZONE_OVERLAP = 240;
export const ZONE_STEP = ZONE_HEIGHT - ZONE_OVERLAP;
export const ENVIRONMENT_HEIGHT = ZONE_HEIGHT + ZONE_STEP * 2;
// The ground's bottom aligns with the initial view, the roof with the final view.
export const ENVIRONMENT_SCROLL = (ENVIRONMENT_HEIGHT - H) / (WORLD_H - H);
export const zoneY: Record<EnvironmentZone, number> = {
  ground: ZONE_STEP * 2, middle: ZONE_STEP, upper: 0,
};

export interface Environment {
  ground: string;
  middle: string;
  upper: string;
  props: readonly [string, string, string];
}

export const environments: Record<string, Environment> = {
  workshop: {
    ground: "assets/workshop-clean.png",
    middle: "assets/levels/workshop/environment-middle.png",
    upper: "assets/levels/workshop/environment-upper.png",
    props: ["spool", "shelf", "fan"],
  },
  home: {
    ground: "assets/levels/home/background.png",
    middle: "assets/levels/home/environment-middle.png",
    upper: "assets/levels/home/environment-upper.png",
    props: ["home-product", "home-lamp", "home-lamp"],
  },
  studio: {
    ground: "assets/levels/studio/background.png",
    middle: "assets/levels/studio/environment-middle.png",
    upper: "assets/levels/studio/environment-upper.png",
    props: ["studio-speaker", "studio-microphone", "studio-microphone"],
  },
};

/** Anchor independent layers at a particular point in the actual camera ascent. */
export function sceneryY(progress: number, screenY: number, factor: number) {
  return (1 - progress) * (WORLD_H - H) * factor + screenY;
}
