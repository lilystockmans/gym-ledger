// CONTRACT FILE. Workers must not change this file. Ask the scrum master.
// Workouts A, B, C are copied from the Notion Health page (read 2026-11-11).
// Personal data (period starts, history) comes from seed/active.json, which scripts/select-seed.js
// fills from seed/personal.json (gitignored) or else seed/personal.example.json (made-up values).
import active from "../seed/active.json";
import { START } from "./ladders";
import type { Block, Exercise, PersonalSeed, Session, SetEntry, Settings, Unit, Workout } from "./types";
import { DEFAULT_SETTINGS } from "./types";

type ExOpts = Partial<Pick<Exercise, "skill" | "unit" | "perSide" | "usesAssist" | "notes">>;
function ex(id: string, name: string, block: Block, sets: number, repMin: number, repMax: number, restSec: number, o: ExOpts = {}): Exercise {
  return {
    id, name, block, sets, repMin, repMax, restSec,
    skill: o.skill ?? null,
    unit: (o.unit ?? "reps") as Unit,
    perSide: o.perSide ?? false,
    usesAssist: o.usesAssist ?? false,
    notes: o.notes ?? "",
  };
}

const WARMUP = [
  "3 min easy bike or treadmill walk",
  "Leg swings front-to-back, 10 per leg",
  "Leg swings side-to-side, 10 per leg",
  "Bodyweight squat x10",
  "Arm circles x10 each way",
  "Dead hang 20 sec",
  "Plank shoulder taps x10",
  "Wrist: palms flat, fingers forward, rock forward and back x10",
  "Wrist: fingers pointing back toward knees, rock gently x10",
  "Wrist: backs of hands on the floor, rock gently x5",
  "Wrist: hands up, circle the wrists x10 each way",
];

const COOLDOWN = [
  "Hamstring stretch, 30 sec",
  "Hip flexor lunge, 30 sec",
  "Butterfly (adductors), 30 sec",
  "Doorway chest stretch, 30 sec",
  "Lat stretch, 30 sec",
  "Calf stretch, 30 sec",
  "Seated pike stretch 3 x 30 sec (flexibility for the L-sit)",
];

const S = "seconds" as const;

export const WORKOUTS: Workout[] = [
  {
    id: "A",
    title: "Full Body A",
    subtitle: "handstand, pull-up, dip",
    warmup: WARMUP,
    cooldown: COOLDOWN,
    exercises: [
      ex("a-handstand", "Handstand", "Skill", 3, 20, 20, 60, { skill: "Handstand", unit: S, notes: "Now: feet on a low bench, hands on floor, hips over shoulders" }),
      ex("a-lsit", "L-sit", "Skill", 3, 10, 10, 45, { skill: "L-sit", unit: S, perSide: true, notes: "Hands on yoga blocks or parallettes. Now: one foot up, alternating" }),
      ex("a-pullup", "Assisted Pull-Up (machine)", "Strength", 3, 5, 6, 90, { skill: "Pull-up", usesAssist: true, notes: "Assist kg from your last log row. Drop 2.5 kg at 3×6 clean" }),
      ex("a-dip", "Assisted Dip (machine)", "Strength", 3, 5, 6, 90, { skill: "Dip", usesAssist: true, notes: "Assist kg from your last log row. Drop 2.5 kg at 3×8 clean" }),
      ex("a-pushup", "Push-up", "Strength", 3, 8, 12, 60, { skill: "Push-up", notes: "Now: bar incline. Lower one notch at 3×12" }),
      ex("a-bss", "Bulgarian Split Squat, bodyweight", "Strength", 3, 8, 8, 60, { perSide: true, notes: "Back foot on a bench" }),
      ex("a-bridge", "Single-Leg Glute Bridge", "Strength", 3, 10, 10, 45, { perSide: true, notes: "Glutes and hamstrings" }),
      ex("a-hang", "Dead Hang", "Strength", 3, 20, 30, 60, { unit: S, notes: "Grip and forearms" }),
      ex("a-calf", "Single-Leg Calf Raise, 3s lower", "Strength", 3, 10, 10, 45, { perSide: true, notes: "On a step, hold something for balance" }),
      ex("a-cope", "Copenhagen Plank", "Core", 2, 15, 15, 45, { unit: S, perSide: true, notes: "Inner thigh. Bottom knee down to start" }),
      ex("a-legs", "Seated Leg Lifts", "Core", 3, 10, 10, 45, { notes: "Legs straight, hands next to knees, lift both heels 2 cm" }),
    ],
  },
  {
    id: "B",
    title: "Full Body B",
    subtitle: "pistol squat, pull-up, row",
    warmup: WARMUP,
    cooldown: COOLDOWN,
    exercises: [
      ex("b-handstand", "Handstand", "Skill", 3, 20, 20, 60, { skill: "Handstand", unit: S, notes: "Second exposure of the week" }),
      ex("b-pistol", "Pistol Squat", "Skill", 3, 5, 5, 60, { skill: "Pistol squat", perSide: true, notes: "High box → low box → hold the rack → free" }),
      ex("b-lsit", "L-sit", "Skill", 3, 10, 10, 45, { skill: "L-sit", unit: S, perSide: true, notes: "Second exposure of the week" }),
      ex("b-pullup", "Assisted Pull-Up (machine)", "Strength", 3, 5, 6, 90, { skill: "Pull-up", usesAssist: true, notes: "Second exposure. Twice a week is what moves the pull-up" }),
      ex("b-row", "Inverted Row (Smith machine bar)", "Strength", 3, 8, 10, 60, { notes: "Higher bar = easier. Lower the bar one notch at 3×10" }),
      ex("b-pike", "Pike Push-Up, hands on bench", "Strength", 3, 5, 8, 60, { notes: "Shoulders. Handstand pushing strength" }),
      ex("b-slcurl", "Sliding Leg Curl", "Strength", 3, 8, 8, 60, { notes: "Lie on your back, heels on a towel, bridge up, slide heels in and out" }),
      ex("b-sidelift", "Side-Lying Leg Raise", "Strength", 2, 12, 12, 45, { perSide: true, notes: "Outer thigh, glute medius" }),
      ex("b-hkr", "Hanging Knee Raise", "Core", 3, 8, 10, 45, { notes: "Hip flexors and abs, helps the L-sit" }),
      ex("b-tib", "Tibialis Raise", "Core", 2, 15, 15, 45, { notes: "Back against the wall, lift toes" }),
    ],
  },
  {
    id: "C",
    title: "Full Body C",
    subtitle: "winter third day, the pull-up accelerator",
    warmup: WARMUP,
    cooldown: COOLDOWN,
    exercises: [
      ex("c-pullup", "Assisted Pull-Up (machine)", "Strength", 4, 5, 6, 90, { skill: "Pull-up", usesAssist: true, notes: "Current assist" }),
      ex("c-neg", "Negative Pull-Up, 5s lower", "Strength", 3, 3, 3, 90, { notes: "Only once assist is under 25 kg" }),
      ex("c-dip", "Assisted Dip (machine)", "Strength", 3, 6, 8, 90, { skill: "Dip", usesAssist: true, notes: "Current assist" }),
      ex("c-pushup", "Push-up", "Strength", 3, 8, 12, 60, { skill: "Push-up" }),
      ex("c-handstand", "Handstand", "Skill", 3, 20, 30, 60, { skill: "Handstand", unit: S }),
      ex("c-lsit", "L-sit", "Skill", 3, 10, 15, 45, { skill: "L-sit", unit: S }),
      ex("c-pistol", "Pistol Squat", "Skill", 3, 5, 5, 60, { skill: "Pistol squat", perSide: true }),
      ex("c-hkr", "Hanging Knee Raise", "Core", 3, 10, 10, 45),
    ],
  },
];

export const PERSONAL: PersonalSeed = active as PersonalSeed;

/** Current step and assist per skill from the latest history row, else the ladder START values. */
export function initialSettings(): Settings {
  const currentSteps: Record<string, string> = {};
  const assistKg: Record<string, number> = {};
  for (const [skill, s] of Object.entries(START)) {
    currentSteps[skill] = s.step;
    if (s.assistKg !== undefined) assistKg[skill] = s.assistKg;
  }
  const rows = [...PERSONAL.history].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of rows) {
    currentSteps[r.skill] = r.step;
    if (r.assistKg !== null && r.assistKg !== undefined) assistKg[r.skill] = r.assistKg;
  }
  return { ...DEFAULT_SETTINGS, currentSteps, assistKg };
}

/** Imported history rows become one session per date. Each row becomes N equal sets (no per-set detail exists). */
export function historySessions(): Session[] {
  const byDate = new Map<string, Session>();
  PERSONAL.history.forEach((r, rowIdx) => {
    let s = byDate.get(r.date);
    if (!s) {
      s = { id: `import-${r.date}`, date: r.date, workoutId: null, source: "import", startedAt: null, finishedAt: null, easyDay: false, feel: null, note: "", sets: [] };
      byDate.set(r.date, s);
    }
    for (let i = 0; i < r.sets; i++) {
      const e: SetEntry = {
        id: `import-${r.date}-${r.skill}-${rowIdx}-${i}`, exerciseId: null, name: r.skill, skill: r.skill, step: r.step,
        setIndex: i, reps: r.reps, seconds: r.seconds, assistKg: r.assistKg, done: true, doneAt: r.date,
      };
      s.sets.push(e);
    }
    if (r.feel) s.feel = r.feel;
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
