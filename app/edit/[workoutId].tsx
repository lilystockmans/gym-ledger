import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn, Field, Rule, Stepper, TextBtn } from "../../components/plan/ui";
import { getRepo } from "../../lib/repo";
import { SKILLS, START } from "../../lib/ladders";
import type { Block, Exercise, Settings, Workout, WorkoutId } from "../../lib/types";
import { DEFAULT_SETTINGS } from "../../lib/types";
import { colors, space, type } from "../../theme";

const BLOCKS: Block[] = ["Skill", "Strength", "Core"];

function moveItem<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = arr.slice();
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={{ minHeight: space.tap, paddingHorizontal: 16, marginRight: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.ink, backgroundColor: on ? colors.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Text style={[type.exercise, { fontSize: 15 }, on && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

function Lines({ title, lines, onChange }: { title: string; lines: string[]; onChange: (l: string[]) => void }) {
  return (
    <View style={{ marginTop: 32 }}>
      <Text style={type.label}>{title}</Text>
      {lines.map((l, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
          <Field label="" value={l} onChangeText={(t) => onChange(lines.map((x, k) => (k === i ? t : x)))} />
          <TextBtn label="Remove" onPress={() => onChange(lines.filter((_, k) => k !== i))} danger />
        </View>
      ))}
      <TextBtn label={`Add a line to ${title.toLowerCase()}`} onPress={() => onChange([...lines, ""])} />
    </View>
  );
}

export default function Editor() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const [w, setW] = useState<Workout | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const r = getRepo();
    r.init().then(async () => {
      setW(await r.getWorkout(workoutId as WorkoutId));
      setSettings(await r.getSettings());
    });
  }, [workoutId]);

  if (!w) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const touch = () => setSaved(false);
  const setEx = (i: number, patch: Partial<Exercise>) => { touch(); setW({ ...w, exercises: w.exercises.map((e, k) => (k === i ? { ...e, ...patch } : e)) }); };

  const stepOf = (skill: string) => settings.currentSteps[skill] ?? START[skill]?.step ?? SKILLS.find((k) => k.name === skill)?.steps[0].name ?? "";

  function moveUp(skill: string) {
    touch();
    const sk = SKILLS.find((k) => k.name === skill);
    if (!sk) return;
    if (sk.usesAssist) {
      const cur = settings.assistKg[skill] ?? START[skill]?.assistKg ?? 0;
      setSettings({ ...settings, assistKg: { ...settings.assistKg, [skill]: Math.max(0, cur - 2.5) } });
      return;
    }
    const idx = sk.steps.findIndex((s) => s.name === stepOf(skill));
    const nxt = sk.steps[Math.min(sk.steps.length - 1, idx + 1)];
    setSettings({ ...settings, currentSteps: { ...settings.currentSteps, [skill]: nxt.name } });
  }

  function addExercise() {
    touch();
    const id = `${w!.id.toLowerCase()}-new-${Date.now()}`;
    const e: Exercise = { id, name: "New exercise", block: "Strength", skill: null, sets: 3, repMin: 8, repMax: 8, unit: "reps", perSide: false, restSec: 60, usesAssist: false, notes: "" };
    setW({ ...w!, exercises: [...w!.exercises, e] });
    setOpen(id);
  }

  async function save() {
    const r = getRepo();
    await r.saveWorkout(w!);
    await r.saveSettings({ currentSteps: settings.currentSteps, assistKg: settings.assistKg });
    setSaved(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.margin, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <TextBtn label="Back" onPress={() => router.back()} />
        <Text style={[type.display, { marginTop: 8 }]}>{w.title}</Text>
        <Field label="Title" value={w.title} onChangeText={(t) => { touch(); setW({ ...w, title: t }); }} />
        <View style={{ height: 12 }} />
        <Field label="Subtitle" value={w.subtitle} onChangeText={(t) => { touch(); setW({ ...w, subtitle: t }); }} />

        <View style={{ height: 32 }} />
        <Text style={type.label}>Exercises</Text>
        <Rule />
        {w.exercises.map((e, i) => {
          const isOpen = open === e.id;
          const sk = e.skill ? SKILLS.find((k) => k.name === e.skill) : undefined;
          const range = e.repMin === e.repMax ? `${e.repMin}` : `${e.repMin} to ${e.repMax}`;
          return (
            <View key={e.id}>
              <Pressable accessibilityRole="button" onPress={() => setOpen(isOpen ? null : e.id)} style={{ minHeight: 64, justifyContent: "center", paddingVertical: 8 }}>
                <Text style={type.exercise}>{e.name}</Text>
                <Text style={type.muted}>{e.sets} sets · {range} {e.unit === "seconds" ? "seconds" : "reps"}{e.perSide ? " per side" : ""} · rest {e.restSec}s</Text>
              </Pressable>

              {sk ? (
                <View style={{ paddingBottom: 8 }}>
                  {sk.usesAssist ? (
                    <Text style={type.labelAccent}>Assist now {settings.assistKg[sk.name] ?? START[sk.name]?.assistKg ?? 0} kg</Text>
                  ) : (
                    <Text style={type.labelAccent}>Step now: {sk.steps.find((s) => s.name === stepOf(sk.name))?.short ?? stepOf(sk.name)}</Text>
                  )}
                  <TextBtn label={sk.usesAssist ? "Drop one notch" : "Move up"} onPress={() => moveUp(sk.name)} />
                </View>
              ) : null}

              <View style={{ flexDirection: "row" }}>
                <TextBtn label="Move up" onPress={() => { touch(); setW({ ...w, exercises: moveItem(w.exercises, i, -1) }); }} />
                <View style={{ width: 24 }} />
                <TextBtn label="Move down" onPress={() => { touch(); setW({ ...w, exercises: moveItem(w.exercises, i, 1) }); }} />
                <View style={{ width: 24 }} />
                <TextBtn label="Remove" danger onPress={() => { touch(); setW({ ...w, exercises: w.exercises.filter((_, k) => k !== i) }); }} />
              </View>

              {isOpen ? (
                <View style={{ paddingBottom: 16 }}>
                  <Field label="Name" value={e.name} onChangeText={(t) => setEx(i, { name: t })} />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
                    <Stepper label="Sets" value={e.sets} min={1} max={10} onChange={(n) => setEx(i, { sets: n })} />
                    <Stepper label="Rest" value={e.restSec} min={0} max={300} step={15} suffix="s" onChange={(n) => setEx(i, { restSec: n })} />
                    <Stepper label="Fewest" value={e.repMin} min={1} max={120} onChange={(n) => setEx(i, { repMin: n, repMax: Math.max(n, e.repMax) })} />
                    <Stepper label="Most" value={e.repMax} min={1} max={120} onChange={(n) => setEx(i, { repMax: n, repMin: Math.min(n, e.repMin) })} />
                  </View>
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    <Toggle label="Reps" on={e.unit === "reps"} onPress={() => setEx(i, { unit: "reps" })} />
                    <Toggle label="Seconds" on={e.unit === "seconds"} onPress={() => setEx(i, { unit: "seconds" })} />
                    <Toggle label="Per side" on={e.perSide} onPress={() => setEx(i, { perSide: !e.perSide })} />
                  </View>
                  <View style={{ flexDirection: "row", marginTop: 12 }}>
                    {BLOCKS.map((b) => <Toggle key={b} label={b} on={e.block === b} onPress={() => setEx(i, { block: b })} />)}
                  </View>
                  <View style={{ height: 12 }} />
                  <Field label="Notes" value={e.notes} multiline onChangeText={(t) => setEx(i, { notes: t })} />
                </View>
              ) : null}
              <Rule />
            </View>
          );
        })}
        <TextBtn label="Add an exercise" onPress={addExercise} />

        <Lines title="Warm-up" lines={w.warmup} onChange={(l) => { touch(); setW({ ...w, warmup: l }); }} />
        <Lines title="Cool-down" lines={w.cooldown} onChange={(l) => { touch(); setW({ ...w, cooldown: l }); }} />
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.margin, backgroundColor: colors.bg }}>
        {saved ? <Text style={[type.labelAccent, { marginBottom: 8 }]}>Saved</Text> : null}
        <Btn label="Save" onPress={save} />
      </View>
    </SafeAreaView>
  );
}
