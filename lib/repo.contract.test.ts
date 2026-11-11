// Contract test for any Repo. Runs against MemoryRepo here: npx tsx --test lib/*.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildExport } from "./export";
import { SKILLS } from "./ladders";
import { MemoryRepo } from "./repo.memory";
import type { Repo } from "./repo";
import { historySessions, WORKOUTS } from "./seed";
import type { Session } from "./types";

function newSession(id: string, date: string): Session {
  return {
    id, date, workoutId: "A", source: "app", startedAt: `${date}T10:00:00.000Z`, finishedAt: null, easyDay: true,
    feel: "OK", note: "n",
    sets: [0, 1, 2].map((i) => ({
      id: `${id}-s${i}`, exerciseId: "a-handstand", name: "Handstand", skill: "Handstand", step: "Wall", setIndex: i,
      reps: null, seconds: 20 + i, assistKg: i === 0 ? 7.5 : null, done: i < 2, doneAt: i < 2 ? `${date}T10:0${i}:00.000Z` : null,
    })),
  };
}

export function repoContract(name: string, makeRepo: () => Repo | Promise<Repo>) {
  describe(`Repo contract: ${name}`, () => {
    it("init is idempotent and seeds only once", async () => {
      const repo = await makeRepo();
      await repo.init();
      await repo.addPeriodStart("2030-01-01");
      await repo.saveSettings({ easyDays: 5 });
      await repo.init();
      await repo.init();
      assert.equal((await repo.getWorkouts()).length, WORKOUTS.length);
      assert.equal((await repo.getSessions()).length, historySessions().length);
      assert.ok((await repo.getPeriodStarts()).includes("2030-01-01"));
      assert.equal((await repo.getSettings()).easyDays, 5);
    });

    it("seeds history as sessions with sets", async () => {
      const repo = await makeRepo();
      await repo.init();
      const got = await repo.getSessions();
      const want = historySessions();
      assert.deepEqual(got, want);
      assert.ok(got.every((s) => s.source === "import" && s.workoutId === null));
    });

    it("workouts round trip", async () => {
      const repo = await makeRepo();
      await repo.init();
      assert.deepEqual(await repo.getWorkouts(), WORKOUTS);
      assert.deepEqual(await repo.getWorkout("B"), WORKOUTS.find((w) => w.id === "B"));
    });

    it("saveWorkout replaces one workout", async () => {
      const repo = await makeRepo();
      await repo.init();
      const a = (await repo.getWorkout("A"))!;
      a.title = "Changed";
      await repo.saveWorkout(a);
      assert.equal((await repo.getWorkout("A"))!.title, "Changed");
      assert.equal((await repo.getWorkouts()).length, WORKOUTS.length);
    });

    it("saveSession, getSession, update, deleteSession", async () => {
      const repo = await makeRepo();
      await repo.init();
      const before = (await repo.getSessions()).length;
      const s = newSession("t1", "2099-01-05");
      await repo.saveSession(s);
      assert.deepEqual(await repo.getSession("t1"), s);
      assert.equal((await repo.getSessions()).length, before + 1);
      const changed = { ...s, feel: "Hard" as const, sets: s.sets.slice(0, 2).map((x) => ({ ...x, done: true })) };
      await repo.saveSession(changed);
      assert.deepEqual(await repo.getSession("t1"), changed);
      assert.equal((await repo.getSessions()).length, before + 1);
      await repo.deleteSession("t1");
      assert.equal(await repo.getSession("t1"), null);
      assert.equal((await repo.getSessions()).length, before);
    });

    it("getSessions returns oldest first", async () => {
      const repo = await makeRepo();
      await repo.init();
      await repo.saveSession(newSession("t-old", "2098-01-01"));
      await repo.saveSession(newSession("t-new", "2098-02-01"));
      const dates = (await repo.getSessions()).map((s) => s.date);
      assert.deepEqual(dates, [...dates].sort());
    });

    it("planned days: inclusive range, replace, remove", async () => {
      const repo = await makeRepo();
      await repo.init();
      await repo.setPlannedDay("2099-03-02", "B");
      await repo.setPlannedDay("2099-03-01", "A");
      await repo.setPlannedDay("2099-03-04", "C");
      await repo.setPlannedDay("2099-03-10", "A");
      assert.deepEqual(await repo.getPlannedDays("2099-03-01", "2099-03-04"), [
        { date: "2099-03-01", workoutId: "A" },
        { date: "2099-03-02", workoutId: "B" },
        { date: "2099-03-04", workoutId: "C" },
      ]);
      await repo.setPlannedDay("2099-03-02", "C");
      assert.equal((await repo.getPlannedDays("2099-03-02", "2099-03-02"))[0].workoutId, "C");
      await repo.setPlannedDay("2099-03-02", null);
      assert.deepEqual(await repo.getPlannedDays("2099-03-02", "2099-03-03"), []);
    });

    it("period starts: add, no duplicates, sorted, remove", async () => {
      const repo = await makeRepo();
      await repo.init();
      const base = await repo.getPeriodStarts();
      await repo.addPeriodStart("2097-05-01");
      await repo.addPeriodStart("2097-01-01");
      await repo.addPeriodStart("2097-05-01");
      const after = await repo.getPeriodStarts();
      assert.equal(after.length, base.length + 2);
      assert.deepEqual(after, [...after].sort());
      await repo.removePeriodStart("2097-05-01");
      assert.ok(!(await repo.getPeriodStarts()).includes("2097-05-01"));
      assert.ok((await repo.getPeriodStarts()).includes("2097-01-01"));
    });

    it("settings: patch merges and persists", async () => {
      const repo = await makeRepo();
      await repo.init();
      const before = await repo.getSettings();
      const out = await repo.saveSettings({ easyDays: 4, lastExportAt: "2099-01-01T00:00:00.000Z" });
      assert.equal(out.easyDays, 4);
      assert.equal(out.restVibrate, before.restVibrate);
      assert.deepEqual(out.currentSteps, before.currentSteps);
      assert.deepEqual(await repo.getSettings(), out);
      const out2 = await repo.saveSettings({ assistKg: { "Pull-up": 20 }, easyOverrides: ["2099-01-01:a-x"] });
      assert.equal(out2.easyDays, 4);
      assert.deepEqual(out2.assistKg, { "Pull-up": 20 });
      assert.deepEqual((await repo.getSettings()).easyOverrides, ["2099-01-01:a-x"]);
    });

    it("buildExport has the agreed shape", async () => {
      const repo = await makeRepo();
      await repo.init();
      await repo.setPlannedDay("2099-04-01", "A");
      const now = new Date("2026-11-11T09:30:00.000Z");
      const out = (await buildExport(repo, now)) as Record<string, any>;
      assert.equal(out.exportedAt, "2026-11-11T09:30:00.000Z");
      assert.equal(out.app, "gym-ledger");
      assert.equal(out.version, 1);
      assert.equal(out.workouts.length, WORKOUTS.length);
      assert.ok(out.plannedDays.some((p: any) => p.date === "2099-04-01"));
      assert.equal(out.sessions.length, (await repo.getSessions()).length);
      assert.ok(out.sessions.every((s: Session) => Array.isArray(s.sets)));
      assert.deepEqual(out.periodStarts, await repo.getPeriodStarts());
      assert.deepEqual(out.settings, await repo.getSettings());
      assert.equal(out.skills.length, SKILLS.length);
      for (const sk of out.skills) {
        assert.ok(typeof sk.skill === "string");
        assert.ok("currentStep" in sk && "assistKg" in sk);
        assert.ok(["ready", "stuck", "none"].includes(sk.signal.kind));
        assert.ok(typeof sk.signal.message === "string");
      }
      JSON.parse(JSON.stringify(out));
    });
  });
}

repoContract("MemoryRepo", () => new MemoryRepo());
