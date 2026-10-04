// Local, per-device progress. Purely cosmetic: rewards are validated by the
// server, so nothing stored here can grant a coupon.
export interface LevelRecord {
  stars: number; bestTime: number; bestFilaments: number; bestLives: number;
  bestProgress: number; completions: number; attempts: number;
}
export interface RunResult {
  won: boolean; count: number; total: number; lives: number; time: number; progress: number;
}
export interface RecordUpdate {
  record: LevelRecord; stars: boolean[]; newStars: number;
  newTime: boolean; newProgress: boolean; firstClear: boolean;
}
export type Records = Record<string, LevelRecord>;

export const MAX_LIVES = 3;
export const STAR_GOALS = ["Concluir", "Filamentos", "Sem dano"] as const;
const KEY = "artgian-jump-records-v1";
const SETTINGS_KEY = "artgian-jump-settings-v1";

export const emptyRecord = (): LevelRecord => ({
  stars: 0, bestTime: 0, bestFilaments: 0, bestLives: 0, bestProgress: 0, completions: 0, attempts: 0,
});

export function starsFor(run: RunResult): boolean[] {
  return [run.won, run.won && run.count >= run.total, run.won && run.lives >= MAX_LIVES];
}
const count = (stars: number) => [0, 1, 2].filter(i => stars & (1 << i)).length;
/** Stars are stored as a bit mask, so goals met in different runs accumulate. */
export const starCount = (record?: LevelRecord) => record ? count(record.stars) : 0;
export const hasStar = (record: LevelRecord | undefined, index: number) => !!record && !!(record.stars & (1 << index));

export function applyRun(previous: LevelRecord | undefined, run: RunResult): RecordUpdate {
  const before = previous ?? emptyRecord();
  const stars = starsFor(run);
  const mask = stars.reduce((m, earned, i) => earned ? m | (1 << i) : m, before.stars);
  const newTime = run.won && (before.bestTime <= 0 || run.time < before.bestTime);
  const progress = run.won ? 1 : Math.max(0, Math.min(1, run.progress));
  const newProgress = progress > before.bestProgress + 0.005;
  const record: LevelRecord = {
    stars: mask,
    bestTime: newTime ? Math.round(run.time) : before.bestTime,
    bestFilaments: Math.max(before.bestFilaments, run.count),
    bestLives: run.won ? Math.max(before.bestLives, run.lives) : before.bestLives,
    bestProgress: Math.max(before.bestProgress, progress),
    completions: before.completions + (run.won ? 1 : 0),
    attempts: before.attempts + 1,
  };
  return { record, stars, newStars: count(mask) - count(before.stars), newTime,
    newProgress, firstClear: run.won && before.completions === 0 };
}

function storage(): Storage | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}
function readJson<T>(key: string, store = storage()): Partial<T> {
  try {
    const value = JSON.parse(store?.getItem(key) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}
function writeJson(key: string, value: unknown, store = storage()) {
  try { store?.setItem(key, JSON.stringify(value)); } catch { /* Private mode or quota. */ }
}

export function loadRecords(store = storage()): Records {
  const raw = readJson<Records>(KEY, store), records: Records = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const record = emptyRecord();
    for (const field of Object.keys(record) as (keyof LevelRecord)[]) {
      const n = Number((value as Partial<LevelRecord>)[field]);
      if (Number.isFinite(n) && n >= 0) record[field] = n;
    }
    records[id] = record;
  }
  return records;
}
export function saveRun(levelId: string, run: RunResult, store = storage()): RecordUpdate {
  const records = loadRecords(store);
  const update = applyRun(records[levelId], run);
  records[levelId] = update.record;
  writeJson(KEY, records, store);
  return update;
}
export const totalStars = (records: Records) =>
  Object.values(records).reduce((sum, record) => sum + starCount(record), 0);

export interface Settings { muted: boolean }
export function loadSettings(store = storage()): Settings {
  return { muted: readJson<Settings>(SETTINGS_KEY, store).muted === true };
}
export function saveSettings(settings: Settings, store = storage()) {
  writeJson(SETTINGS_KEY, settings, store);
}
export function formatTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}
