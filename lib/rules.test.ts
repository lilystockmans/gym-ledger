// Tests for lib/rules.ts. All data here is made up.
import assert from "node:assert/strict";
import { test } from "node:test";
import { exerciseSignal, isStuck, nextAction, periodAdjust, predictNextPeriod, prefill, readyToMoveUp } from "./rules";
import type { Exercise, Session, SetEntry, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

let counter = 0;
type SetOpts = { exerciseId?: string | null; name?: string; skill?: string | null; step?: string | null; reps?: number | null; seconds?: number | null; assistKg?: number | null; n?: number };

function session(date: string, o: SetOpts): Session {
  const sets: SetEntry[] = [];
  for (let i = 0; i < (o.n ?? 3); i++) {
    sets.push({
      id: `s${counter++}`, exerciseId: o.exerciseId ?? null, name: o.name ?? o.skill ?? "x", skill: o.skill ?? null,
      step: o.step ?? null, setIndex: i, reps: o.reps ?? null, seconds: o.seconds ?? null, assistKg: o.assistKg ?? null,
      done: true, doneAt: date,
    });
  }
  return { id: `ses${counter++}`, date, workoutId: null, source: "import", startedAt: null, finishedAt: null, easyDay: false, feel: null, note: "", sets };
}

const PULL1 = "Pull-up 1: assisted machine";
const PULL2 = "Pull-up 2: negatives";
const HS1 = "Handstand 1: pike hold on low box";

function settings(over: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, currentSteps: { "Pull-up": PULL1, Handstand: HS1 }, assistKg: { "Pull-up": 25 }, ...over };
}

const pull = (date: string, reps: number, assistKg = 25, step = PULL1, n = 3) => session(date, { skill: "Pull-up", step, reps, assistKg, n });

// ---- ready to move up ----

test("two hits in a row at the same assist is ready", () => {
  const h = [pull("2026-10-01", 6), pull("2026-10-05", 6)];
  assert.equal(readyToMoveUp("Pull-up", h, settings()), true);
});

test("one hit is not ready", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-05", 6)];
  assert.equal(readyToMoveUp("Pull-up", h, settings()), false);
});

test("a new assist kg resets the hit count", () => {
  const h = [pull("2026-10-01", 6, 27.5), pull("2026-10-05", 6, 27.5), pull("2026-10-09", 6, 25)];
  assert.equal(readyToMoveUp("Pull-up", h, settings({ assistKg: { "Pull-up": 25 } })), false);
});

test("two hits at the new assist kg is ready again", () => {
  const h = [pull("2026-10-01", 6, 27.5), pull("2026-10-05", 6, 27.5), pull("2026-10-09", 6, 25), pull("2026-10-13", 6, 25)];
  assert.equal(readyToMoveUp("Pull-up", h, settings({ assistKg: { "Pull-up": 25 } })), true);
});

test("a new step resets the hit count", () => {
  const h = [pull("2026-10-01", 6), pull("2026-10-05", 6), pull("2026-10-09", 5, 25, PULL2)];
  assert.equal(readyToMoveUp("Pull-up", h, settings({ currentSteps: { "Pull-up": PULL2 } })), false);
});

test("fewer sets than the target is a miss", () => {
  const h = [pull("2026-10-01", 6, 25, PULL1, 2), pull("2026-10-05", 6, 25, PULL1, 2)];
  assert.equal(readyToMoveUp("Pull-up", h, settings()), false);
});

test("seconds skills use the seconds target", () => {
  const hs = (d: string, s: number) => session(d, { skill: "Handstand", step: HS1, seconds: s });
  assert.equal(readyToMoveUp("Handstand", [hs("2026-10-01", 30), hs("2026-10-05", 30)], settings()), true);
  assert.equal(readyToMoveUp("Handstand", [hs("2026-10-01", 30), hs("2026-10-05", 25)], settings()), false);
});

test("a step without a target is never ready", () => {
  const s = settings({ currentSteps: { "Pull-up": "Pull-up 3: strict reps" } });
  const h = [pull("2026-10-01", 10, 0, "Pull-up 3: strict reps"), pull("2026-10-05", 10, 0, "Pull-up 3: strict reps")];
  assert.equal(readyToMoveUp("Pull-up", h, s), false);
});

test("no history is not ready", () => {
  assert.equal(readyToMoveUp("Pull-up", [], settings()), false);
});

// ---- stuck ----

test("15 days at the same load with no rep gain is stuck", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-08", 5)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-10-16"), true);
});

test("13 days at the same load is not stuck", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-08", 5)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-10-14"), false);
});

test("a single session is never stuck", () => {
  const h = [pull("2026-10-01", 5)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-11-15"), false);
  assert.equal(nextAction("Pull-up", h, settings(), "2026-11-15").kind, "none");
});

test("exactly 14 days is stuck", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-05", 5)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-10-15"), true);
});

test("a rep gain breaks stuck", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-08", 6)];
  // 15 days since the first session, but only 8 days since the last rep gain
  assert.equal(isStuck("Pull-up", h, settings(), "2026-10-16"), false);
});

test("a new assist kg restarts the stuck clock", () => {
  const h = [pull("2026-09-01", 5, 27.5), pull("2026-10-10", 5, 25)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-10-16"), false);
});

test("stuck count works across a daylight saving change", () => {
  // Belgium clocks changed on 2026-10-25
  const h = [pull("2026-10-20", 5), pull("2026-10-22", 5)];
  assert.equal(isStuck("Pull-up", h, settings(), "2026-11-03"), true);
  assert.equal(isStuck("Pull-up", h, settings(), "2026-11-02"), false);
});

test("no history is not stuck", () => {
  assert.equal(isStuck("Pull-up", [], settings(), "2026-10-16"), false);
});

// ---- nextAction ----

test("nextAction ready on a machine skill says use less assist", () => {
  const h = [pull("2026-10-01", 6), pull("2026-10-05", 6)];
  const sig = nextAction("Pull-up", h, settings(), "2026-10-06");
  assert.equal(sig.kind, "ready");
  assert.equal(sig.skill, "Pull-up");
  assert.match(sig.message, /less assist/i);
  assert.doesNotMatch(sig.message, /2\.5/); // the app never invents a kg value
});

test("nextAction ready on a plain skill names the next step", () => {
  const hs = (d: string) => session(d, { skill: "Handstand", step: HS1, seconds: 30 });
  const sig = nextAction("Handstand", [hs("2026-10-01"), hs("2026-10-05")], settings(), "2026-10-06");
  assert.equal(sig.kind, "ready");
  assert.match(sig.message, /Handstand 2: pike hold on high box/);
});

test("nextAction stuck first asks for +1 rep per set", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-05", 5)];
  const sig = nextAction("Pull-up", h, settings(), "2026-10-16");
  assert.equal(sig.kind, "stuck");
  assert.match(sig.message, /\+1 rep per set/);
});

test("nextAction stuck at 3 weeks suggests a smaller jump", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-05", 5)];
  const sig = nextAction("Pull-up", h, settings(), "2026-10-23");
  assert.equal(sig.kind, "stuck");
  assert.match(sig.message, /smaller/i);
});

test("nextAction stuck at 4 weeks suggests a lighter week", () => {
  const h = [pull("2026-10-01", 5), pull("2026-10-05", 5)];
  const sig = nextAction("Pull-up", h, settings(), "2026-10-29");
  assert.equal(sig.kind, "stuck");
  assert.match(sig.message, /lighter week/i);
});

test("nextAction with nothing to report is none", () => {
  const h = [pull("2026-10-01", 5)];
  assert.equal(nextAction("Pull-up", h, settings(), "2026-10-03").kind, "none");
  assert.equal(nextAction("Pull-up", [], settings(), "2026-10-03").kind, "none");
});

// ---- accessories ----

const acc: Exercise = {
  id: "a-hang", name: "Dead Hang", block: "Strength", skill: null, sets: 3, repMin: 20, repMax: 30,
  unit: "seconds", perSide: false, restSec: 60, usesAssist: false, notes: "",
};
const hang = (d: string, s: number) => session(d, { exerciseId: "a-hang", name: "Dead Hang", seconds: s });

test("accessory is ready when all sets hit the top of the range twice in a row", () => {
  const sig = exerciseSignal(acc, [hang("2026-10-01", 30), hang("2026-10-05", 30)], "2026-10-06");
  assert.equal(sig.kind, "ready");
  assert.equal(sig.skill, "Dead Hang");
});

test("accessory with one top session is not ready", () => {
  assert.equal(exerciseSignal(acc, [hang("2026-10-01", 25), hang("2026-10-05", 30)], "2026-10-06").kind, "none");
});

test("accessory with one set below the top is not ready", () => {
  const mixed = session("2026-10-05", { exerciseId: "a-hang", name: "Dead Hang", seconds: 30 });
  mixed.sets[2].seconds = 28;
  assert.equal(exerciseSignal(acc, [hang("2026-10-01", 30), mixed], "2026-10-06").kind, "none");
});

test("accessory matches by name when the exercise id is missing", () => {
  const byName = (d: string) => session(d, { exerciseId: null, name: "Dead Hang", seconds: 30 });
  assert.equal(exerciseSignal(acc, [byName("2026-10-01"), byName("2026-10-05")], "2026-10-06").kind, "ready");
});

test("accessory ignores other exercises and has no history", () => {
  assert.equal(exerciseSignal(acc, [], "2026-10-06").kind, "none");
  const other = [session("2026-10-01", { name: "Plank", seconds: 30 }), session("2026-10-05", { name: "Plank", seconds: 30 })];
  assert.equal(exerciseSignal(acc, other, "2026-10-06").kind, "none");
});

// ---- period ----

const starts = ["2026-09-01", "2026-10-01"];

test("easy days 1 to 3 are easy with one set fewer", () => {
  const d1 = periodAdjust(3, "2026-10-01", starts, 3);
  assert.deepEqual([d1.easy, d1.dayNumber, d1.sets], [true, 1, 2]);
  const d2 = periodAdjust(3, "2026-10-02", starts, 3);
  assert.deepEqual([d2.easy, d2.dayNumber, d2.sets], [true, 2, 2]);
  assert.equal(d2.note, "Easy day 2 of 3: one set fewer. Take it easy.");
  const d3 = periodAdjust(3, "2026-10-03", starts, 3);
  assert.deepEqual([d3.easy, d3.dayNumber, d3.sets], [true, 3, 2]);
});

test("day 4 is not easy", () => {
  const d4 = periodAdjust(3, "2026-10-04", starts, 3);
  assert.deepEqual([d4.easy, d4.dayNumber, d4.sets, d4.note], [false, null, 3, ""]);
});

test("sets never go below 1", () => {
  assert.equal(periodAdjust(1, "2026-10-01", starts, 3).sets, 1);
});

test("a date before any start or with no starts is not easy", () => {
  assert.equal(periodAdjust(3, "2026-08-31", starts, 3).easy, false);
  assert.equal(periodAdjust(3, "2026-10-01", [], 3).easy, false);
});

test("easy days count across a month and a daylight saving change", () => {
  const s = ["2026-10-24"];
  assert.equal(periodAdjust(3, "2026-10-26", s, 3).dayNumber, 3);
  assert.equal(periodAdjust(3, "2026-10-27", s, 3).easy, false);
});

test("the most recent start before the date is used", () => {
  assert.equal(periodAdjust(3, "2026-09-02", ["2026-10-01", "2026-09-01"], 3).dayNumber, 2);
});

test("predictNextPeriod from gaps 29, 32, 35 gives last start plus 32 days", () => {
  const r = predictNextPeriod(["2026-03-01", "2026-03-30", "2026-04-30", "2026-06-04"]);
  assert.equal(r.avgCycleDays, 32);
  assert.equal(r.nextStart, "2026-07-06");
});

test("predictNextPeriod sorts unsorted starts and needs 2 starts", () => {
  assert.equal(predictNextPeriod(["2026-04-30", "2026-03-30"]).nextStart, "2026-05-31");
  assert.deepEqual(predictNextPeriod(["2026-04-30"]), { nextStart: null, avgCycleDays: null });
  assert.deepEqual(predictNextPeriod([]), { nextStart: null, avgCycleDays: null });
});

// ---- prefill ----

const pullEx: Exercise = {
  id: "a-pullup", name: "Assisted Pull-Up (machine)", block: "Strength", skill: "Pull-up", sets: 3, repMin: 5, repMax: 6,
  unit: "reps", perSide: false, restSec: 90, usesAssist: true, notes: "",
};

test("prefill uses last time's numbers for a ladder skill at the current step", () => {
  const h = [pull("2026-10-01", 4, 27.5), pull("2026-10-05", 6, 25)];
  assert.deepEqual(prefill(pullEx, h, settings()), { reps: 6, seconds: null, assistKg: 25 });
});

test("prefill ignores history from another step", () => {
  const h = [pull("2026-10-01", 6, 25), pull("2026-10-05", 3, 0, PULL2)];
  assert.deepEqual(prefill(pullEx, h, settings()), { reps: 6, seconds: null, assistKg: 25 });
});

test("prefill with no history uses repMin and the settings assist", () => {
  assert.deepEqual(prefill(pullEx, [], settings({ assistKg: { "Pull-up": 22.5 } })), { reps: 5, seconds: null, assistKg: 22.5 });
});

test("prefill with no history for a seconds exercise uses repMin seconds", () => {
  assert.deepEqual(prefill(acc, [], settings()), { reps: null, seconds: 20, assistKg: null });
});

test("prefill for an accessory matches by exercise id or name", () => {
  assert.deepEqual(prefill(acc, [hang("2026-10-01", 27)], settings()), { reps: null, seconds: 27, assistKg: null });
  const byName = session("2026-10-02", { exerciseId: null, name: "Dead Hang", seconds: 24 });
  assert.deepEqual(prefill(acc, [byName], settings()), { reps: null, seconds: 24, assistKg: null });
});

test("prefill takes the newest session even when history is unsorted", () => {
  const h = [pull("2026-10-05", 6, 25), pull("2026-10-01", 4, 25)];
  assert.equal(prefill(pullEx, h, settings()).reps, 6);
});

test("prefill: the assist in settings wins over the last session", () => {
  const h = [pull("2026-10-05", 6, 25)];
  assert.deepEqual(prefill(pullEx, h, settings({ assistKg: { "Pull-up": 22.5 } })), { reps: 6, seconds: null, assistKg: 22.5 });
});
