// PLACEHOLDER owned by W1. W1 replaces the bodies and may add helpers, but keeps these exported names and signatures.
// Other workers import these. Dates are "YYYY-MM-DD".
import type { Exercise, Session, Settings, Signal } from "./types";

/** Numbers every set of an exercise starts with: last time's numbers, or the rep minimum when there is no history. */
export function prefill(
  exercise: Exercise,
  history: Session[],
  settings: Settings,
): { reps: number | null; seconds: number | null; assistKg: number | null } {
  void history;
  return {
    reps: exercise.unit === "reps" ? exercise.repMin : null,
    seconds: exercise.unit === "seconds" ? exercise.repMin : null,
    assistKg: exercise.usesAssist && exercise.skill ? settings.assistKg[exercise.skill] ?? null : null,
  };
}

/** True when the last 2 sessions at the current step (and same assist kg) both hit the target. Ladder skills only. */
export function readyToMoveUp(skill: string, history: Session[], settings: Settings): boolean {
  void skill; void history; void settings;
  return false;
}

/** True when 14 or more days passed at the same step and load with no rep gain. */
export function isStuck(skill: string, history: Session[], settings: Settings, today: string): boolean {
  void skill; void history; void settings; void today;
  return false;
}

/** Period handling: days 1..easyDays after a period start get one set fewer (never below 1) and a note. */
export function periodAdjust(
  sets: number,
  date: string,
  periodStarts: string[],
  easyDays: number,
): { sets: number; easy: boolean; dayNumber: number | null; note: string } {
  void date; void periodStarts; void easyDays;
  return { sets, easy: false, dayNumber: null, note: "" };
}

/** Average gap between period starts and the predicted next start. Null when fewer than 2 starts. */
export function predictNextPeriod(periodStarts: string[]): { nextStart: string | null; avgCycleDays: number | null } {
  void periodStarts;
  return { nextStart: null, avgCycleDays: null };
}

/** The signal for one ladder skill, with a concrete next action in plain language. */
export function nextAction(skill: string, history: Session[], settings: Settings, today: string): Signal {
  void history; void settings; void today;
  return { skill, kind: "none", message: "No signal yet" };
}

/** Same for an accessory exercise: ready when all sets hit the top of the rep range 2 sessions in a row. */
export function exerciseSignal(exercise: Exercise, history: Session[], today: string): Signal {
  void history; void today;
  return { skill: exercise.name, kind: "none", message: "No signal yet" };
}
