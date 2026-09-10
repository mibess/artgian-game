import { initialState, stepSimulation, platformAt, type Simulation, type Command } from "../src/shared/simulation.ts";
import type { Level } from "../src/config/levels.ts";

// Test-only planner. Generates real movement/jump commands from the spawn point;
// never edits position, collision, lives, hazards, checkpoints or victory state.
export function playthrough(level: Level): Command[] {
  let state = initialState(level);
  const commands: Command[] = [];
  const advance = (s: Simulation, input: Command, log: Command[]) => {
    stepSimulation(s, level, input); log.push(input);
  };
  for (let i = 0; i < 10; i++) advance(state, { axis: 0, jump: false }, commands);
  let visited = 0;
  const search = (state: Simulation, lastPlatform: number): Command[] | null => {
    if (state.status === "won") return [];
    if (++visited > 3000) return null;
    const target = Math.min(lastPlatform + 1, level.platforms.length - 1);

    for (let wait = 0; wait <= 240; wait += 12) {
      for (const offset of [0, -25, 25, -45, 45]) {
        const trial = structuredClone(state), log: Command[] = [];
        for (let i = 0; i < wait && trial.status === "playing"; i++)
          advance(trial, { axis: 0, jump: false }, log);
        for (let frame = 0; frame < 170 && trial.status === "playing"; frame++) {
          const at = platformAt(level, trial, target, (trial.tick + 10) * 1000 / 60);
          const difference = at.x + offset - trial.x - trial.vx * 0.10;
          const axis = (Math.abs(difference) < 6 ? 0 : Math.sign(difference)) as Command["axis"];
          advance(trial, { axis, jump: frame === 0 }, log);
          if (trial.lives < state.lives) break;
          if ((trial.lastLanding >= target || trial.status === "won") && !trial.respawnAt) {
            const rest = search(trial, trial.lastLanding);
            if (rest) return [...log, ...rest];
            break;
          }
          // Boost platforms bounce immediately, so allow a legitimate flight to the next landing.
        }

      }
    }
    return null;
  };
  const rest = search(state, 0);
  if (!rest) throw new Error(`No winning route found: ${level.id} (${visited} branches)`);
  return [...commands, ...rest];
}
