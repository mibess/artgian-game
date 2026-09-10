// Node-only adapter for local development and integration tests. Never bundled in Worker/client.
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import type { Database, Statement } from "./types.ts";

export function localDatabase(filename = ":memory:") {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url)).filter(f => f.endsWith(".sql")).sort()) {
    if (sqlite.prepare("SELECT name FROM local_migrations WHERE name = ?").get(file)) continue;
    sqlite.exec("BEGIN");
    try {
      sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8"));
      sqlite.prepare("INSERT INTO local_migrations (name) VALUES (?)").run(file);
      sqlite.exec("COMMIT");
    } catch (e) { sqlite.exec("ROLLBACK"); throw e; }
  }
  class Prepared implements Statement {
    sql: string; values: SQLInputValue[] = [];
    constructor(sql: string) { this.sql = sql; }
    bind(...values: unknown[]) { this.values = values as SQLInputValue[]; return this; }
    async first<T>() { return (sqlite.prepare(this.sql).get(...this.values) ?? null) as T | null; }
    execute() { return { meta: { changes: Number(sqlite.prepare(this.sql).run(...this.values).changes) } }; }
    async run() { return this.execute(); }
  }
  const db: Database = {
    prepare: sql => new Prepared(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map(s => (s as Prepared).execute());
        sqlite.exec("COMMIT"); return results;
      } catch (e) { sqlite.exec("ROLLBACK"); throw e; }
    },
  };
  return { db, sqlite };
}
