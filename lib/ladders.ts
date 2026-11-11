// Skill ladders, copied from the Notion Health page (Skill Progression Ladders).
// Step names must match the "Step" options in the Notion Calisthenics Log exactly.

export type Target = { sets: number; reps?: number; seconds?: number; label: string };
export type Step = { name: string; short: string; target: Target | null };
export type Skill = { name: string; goal: string; usesAssist: boolean; steps: Step[] };

export const SKILLS: Skill[] = [
  {
    name: "Pull-up",
    goal: "First strict pull-up, autumn 2027",
    usesAssist: true,
    steps: [
      { name: "Pull-up 1: assisted machine", short: "Assisted", target: { sets: 3, reps: 6, label: "3×6 clean, then drop 2.5 kg" } },
      { name: "Pull-up 2: negatives", short: "Negatives", target: { sets: 3, reps: 5, label: "3×5 slow negatives" } },
      { name: "Pull-up 3: strict reps", short: "Strict", target: null },
    ],
  },
  {
    name: "Dip",
    goal: "Unassisted dip, 2027–28",
    usesAssist: true,
    steps: [
      { name: "Dip 1: assisted machine", short: "Assisted", target: { sets: 3, reps: 8, label: "3×8 clean, then drop 2.5 kg" } },
      { name: "Dip 2: negatives", short: "Negatives", target: { sets: 3, reps: 5, label: "3×5 slow negatives" } },
      { name: "Dip 3: unassisted", short: "Unassisted", target: null },
    ],
  },
  {
    name: "Push-up",
    goal: "Full push-up on the floor, 2027",
    usesAssist: false,
    steps: [
      { name: "Push-up 1: bar incline", short: "Bar", target: { sets: 3, reps: 12, label: "3×12 clean" } },
      { name: "Push-up 2: bench incline", short: "Bench", target: { sets: 3, reps: 12, label: "3×12 clean" } },
      { name: "Push-up 3: knees", short: "Knees", target: { sets: 3, reps: 12, label: "3×12 clean" } },
      { name: "Push-up 4: floor", short: "Floor", target: null },
    ],
  },
  {
    name: "Handstand",
    goal: "Free handstand, open",
    usesAssist: false,
    steps: [
      { name: "Handstand 1: pike hold on low box", short: "Low box", target: { sets: 3, seconds: 30, label: "3×30s steady" } },
      { name: "Handstand 2: pike hold on high box", short: "High box", target: { sets: 3, seconds: 30, label: "3×30s steady" } },
      { name: "Handstand 3: wall walk", short: "Wall walk", target: { sets: 3, seconds: 30, label: "3×30s at the top" } },
      { name: "Handstand 4: chest-to-wall hold", short: "Chest to wall", target: { sets: 3, seconds: 30, label: "3×30s steady" } },
      { name: "Handstand 5: free balance", short: "Free", target: null },
    ],
  },
  {
    name: "L-sit",
    goal: "Full L-sit, 2027",
    usesAssist: false,
    steps: [
      { name: "L-sit 1: support hold with feet down", short: "Support", target: { sets: 3, seconds: 20, label: "3×20s" } },
      { name: "L-sit 2: one foot up alternating", short: "One foot", target: { sets: 3, seconds: 10, label: "3×10s per leg" } },
      { name: "L-sit 3: tuck", short: "Tuck", target: { sets: 3, seconds: 15, label: "3×15s" } },
      { name: "L-sit 4: one leg straight", short: "One leg", target: { sets: 3, seconds: 10, label: "3×10s per leg" } },
      { name: "L-sit 5: full L-sit", short: "Full", target: { sets: 3, seconds: 20, label: "build to 3×20s" } },
    ],
  },
  {
    name: "Pistol squat",
    goal: "Free pistol squat, 2027–28",
    usesAssist: false,
    steps: [
      { name: "Pistol 1: sit to high box", short: "High box", target: { sets: 3, reps: 5, label: "3×5 per leg, controlled" } },
      { name: "Pistol 2: sit to low box", short: "Low box", target: { sets: 3, reps: 5, label: "3×5 per leg, controlled" } },
      { name: "Pistol 3: holding the rack", short: "Rack", target: { sets: 3, reps: 5, label: "3×5 per leg, controlled" } },
      { name: "Pistol 4: free", short: "Free", target: null },
    ],
  },
];

// Starting points from the Notion goals table (2026-10-24), shown until the first log row exists.
export const START: Record<string, { step: string; assistKg?: number }> = {
  "Pull-up": { step: "Pull-up 1: assisted machine", assistKg: 27 },
  Dip: { step: "Dip 1: assisted machine", assistKg: 18 },
  "Push-up": { step: "Push-up 1: bar incline" },
  Handstand: { step: "Handstand 1: pike hold on low box" },
  "L-sit": { step: "L-sit 2: one foot up alternating" },
  "Pistol squat": { step: "Pistol 1: sit to high box" },
};
