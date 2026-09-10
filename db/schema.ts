import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text().primaryKey(), subject: text().notNull().unique(),
});
export const sessions = sqliteTable("sessions", {
  token_hash: text().primaryKey(), player_id: text().notNull().references(() => players.id),
  expires_at: integer().notNull(),
});
export const runs = sqliteTable("runs", {
  id: text().primaryKey(), player_id: text().notNull().references(() => players.id),
  level_id: text().notNull(), rules_version: integer().notNull(),
  state: text().notNull(), sequence: integer().notNull().default(0),
  last_digest: text(), completion_id: text().notNull().unique(),
  status: text().notNull().default("playing"), created_at: integer().notNull(),
}, t => [index("idx_runs_player_created").on(t.player_id, t.created_at)]);
export const completions = sqliteTable("completions", {
  id: text().primaryKey(), player_id: text().notNull().references(() => players.id),
  run_id: text().notNull().unique().references(() => runs.id),
  idempotency_key: text().notNull().unique(), request_body: text().notNull(),
  status: text().notNull().default("pending"), reward: text(),
  attempts: integer().notNull().default(0), next_attempt_at: integer().notNull().default(0),
  lease_until: integer().notNull().default(0), lease_token: text(), created_at: integer().notNull(),
}, t => [index("idx_completions_player_created").on(t.player_id, t.created_at)]);
