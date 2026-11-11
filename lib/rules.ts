// Pure rules logic (owner: W1). No storage, no clock: callers pass "today".
// Exported names and signatures are a contract with other workers. Dates are "YYYY-MM-DD" and date math is done in UTC.
import { SKILLS } from "./ladders";
import type { Skill, Target } from "./ladders";
import type { Exercise, Session, SetEntry, Settings, Signal } from "./types";

// ---------- dates (UTC, so daylight saving never shifts a day) ----------

function toDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

function fromDay(day: number): string {
  return new Date(day * 86400000).toISOString().slice(0, 10);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return toDay(b) - toDay(a);
}

/** The date `days` after `iso`. */
export function addDays(iso: string, days: number): string {
  return fromDay(toDay(iso) + days);
}

// ---------- reading history ----------

/** The done sets of one session that belong to one skill or exercise. */
type Visit = { date: string; step: string | null; assistKg: number | null; sets: SetEntry[] };

function byDate(history: Session[]): Session[] {
  // stable sort: same-day sessions keep their given order
  return history.map((s, i) => ({ s, i })).sort((a, b) => a.s.date.localeCompare(b.s.date) || a.i - b.i).map((x) => x.s);
}

function visits(history: Session[], match: (set: SetEntry) => boolean): Visit[] {
  const out: Visit[] = [];
  for (const session of byDate(history)) {
    const sets = session.sets.filter((s) => s.done && match(s));
    if (sets.length === 0) continue;
    out.push({ date: session.date, step: sets[0].step, assistKg: sets[0].assistKg, sets });
  }
  return out;
}

function value(set: SetEntry): number {
  return set.reps ?? set.seconds ?? 0;
}

function findSkill(name: string): Skill | undefined {
  return SKILLS.find((s) => s.name === name);
}

/** The step and assist kg the user is working at now: settings first, else the newest log row. */
function currentLoad(skill: Skill, skillVisits: Visit[], settings: Settings): { step: string | null; assistKg: number | null } {
  const last = skillVisits[skillVisits.length - 1];
  const step = settings.currentSteps[skill.name] ?? last?.step ?? null;
  let assistKg: number | null = null;
  if (skill.usesAssist) assistKg = settings.assistKg[skill.name] ?? last?.assistKg ?? null;
  return { step, assistKg };
}

/** Visits at the current step and (for machine skills) the same assist kg. */
function visitsAtCurrent(skill: Skill, history: Session[], settings: Settings) {
  const all = visits(history, (s) => s.skill === skill.name);
  const { step, assistKg } = currentLoad(skill, all, settings);
  const atStep = all.filter((v) => v.step === step && (!skill.usesAssist || v.assistKg === assistKg));
  const stepIndex = Math.max(0, skill.steps.findIndex((s) => s.name === step));
  return { atStep, step, assistKg, stepIndex };
}

function visitMeets(v: Visit, t: Target): boolean {
  const need = t.reps ?? t.seconds;
  if (need === undefined) return false;
  return v.sets.filter((s) => value(s) >= need).length >= t.sets;
}

// ---------- rules ----------

/** Numbers every set of an exercise starts with: last time's numbers, or the rep minimum when there is no history. */
export function prefill(
  exercise: Exercise,
  history: Session[],
  settings: Settings,
): { reps: number | null; seconds: number | null; assistKg: number | null } {
  let match: (s: SetEntry) => boolean;
  if (exercise.skill) {
    const step = settings.currentSteps[exercise.skill];
    match = (s) => s.skill === exercise.skill && (step === undefined || s.step === step);
  } else {
    match = (s) => s.exerciseId === exercise.id || s.name === exercise.name;
  }
  const found = visits(history, match);
  const last = found[found.length - 1];
  const first = last?.sets[0];

  const fallbackAssist = exercise.usesAssist && exercise.skill ? settings.assistKg[exercise.skill] ?? null : null;
  const assistKg = exercise.usesAssist ? first?.assistKg ?? fallbackAssist : null;
  const num = exercise.unit === "reps" ? first?.reps : first?.seconds;
  const n = num ?? exercise.repMin;
  return {
    reps: exercise.unit === "reps" ? n : null,
    seconds: exercise.unit === "seconds" ? n : null,
    assistKg,
  };
}

/** True when the last 2 sessions at the current step (and same assist kg) both hit the target. Ladder skills only. */
export function readyToMoveUp(skill: string, history: Session[], settings: Settings): boolean {
  const sk = findSkill(skill);
  if (!sk) return false;
  const { atStep, stepIndex } = visitsAtCurrent(sk, history, settings);
  const target = sk.steps[stepIndex].target;
  if (!target) return false;
  const lastTwo = atStep.slice(-2);
  return lastTwo.length === 2 && lastTwo.every((v) => visitMeets(v, target));
}

/** Days since the last rep gain at the current step and load, or null when there is nothing to measure. */
function daysWithoutGain(skill: string, history: Session[], settings: Settings, today: string): number | null {
  const sk = findSkill(skill);
  if (!sk) return null;
  const { atStep } = visitsAtCurrent(sk, history, settings);
  if (atStep.length === 0) return null;
  let best = -Infinity;
  let sinceDate = atStep[0].date;
  for (const v of atStep) {
    const top = Math.max(...v.sets.map(value));
    if (top > best) {
      best = top;
      sinceDate = v.date;
    }
  }
  return daysBetween(sinceDate, today);
}

/** True when 14 or more days passed at the same step and load with no rep gain. */
export function isStuck(skill: string, history: Session[], settings: Settings, today: string): boolean {
  const days = daysWithoutGain(skill, history, settings, today);
  return days !== null && days >= 14;
}

/** Period handling: days 1..easyDays after a period start get one set fewer (never below 1) and a note. */
export function periodAdjust(
  sets: number,
  date: string,
  periodStarts: string[],
  easyDays: number,
): { sets: number; easy: boolean; dayNumber: number | null; note: string } {
  const past = periodStarts.filter((d) => d <= date).sort();
  const start = past[past.length - 1];
  if (start) {
    const dayNumber = daysBetween(start, date) + 1;
    if (dayNumber >= 1 && dayNumber <= easyDays) {
      return {
        sets: Math.max(1, sets - 1),
        easy: true,
        dayNumber,
        note: `Easy day ${dayNumber} of ${easyDays}: one set fewer. Take it easy.`,
      };
    }
  }
  return { sets, easy: false, dayNumber: null, note: "" };
}

/** Average gap between period starts and the predicted next start. Null when fewer than 2 starts. */
export function predictNextPeriod(periodStarts: string[]): { nextStart: string | null; avgCycleDays: number | null } {
  const sorted = [...periodStarts].sort();
  if (sorted.length < 2) return { nextStart: null, avgCycleDays: null };
  let total = 0;
  for (let i = 1; i < sorted.length; i++) total += daysBetween(sorted[i - 1], sorted[i]);
  const avg = Math.round(total / (sorted.length - 1));
  return { nextStart: addDays(sorted[sorted.length - 1], avg), avgCycleDays: avg };
}

/** The signal for one ladder skill, with a concrete next action in plain language. */
export function nextAction(skill: string, history: Session[], settings: Settings, today: string): Signal {
  const sk = findSkill(skill);
  if (!sk) return { skill, kind: "none", message: "No signal yet" };

  if (readyToMoveUp(skill, history, settings)) {
    const { stepIndex } = visitsAtCurrent(sk, history, settings);
    if (sk.usesAssist) {
      return {
        skill,
        kind: "ready",
        message: `${skill}: ready to move up. Hit the target twice in a row. Next time drop one notch (2.5 kg less assist) and type the new kg.`,
      };
    }
    const next = sk.steps[stepIndex + 1];
    return {
      skill,
      kind: "ready",
      message: next
        ? `${skill}: ready to move up. Hit the target twice in a row. Next time start ${next.name}.`
        : `${skill}: target hit twice in a row. You are at the last step.`,
    };
  }

  const days = daysWithoutGain(skill, history, settings, today);
  if (days !== null && days >= 14) {
    const weeks = Math.floor(days / 7);
    const { stepIndex } = visitsAtCurrent(sk, history, settings);
    const unit = sk.steps[stepIndex].target?.seconds !== undefined ? "second" : "rep";
    const lead = `${skill}: stuck for ${weeks} weeks at the same step and load.`;
    if (weeks >= 4) {
      return { skill, kind: "stuck", message: `${lead} Take a lighter week: same step, one set fewer, easy effort. Then try again.` };
    }
    if (weeks >= 3) {
      return { skill, kind: "stuck", message: `${lead} Try a smaller jump: add 1 ${unit} to your first set only.` };
    }
    return { skill, kind: "stuck", message: `${lead} Next session aim for +1 ${unit} per set.` };
  }

  return { skill, kind: "none", message: "No signal yet" };
}

/** Same for an accessory exercise: ready when all sets hit the top of the rep range 2 sessions in a row. */
export function exerciseSignal(exercise: Exercise, history: Session[], today: string): Signal {
  void today;
  const found = visits(history, (s) => s.exerciseId === exercise.id || s.name === exercise.name);
  const lastTwo = found.slice(-2);
  const hit = lastTwo.length === 2 && lastTwo.every((v) => v.sets.every((s) => value(s) >= exercise.repMax));
  if (!hit) return { skill: exercise.name, kind: "none", message: "No signal yet" };
  const unit = exercise.unit === "seconds" ? "seconds" : "reps";
  return {
    skill: exercise.name,
    kind: "ready",
    message: `${exercise.name}: all sets at ${exercise.repMax} ${unit} two sessions in a row. Make it harder: add 1 ${exercise.unit === "seconds" ? "second" : "rep"} per set or try a harder version.`,
  };
}
