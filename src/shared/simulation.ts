import { FLOOR, TOP, GRAVITY, JUMP, SPEED, WORLD_H, H } from "../config/gameConfig.ts";
import { beatState, hazardState, type Level, type HazardSpec } from "../config/levels.ts";

// This is the sole gameplay authority, used for client prediction and server replay.
// Only input commands cross the trust boundary; positions, lives and wins never do.
export const STEP_MS = 1000 / 60;
export const RULES_VERSION = 1;
export type Command = { axis: -1 | 0 | 1; jump: boolean };
export interface Simulation {
  tick: number; x: number; feet: number; vx: number; vy: number;
  groundAt: number; jumpAt: number; support: number; lastLanding: number; lives: number;
  checkpoint: number; checkpointX: number; checkpointFeet: number;
  invulnerableUntil: number; respawnAt: number; cameraY: number; highestCameraY: number;
  maxProgress: number; collected: number[]; activated: number[];
  status: "playing" | "won" | "lost";
}
const PLATFORM_FEET_OFFSET = 13.5;
export function initialState(level: Level): Simulation {
  return { tick: 0, x: 105, feet: FLOOR - 16.5, vx: 0, vy: 0,
    groundAt: -999, jumpAt: -999, support: -1, lastLanding: 0, lives: 3, checkpoint: 0,
    checkpointX: 105, checkpointFeet: FLOOR - 16.5,
    invulnerableUntil: 0, respawnAt: 0, cameraY: WORLD_H - H,
    highestCameraY: WORLD_H - H, maxProgress: 0, collected: [],
    activated: level.platforms.map(() => -1), status: "playing" };
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function platformAt(level: Level, state: Simulation, i: number, time = state.tick * STEP_MS) {
  const p = level.platforms[i];
  const age = state.activated[i] < 0 ? -1 : time - state.activated[i];
  return { x: p.x + (p.kind === "horizontal" ? Math.sin(time / 1300) * 55 : 0),
    y: p.y + (p.kind === "vertical" ? Math.sin(time / 1400) * 32 :
      p.kind === "sink" && age >= 0 && age < 2500 ?
        age < 1600 ? Math.min(42, age * 0.05) : Math.max(0, 42 - (age - 1600) * 0.05) : 0),
    solid: p.kind === "beat" ? beatState(time, p.phase ?? 0).solid :
      !(p.kind === "temporary" && age >= 1700 && age < 4500) };
}
export function hazardAt(h: HazardSpec, time: number) {
  let { x, y } = h;
  if (h.kind === "head") x += Math.sin(time / 950) * 175;
  if (h.kind === "arm") x += Math.sin(time / 800) * 70;
  if (h.kind === "pendant") {
    x += Math.sin((time + h.phase) / 1100) * 115;
    y += (1 - Math.cos((time + h.phase) / 1100)) * 16;
  }
  if (h.kind === "cymbal") x += Math.sin((time + h.phase) / 750) * 140;
  return { x, y, ...hazardState(h.kind, time, h.phase) };
}
export function stepSimulation(s: Simulation, level: Level, input: Command): void {
  if (s.status !== "playing") return;
  const previousTime = s.tick * STEP_MS;
  const time = ++s.tick * STEP_MS;
  const dt = STEP_MS / 1000;
  for (let i = 0; i < s.activated.length; i++) {
    const duration = level.platforms[i].kind === "temporary" ? 4500 : 2500;
    if (s.activated[i] >= 0 && time - s.activated[i] >= duration) s.activated[i] = -1;
  }
  if (s.respawnAt) {
    if (time < s.respawnAt) return;
    s.x = s.checkpointX; s.feet = s.checkpointFeet;
    s.vx = s.vy = 0; s.support = -1; s.groundAt = s.jumpAt = -999;
    s.invulnerableUntil = time + 2000; s.respawnAt = 0;
    s.cameraY = clamp(s.feet - 40.5 - H * 0.72, 0, WORLD_H - H);
    s.highestCameraY = s.cameraY;
  }
  if (s.support >= 0) {
    const p = platformAt(level, s, s.support);
    const prev = platformAt(level, s, s.support, previousTime);
    if (p.solid) { s.x += p.x - prev.x; s.feet += p.y - prev.y; s.groundAt = time; }
    else s.support = -1;
  }
  if (input.jump) s.jumpAt = time;
  s.vx = input.axis ? clamp(s.vx + input.axis * 2000 * dt, -SPEED, SPEED) :
    Math.sign(s.vx) * Math.max(0, Math.abs(s.vx) - 2100 * dt);
  if (time - s.jumpAt < 130 && time - s.groundAt < 110) {
    s.vy = -JUMP; s.support = -1; s.groundAt = s.jumpAt = -999;
  }
  const oldFeet = s.feet;
  const oldX = s.x;
  s.x = clamp(s.x + s.vx * dt, 25, 515);
  s.feet += s.vy * dt + GRAVITY * dt * dt / 2;
  s.vy = Math.min(1100, s.vy + GRAVITY * dt);
  s.support = -1;
  if (s.vy >= 0) {
    let landing = -1, landingY = Infinity;
    const feetDelta = s.feet - oldFeet;
    const xDelta = s.x - oldX;
    const feetHalf = 13;
    const relEps = 1e-6;
    for (let i = 0; i < level.platforms.length; i++) {
      const p = level.platforms[i], now = platformAt(level, s, i);
      const prev = platformAt(level, s, i, previousTime);
      if (!now.solid || feetDelta <= 0) continue;
      const prevTop = prev.y - PLATFORM_FEET_OFFSET;
      const nextTop = now.y - PLATFORM_FEET_OFFSET;
      const relSpeed = feetDelta - (nextTop - prevTop);
      if (Math.abs(relSpeed) < relEps) continue;
      const impactT = (prevTop - oldFeet) / relSpeed;
      if (impactT < 0 || impactT > 1) continue;
      const platformX = prev.x + (now.x - prev.x) * impactT;
      const impactX = oldX + xDelta * impactT;
      const impactY = prevTop + (nextTop - prevTop) * impactT;
      if (impactX + feetHalf > platformX - p.w / 2 && impactX - feetHalf < platformX + p.w / 2 &&
        impactY < landingY) {
        landing = i; landingY = impactY;
      }
    }
    if (landing >= 0) {
      s.feet = landingY; s.vy = 0; s.support = landing; s.lastLanding = landing; s.groundAt = time;
      const p = level.platforms[landing], at = platformAt(level, s, landing);
      if ((p.kind === "sink" || p.kind === "temporary") && s.activated[landing] < 0)
        s.activated[landing] = time;
      if ((p.checkpoint ?? 0) > s.checkpoint) {
        s.checkpoint = p.checkpoint!; s.checkpointX = at.x; s.checkpointFeet = at.y - 16.5;
      }
      if (p.kind === "boost") { s.vy = -930; s.support = -1; s.groundAt = -999; }
    }
  }
  for (const i of level.collectibles) {
    const p = level.platforms[i];
    if (!s.collected.includes(i) && Math.abs(s.x - p.x) < 30 &&
      s.feet > p.y - 80 && s.feet - 65 < p.y - 46) s.collected.push(i);
  }
  s.maxProgress = Math.max(s.maxProgress, clamp((FLOOR - s.feet) / (FLOOR - TOP), 0, 1));
  const y = s.feet - 40.5, screenY = y - s.cameraY;
  let target = s.cameraY;
  if (screenY < 400) target = y - 400;
  else if (screenY > 760) target = y - 760;
  s.highestCameraY = Math.min(s.highestCameraY, s.cameraY);
  target = Math.min(target, s.highestCameraY + 180);
  s.cameraY = clamp(s.cameraY + (target - s.cameraY) * (1 - Math.exp(-STEP_MS / 200)), 0, WORLD_H - H);
  const hit = level.hazards.some(h => {
    const at = hazardAt(h, time);
    return at.active && s.x + 13 > at.x - h.w / 2 && s.x - 13 < at.x + h.w / 2 &&
      s.feet > at.y - h.h / 2 && s.feet - 65 < at.y + h.h / 2;
  });
  if (time >= s.invulnerableUntil && (hit || y > WORLD_H + 30 || y > s.cameraY + H + 110)) {
    s.lives--; s.vx = s.vy = 0; s.support = -1;
    if (!s.lives) s.status = "lost";
    else s.respawnAt = time + 450;
    return;
  }
  if (s.support >= 0 && level.platforms[s.support].y === TOP) {
    s.status = "won"; s.maxProgress = 1; s.vx = s.vy = 0;
  }
}
