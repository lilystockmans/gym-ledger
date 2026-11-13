// CONTRACT FILE. Workers must not change this file. Ask the scrum master.
// All dates are ISO strings "YYYY-MM-DD" in local time. Timestamps are ISO strings.

export type WorkoutId = "A" | "B" | "C" | "D" | "E";
export type Block = "Rehab" | "Skill" | "Strength" | "Core";
export type Unit = "reps" | "seconds";

export type Exercise = {
  id: string; // stable, for example "a-handstand"
  name: string; // display name, for ladder skills this is the label ("Handstand")
  block: Block;
  skill: string | null; // ladder skill name in lib/ladders.ts, or null for accessories
  sets: number;
  repMin: number; // reps or seconds, depending on unit
  repMax: number; // equal to repMin when the plan gives one number
  unit: Unit;
  perSide: boolean; // "10s/leg", "8/leg", "15s/side"
  restSec: number;
  usesAssist: boolean; // assisted machine: less assist is progress, Lily types the kg
  notes: string;
};

export type Workout = {
  id: WorkoutId;
  title: string; // "Full Body A"
  subtitle: string; // "handstand, pull-up, dip"
  exercises: Exercise[]; // in order
  warmup: string[]; // tick list, shown on the run screen
  cooldown: string[];
};

export type PlannedDay = { date: string; workoutId: WorkoutId };

export type SetEntry = {
  id: string;
  exerciseId: string | null; // null for imported history rows without an exercise
  name: string; // exercise name at logging time
  skill: string | null;
  step: string | null; // ladder step name at logging time
  setIndex: number; // 0-based
  reps: number | null;
  seconds: number | null;
  assistKg: number | null;
  done: boolean;
  doneAt: string | null;
};

export type Feel = "Easy" | "OK" | "Hard";

export type Session = {
  id: string;
  date: string;
  workoutId: WorkoutId | null; // null for imported history
  source: "app" | "import";
  startedAt: string | null;
  finishedAt: string | null;
  easyDay: boolean; // period easy day applied when the session was created
  feel: Feel | null;
  note: string;
  sets: SetEntry[];
};

export type PeriodStart = { date: string };

export type Settings = {
  easyDays: number; // days 1..N after a period start get one set fewer. Default 3
  lastExportAt: string | null;
  currentSteps: Record<string, string>; // skill name -> current ladder step name
  assistKg: Record<string, number>; // skill name -> current assist kg (Pull-up, Dip)
  restVibrate: boolean;
  easyOverrides: string[]; // exercise ids that Lily switched back to the full set count, for today only: "YYYY-MM-DD:exerciseId"
};

export type Signal = {
  skill: string;
  kind: "ready" | "stuck" | "none";
  message: string; // plain language, with the concrete next action
};

export const DEFAULT_SETTINGS: Settings = {
  easyDays: 3,
  lastExportAt: null,
  currentSteps: {},
  assistKg: {},
  restVibrate: true,
  easyOverrides: [],
};

export type SeedHistoryRow = {
  date: string;
  skill: string;
  step: string;
  sets: number;
  reps: number | null;
  seconds: number | null;
  assistKg: number | null;
  feel: Feel | null;
};

export type PersonalSeed = { periodStarts: string[]; history: SeedHistoryRow[] };
