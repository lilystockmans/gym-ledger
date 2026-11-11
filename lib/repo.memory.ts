// CONTRACT FILE. Workers must not change this file. Ask the scrum master.
// In-memory Repo for the web preview and Node tests. Loads workouts and seed history on init.
import { historySessions, initialSettings, PERSONAL, WORKOUTS } from "./seed";
import type { Repo } from "./repo";
import type { PlannedDay, Session, Settings, Workout, WorkoutId } from "./types";

export class MemoryRepo implements Repo {
  private ready = false;
  private workouts: Workout[] = [];
  private planned = new Map<string, WorkoutId>();
  private sessions: Session[] = [];
  private periods: string[] = [];
  private settings!: Settings;

  async init() {
    if (this.ready) return;
    this.workouts = structuredClone(WORKOUTS);
    this.sessions = historySessions();
    this.periods = [...PERSONAL.periodStarts].sort();
    this.settings = initialSettings();
    this.ready = true;
  }
  async getWorkouts() { return structuredClone(this.workouts); }
  async getWorkout(id: WorkoutId) { return structuredClone(this.workouts.find((w) => w.id === id) ?? null); }
  async saveWorkout(w: Workout) {
    const i = this.workouts.findIndex((x) => x.id === w.id);
    if (i >= 0) this.workouts[i] = structuredClone(w); else this.workouts.push(structuredClone(w));
  }
  async getPlannedDays(from: string, to: string): Promise<PlannedDay[]> {
    return [...this.planned.entries()].filter(([d]) => d >= from && d <= to).map(([date, workoutId]) => ({ date, workoutId })).sort((a, b) => a.date.localeCompare(b.date));
  }
  async setPlannedDay(date: string, workoutId: WorkoutId | null) {
    if (workoutId) this.planned.set(date, workoutId); else this.planned.delete(date);
  }
  async getSessions() { return structuredClone([...this.sessions].sort((a, b) => a.date.localeCompare(b.date))); }
  async getSession(id: string) { return structuredClone(this.sessions.find((s) => s.id === id) ?? null); }
  async saveSession(s: Session) {
    const i = this.sessions.findIndex((x) => x.id === s.id);
    if (i >= 0) this.sessions[i] = structuredClone(s); else this.sessions.push(structuredClone(s));
  }
  async deleteSession(id: string) { this.sessions = this.sessions.filter((s) => s.id !== id); }
  async getPeriodStarts() { return [...this.periods]; }
  async addPeriodStart(date: string) { if (!this.periods.includes(date)) this.periods = [...this.periods, date].sort(); }
  async removePeriodStart(date: string) { this.periods = this.periods.filter((d) => d !== date); }
  async getSettings() { return structuredClone(this.settings); }
  async saveSettings(patch: Partial<Settings>) { this.settings = { ...this.settings, ...patch }; return structuredClone(this.settings); }
}
