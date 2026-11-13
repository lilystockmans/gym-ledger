// Database opening, schema, migrations and first-launch seeding. Owned by W2.
// Only expo-sqlite is used here, and it is loaded when the database is opened, so importing this file never crashes on web.
import { historySessions, initialSettings, PERSONAL, WORKOUTS } from "./seed";

/** The small part of the expo-sqlite database object that this app uses. Lets tests plug in another engine. */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export const DB_NAME = "gymledger.db";

/** Each entry upgrades the database by one version. Index 0 builds version 1. Never edit old entries, add new ones. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE workouts (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
  CREATE TABLE planned_days (date TEXT PRIMARY KEY NOT NULL, workout_id TEXT NOT NULL);
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    workout_id TEXT,
    source TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    easy_day INTEGER NOT NULL DEFAULT 0,
    feel TEXT,
    note TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX sessions_date ON sessions(date);
  CREATE TABLE sets (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    pos INTEGER NOT NULL,
    exercise_id TEXT,
    name TEXT NOT NULL,
    skill TEXT,
    step TEXT,
    set_index INTEGER NOT NULL,
    reps REAL,
    seconds REAL,
    assist_kg REAL,
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT
  );
  CREATE INDEX sets_session ON sets(session_id, pos);
  CREATE TABLE period_starts (date TEXT PRIMARY KEY NOT NULL);
  CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);
  CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Brings the database up to the latest schema. Safe to call many times. */
export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

/**
 * Adds workouts that are new in lib/seed.ts (D and E, 2026-11-13) to a database seeded before they existed.
 * INSERT OR IGNORE: workouts already on the phone, including Lily's own edits, are never overwritten.
 */
export async function addMissingWorkouts(db: Db): Promise<void> {
  for (const w of WORKOUTS) {
    await db.runAsync("INSERT OR IGNORE INTO workouts (id, json) VALUES (?, ?)", w.id, JSON.stringify(w));
  }
}

/** Fills the database from lib/seed.ts exactly once. The flag and the data are written in one transaction. */
export async function seedIfNeeded(db: Db): Promise<void> {
  const flag = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'seeded'");
  if (flag) return;
  await db.withTransactionAsync(async () => {
    const again = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'seeded'");
    if (again) return;
    for (const w of WORKOUTS) {
      await db.runAsync("INSERT OR IGNORE INTO workouts (id, json) VALUES (?, ?)", w.id, JSON.stringify(w));
    }
    for (const s of historySessions()) await insertSession(db, s);
    for (const d of PERSONAL.periodStarts) {
      await db.runAsync("INSERT OR IGNORE INTO period_starts (date) VALUES (?)", d);
    }
    await db.runAsync("INSERT OR IGNORE INTO settings (key, json) VALUES ('main', ?)", JSON.stringify(initialSettings()));
    await db.runAsync("INSERT INTO meta (key, value) VALUES ('seeded', ?)", new Date().toISOString());
  });
}

/** Writes a session and its sets. Used by seeding and by SqliteRepo.saveSession. Call inside a transaction. */
export async function insertSession(db: Db, s: import("./types").Session): Promise<void> {
  await db.runAsync(
    `INSERT INTO sessions (id, date, workout_id, source, started_at, finished_at, easy_day, feel, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET date = excluded.date, workout_id = excluded.workout_id, source = excluded.source,
       started_at = excluded.started_at, finished_at = excluded.finished_at, easy_day = excluded.easy_day,
       feel = excluded.feel, note = excluded.note`,
    s.id, s.date, s.workoutId, s.source, s.startedAt, s.finishedAt, s.easyDay ? 1 : 0, s.feel, s.note,
  );
  await db.runAsync("DELETE FROM sets WHERE session_id = ?", s.id);
  let pos = 0;
  for (const e of s.sets) {
    await db.runAsync(
      `INSERT INTO sets (id, session_id, pos, exercise_id, name, skill, step, set_index, reps, seconds, assist_kg, done, done_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e.id, s.id, pos++, e.exerciseId, e.name, e.skill, e.step, e.setIndex, e.reps, e.seconds, e.assistKg, e.done ? 1 : 0, e.doneAt,
    );
  }
}

let opening: Promise<Db> | null = null;

/** Opens gymledger.db once, migrates it and seeds it on first launch. Android only. */
export function openDb(): Promise<Db> {
  if (!opening) {
    opening = (async () => {
      const SQLite = await import("expo-sqlite");
      const db = (await SQLite.openDatabaseAsync(DB_NAME)) as unknown as Db;
      await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
      await migrate(db);
      await seedIfNeeded(db);
      await addMissingWorkouts(db);
      return db;
    })();
    opening.catch(() => { opening = null; });
  }
  return opening;
}
