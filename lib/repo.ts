// CONTRACT FILE. Workers must not change this file. Ask the scrum master.
// Screens import only `getRepo` from here. Android uses lib/repo.sqlite.ts (via repo.impl.native.ts), web and Node tests use lib/repo.memory.ts (via repo.impl.ts).
import { createRepo } from "./repo.impl";
import type { PlannedDay, Session, Settings, Workout, WorkoutId } from "./types";

export interface Repo {
  /** Opens storage and seeds it on first launch. Safe to call many times. */
  init(): Promise<void>;

  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: WorkoutId): Promise<Workout | null>;
  saveWorkout(w: Workout): Promise<void>;

  /** Planned days with date between from and to, both inclusive. */
  getPlannedDays(from: string, to: string): Promise<PlannedDay[]>;
  /** workoutId null removes the plan for that date. */
  setPlannedDay(date: string, workoutId: WorkoutId | null): Promise<void>;

  /** All sessions, oldest first. Includes imported history. */
  getSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  /** Creates a session with all sets prefilled by the caller's rules. The caller passes the full Session. */
  saveSession(s: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;

  /** Period start dates, oldest first. */
  getPeriodStarts(): Promise<string[]>;
  addPeriodStart(date: string): Promise<void>;
  removePeriodStart(date: string): Promise<void>;

  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;
}

let instance: Repo | null = null;

export function getRepo(): Repo {
  if (!instance) instance = createRepo();
  return instance;
}
