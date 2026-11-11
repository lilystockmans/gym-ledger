// Real storage for Android, on expo-sqlite. Owned by W2. Same behaviour as lib/repo.memory.ts.
import { insertSession, openDb, type Db } from "./db";
import type { Repo } from "./repo";
import { DEFAULT_SETTINGS } from "./types";
import type { Feel, PlannedDay, SetEntry, Session, Settings, Workout, WorkoutId } from "./types";

type SessionRow = {
  id: string; date: string; workout_id: string | null; source: string; started_at: string | null;
  finished_at: string | null; easy_day: number; feel: string | null; note: string;
};
type SetRow = {
  id: string; session_id: string; exercise_id: string | null; name: string; skill: string | null; step: string | null;
  set_index: number; reps: number | null; seconds: number | null; assist_kg: number | null; done: number; done_at: string | null;
};

function toSet(r: SetRow): SetEntry {
  return {
    id: r.id, exerciseId: r.exercise_id, name: r.name, skill: r.skill, step: r.step, setIndex: r.set_index,
    reps: r.reps, seconds: r.seconds, assistKg: r.assist_kg, done: r.done === 1, doneAt: r.done_at,
  };
}

function toSession(r: SessionRow, sets: SetEntry[]): Session {
  return {
    id: r.id, date: r.date, workoutId: r.workout_id as WorkoutId | null, source: r.source as "app" | "import",
    startedAt: r.started_at, finishedAt: r.finished_at, easyDay: r.easy_day === 1, feel: r.feel as Feel | null,
    note: r.note, sets,
  };
}

export class SqliteRepo implements Repo {
  private db: Db | null = null;
  private starting: Promise<void> | null = null;

  /** Pass a different database opener only in tests. The app uses the default. */
  constructor(private readonly open: () => Promise<Db> = openDb) {}

  async init(): Promise<void> {
    if (this.db) return;
    if (!this.starting) {
      this.starting = this.open().then((d) => { this.db = d; }).catch((e) => { this.starting = null; throw e; });
    }
    await this.starting;
  }

  private async h(): Promise<Db> {
    await this.init();
    return this.db as Db;
  }

  async getWorkouts(): Promise<Workout[]> {
    const db = await this.h();
    const rows = await db.getAllAsync<{ json: string }>("SELECT json FROM workouts ORDER BY id");
    return rows.map((r) => JSON.parse(r.json) as Workout);
  }

  async getWorkout(id: WorkoutId): Promise<Workout | null> {
    const db = await this.h();
    const r = await db.getFirstAsync<{ json: string }>("SELECT json FROM workouts WHERE id = ?", id);
    return r ? (JSON.parse(r.json) as Workout) : null;
  }

  async saveWorkout(w: Workout): Promise<void> {
    const db = await this.h();
    await db.runAsync(
      "INSERT INTO workouts (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
      w.id, JSON.stringify(w),
    );
  }

  async getPlannedDays(from: string, to: string): Promise<PlannedDay[]> {
    const db = await this.h();
    const rows = await db.getAllAsync<{ date: string; workout_id: string }>(
      "SELECT date, workout_id FROM planned_days WHERE date >= ? AND date <= ? ORDER BY date", from, to,
    );
    return rows.map((r) => ({ date: r.date, workoutId: r.workout_id as WorkoutId }));
  }

  async setPlannedDay(date: string, workoutId: WorkoutId | null): Promise<void> {
    const db = await this.h();
    if (workoutId === null) {
      await db.runAsync("DELETE FROM planned_days WHERE date = ?", date);
      return;
    }
    await db.runAsync(
      "INSERT INTO planned_days (date, workout_id) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET workout_id = excluded.workout_id",
      date, workoutId,
    );
  }

  private async load(id?: string): Promise<Session[]> {
    const db = await this.h();
    const rows = id === undefined
      ? await db.getAllAsync<SessionRow>("SELECT * FROM sessions ORDER BY date, rowid")
      : await db.getAllAsync<SessionRow>("SELECT * FROM sessions WHERE id = ?", id);
    if (rows.length === 0) return [];
    const setRows = id === undefined
      ? await db.getAllAsync<SetRow>("SELECT * FROM sets ORDER BY session_id, pos")
      : await db.getAllAsync<SetRow>("SELECT * FROM sets WHERE session_id = ? ORDER BY pos", id);
    const bySession = new Map<string, SetEntry[]>();
    for (const r of setRows) {
      const list = bySession.get(r.session_id) ?? [];
      list.push(toSet(r));
      bySession.set(r.session_id, list);
    }
    return rows.map((r) => toSession(r, bySession.get(r.id) ?? []));
  }

  async getSessions(): Promise<Session[]> {
    return this.load();
  }

  async getSession(id: string): Promise<Session | null> {
    return (await this.load(id))[0] ?? null;
  }

  async saveSession(s: Session): Promise<void> {
    const db = await this.h();
    await db.withTransactionAsync(async () => {
      await insertSession(db, s);
    });
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.h();
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM sets WHERE session_id = ?", id);
      await db.runAsync("DELETE FROM sessions WHERE id = ?", id);
    });
  }

  async getPeriodStarts(): Promise<string[]> {
    const db = await this.h();
    const rows = await db.getAllAsync<{ date: string }>("SELECT date FROM period_starts ORDER BY date");
    return rows.map((r) => r.date);
  }

  async addPeriodStart(date: string): Promise<void> {
    const db = await this.h();
    await db.runAsync("INSERT OR IGNORE INTO period_starts (date) VALUES (?)", date);
  }

  async removePeriodStart(date: string): Promise<void> {
    const db = await this.h();
    await db.runAsync("DELETE FROM period_starts WHERE date = ?", date);
  }

  async getSettings(): Promise<Settings> {
    const db = await this.h();
    const r = await db.getFirstAsync<{ json: string }>("SELECT json FROM settings WHERE key = 'main'");
    const stored = r ? (JSON.parse(r.json) as Partial<Settings>) : {};
    return { ...structuredClone(DEFAULT_SETTINGS), ...stored };
  }

  async saveSettings(patch: Partial<Settings>): Promise<Settings> {
    const db = await this.h();
    let merged!: Settings;
    await db.withTransactionAsync(async () => {
      merged = { ...(await this.getSettings()), ...patch };
      await db.runAsync(
        "INSERT INTO settings (key, json) VALUES ('main', ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json",
        JSON.stringify(merged),
      );
    });
    return merged;
  }
}
