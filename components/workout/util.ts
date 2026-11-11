import { periodAdjust, prefill } from "../../lib/rules";
import type { Exercise, Session, SetEntry, Settings, Workout } from "../../lib/types";

export function todayIso(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function rangeText(e: Exercise): string {
  const n = e.repMin === e.repMax ? `${e.repMin}` : `${e.repMin} to ${e.repMax}`;
  return `${n}${e.unit === "seconds" ? " s" : ""}${e.perSide ? " per side" : ""}`;
}

/** Set count for one exercise today: one fewer on easy days unless Lily switched it back. */
export function plannedSets(
  e: Exercise,
  date: string,
  periodStarts: string[],
  settings: Settings,
  fullSet: Set<string>,
): { sets: number; easy: boolean } {
  const adj = periodAdjust(e.sets, date, periodStarts, settings.easyDays);
  if (adj.easy && fullSet.has(e.id)) return { sets: e.sets, easy: false };
  return { sets: adj.sets, easy: adj.easy };
}

export function buildSession(
  w: Workout,
  date: string,
  history: Session[],
  settings: Settings,
  periodStarts: string[],
  fullSet: Set<string>,
): Session {
  const id = `s-${Date.now().toString(36)}`;
  const sets: SetEntry[] = [];
  let easyDay = false;
  for (const e of w.exercises) {
    const p = plannedSets(e, date, periodStarts, settings, fullSet);
    if (p.easy) easyDay = true;
    const pre = prefill(e, history, settings);
    const step = e.skill ? settings.currentSteps[e.skill] ?? null : null;
    for (let i = 0; i < p.sets; i++) {
      sets.push({
        id: `${id}-${e.id}-${i}`,
        exerciseId: e.id,
        name: e.name,
        skill: e.skill,
        step,
        setIndex: i,
        reps: pre.reps,
        seconds: pre.seconds,
        assistKg: pre.assistKg,
        done: false,
        doneAt: null,
      });
    }
  }
  return {
    id, date, workoutId: w.id, source: "app", startedAt: new Date().toISOString(), finishedAt: null,
    easyDay, feel: null, note: "", sets,
  };
}
