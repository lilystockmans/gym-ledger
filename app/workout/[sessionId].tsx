import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RunBackground as Background } from "../../components/workout/RunBackground";
import { PrimaryButton, TextButton, TickList } from "../../components/workout/ui";
import { rangeText } from "../../components/workout/util";
import { getRepo } from "../../lib/repo";
import { exerciseSignal, nextAction } from "../../lib/rules";
import type { Session, Settings, Signal, Workout } from "../../lib/types";
import { todayIso } from "../../components/workout/util";
import { colors, fonts, space, type } from "../../theme";

type Phase = "warmup" | "exercises" | "cooldown";

export default function Run() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("warmup");
  const [idx, setIdx] = useState(0);
  const [warm, setWarm] = useState<Set<number>>(new Set());
  const [cool, setCool] = useState<Set<number>>(new Set());
  const [kb, setKb] = useState(0);
  const [assistText, setAssistText] = useState("");
  const [history, setHistory] = useState<Session[]>([]);

  // Lift the bottom panel above the keyboard so the typed number stays visible.
  useEffect(() => {
    const a = Keyboard.addListener("keyboardDidShow", (e) => setKb(e.endCoordinates.height));
    const b = Keyboard.addListener("keyboardDidHide", () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    (async () => {
      const r = getRepo();
      await r.init();
      const s = await r.getSession(sessionId);
      if (!s || !s.workoutId) return;
      const [w, st] = await Promise.all([r.getWorkout(s.workoutId), r.getSettings()]);
      setSession(s); setWorkout(w); setSettings(st);
      setHistory((await r.getSessions()).filter((x) => x.id !== s.id));
      if (s.sets.some((x) => x.done)) {
        // Resume: skip warm-up, go to the first exercise with an open set.
        setPhase("exercises");
        const open = w?.exercises.findIndex((e) => s.sets.some((x) => x.exerciseId === e.id && !x.done)) ?? -1;
        if (open >= 0) setIdx(open); else setPhase("cooldown");
      }
    })();
  }, [sessionId]);

  const ex = workout && phase === "exercises" ? workout.exercises[idx] : null;
  const exSets = useMemo(() => (session && ex ? session.sets.filter((x) => x.exerciseId === ex.id) : []), [session, ex]);
  const active = exSets.find((x) => !x.done) ?? null;

  useEffect(() => {
    setAssistText(active?.assistKg != null ? String(active.assistKg) : "");
  }, [active?.id]);

  const signal: Signal | null =
    ex && settings
      ? ex.skill ? nextAction(ex.skill, history, settings, todayIso()) : exerciseSignal(ex, history, todayIso())
      : null;

  if (!session || !workout || !settings) {
    return <View style={{ flex: 1 }}><Background /></View>;
  }

  const persist = async (s: Session) => { setSession(s); await getRepo().saveSession(s); };
  const patchActive = (p: Partial<typeof exSets[number]>) => {
    if (!active) return;
    setSession({ ...session, sets: session.sets.map((x) => (x.id === active.id ? { ...x, ...p } : x)) });
  };
  const nextExercise = (from: number) => {
    // Next exercise that still has open sets; otherwise cool-down.
    for (let i = from + 1; i < workout.exercises.length; i++) {
      if (session.sets.some((x) => x.exerciseId === workout.exercises[i].id && !x.done)) { setIdx(i); return; }
    }
    setPhase("cooldown");
  };

  const step = ex?.unit === "seconds" ? 5 : 1;
  const value = active ? (ex?.unit === "seconds" ? active.seconds : active.reps) ?? 0 : 0;
  const bump = (d: number) => {
    const v = Math.max(0, value + d);
    patchActive(ex?.unit === "seconds" ? { seconds: v } : { reps: v });
  };

  const tick = async () => {
    if (!active || !ex) return;
    const kg = assistText.trim() === "" ? null : Number(assistText.replace(",", "."));
    const kgOk = ex.usesAssist && kg != null && !isNaN(kg);
    const done = { ...active, done: true, doneAt: new Date().toISOString(), assistKg: kgOk ? kg : active.assistKg };
    // What you typed on this set carries over to the open sets of the same exercise.
    const sets = session.sets.map((x) => {
      if (x.id === active.id) return done;
      if (x.exerciseId === ex.id && !x.done) return { ...x, reps: done.reps, seconds: done.seconds, assistKg: done.assistKg };
      return x;
    });
    const next = { ...session, sets };
    await persist(next);
    // The assist kg you typed is the current assist for this skill (the next workout starts from it).
    if (kgOk && ex.skill) {
      const saved = await getRepo().saveSettings({ assistKg: { ...settings.assistKg, [ex.skill]: kg as number } });
      setSettings(saved);
    }
    const left = sets.filter((x) => x.exerciseId === ex.id && !x.done).length;
    const target = workout.exercises.findIndex((e, i) => i > idx && sets.some((x) => x.exerciseId === e.id && !x.done));
    if (left === 0) {
      if (target >= 0) setIdx(target); else setPhase("cooldown");
    }
  };

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void) => (i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i); else n.add(i);
    setter(n);
  };

  const doneCount = session.sets.filter((x) => x.done).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Background />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: space.margin, paddingTop: 4 }}>
          <TextButton label="Home" onPress={() => router.replace("/")} />
        </View>
        {phase === "warmup" || phase === "cooldown" ? (
          <>
            <ScrollView contentContainerStyle={s.pad}>
              <Text style={[type.label, { marginTop: 24 }]}>{phase === "warmup" ? "Before you start" : "After the last set"}</Text>
              <Text style={[type.display, { marginTop: 12, marginBottom: 32 }]}>{phase === "warmup" ? "Warm up" : "Cool down"}</Text>
              {phase === "warmup" ? (
                <TickList items={workout.warmup} ticked={warm} onToggle={toggle(warm, setWarm)} />
              ) : (
                <TickList items={workout.cooldown} ticked={cool} onToggle={toggle(cool, setCool)} />
              )}
              <View style={{ height: 120 }} />
            </ScrollView>
            <View style={s.bar}>
              <PrimaryButton
                label={phase === "warmup" ? "Start exercises" : "Finish"}
                onPress={() => {
                  if (phase === "warmup") {
                    const open = workout.exercises.findIndex((e) => session.sets.some((x) => x.exerciseId === e.id && !x.done));
                    setIdx(Math.max(0, open)); setPhase("exercises");
                  } else router.replace(`/finish/${session.id}`);
                }}
              />
            </View>
          </>
        ) : ex ? (
          <>
            <ScrollView contentContainerStyle={s.pad}>
              <Text style={[type.label, { marginTop: 24 }]}>{ex.block} · {idx + 1} of {workout.exercises.length}</Text>
              <Text style={[type.exercise, { fontSize: 30, lineHeight: 34, marginTop: 12 }]}>{ex.name}</Text>
              <Text style={[type.muted, { marginTop: 8 }]}>Target {rangeText(ex)}.</Text>
              {ex.notes ? <Text style={[type.muted, { marginTop: 8 }]}>{ex.notes}</Text> : null}
              {signal && signal.kind !== "none" ? <Text style={[type.labelAccent, { marginTop: 8 }]}>{signal.message}</Text> : null}
              <TextButton label="History" onPress={() => router.push(`/exercise/${encodeURIComponent(ex.skill ?? ex.id)}`)} color={colors.muted} />
              <View style={{ height: 24 }} />
              {exSets.map((x, i) => (
                <View key={x.id} style={s.setRow}>
                  <Text style={[type.exercise, { width: 64 }]}>Set {i + 1}</Text>
                  <Text style={[type.exercise, { flex: 1, fontFamily: fonts.regular, fontVariant: ["tabular-nums"], color: x.done ? colors.ink : colors.muted }]}>
                    {(ex.unit === "seconds" ? x.seconds : x.reps) ?? "-"}{ex.unit === "seconds" ? " s" : " reps"}{x.assistKg != null ? ` · ${x.assistKg} kg assist` : ""}
                  </Text>
                  <Text style={type.labelAccent}>{x.done ? "Done" : ""}</Text>
                </View>
              ))}
              <View style={{ height: 380 }} />
            </ScrollView>
            <View style={[s.panel, { bottom: kb }]}>
              {active ? (
                <>
                  <Text style={type.label}>Set {exSets.indexOf(active) + 1} of {exSets.length}{ex.perSide ? " · each side" : ""}</Text>
                  <View style={s.stepper}>
                    <Pressable onPress={() => bump(-step)} accessibilityRole="button" accessibilityLabel="Minus" style={s.pm}>
                      <Text style={s.pmText}>-</Text>
                    </Pressable>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={s.bigNum}>{value}</Text>
                      <Text style={type.label}>{ex.unit === "seconds" ? "seconds" : "reps"}</Text>
                    </View>
                    <Pressable onPress={() => bump(step)} accessibilityRole="button" accessibilityLabel="Plus" style={s.pm}>
                      <Text style={s.pmText}>+</Text>
                    </Pressable>
                  </View>
                  {ex.usesAssist ? (
                    <View style={s.assist}>
                      <Text style={[type.label, { flex: 1 }]}>Assist kg</Text>
                      <TextInput
                        value={assistText}
                        onChangeText={setAssistText}
                        keyboardType="decimal-pad"
                        placeholder="type kg"
                        placeholderTextColor={colors.muted}
                        style={s.kg}
                      />
                    </View>
                  ) : null}
                  <PrimaryButton label="Tick set" onPress={tick} style={{ height: 72, marginTop: 8 }} />
                </>
              ) : (
                <PrimaryButton label="Next exercise" onPress={() => nextExercise(idx)} style={{ height: 72 }} />
              )}
              <View style={s.foot}>
                <Text style={type.muted}>{doneCount} of {session.sets.length} sets</Text>
                <TextButton label="Skip exercise" onPress={() => nextExercise(idx)} color={colors.muted} />
              </View>
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: space.margin },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: space.margin },
  setRow: { flexDirection: "row", alignItems: "center", minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.surface },
  panel: { position: "absolute", left: 0, right: 0, paddingHorizontal: space.margin, paddingBottom: 12, paddingTop: 12 },
  stepper: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  pm: { width: 72, height: 72, borderRadius: 4, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  pmText: { fontFamily: fonts.medium, fontSize: 40, lineHeight: 44, color: colors.ink },
  bigNum: { ...type.number, fontSize: 40 },
  assist: { flexDirection: "row", alignItems: "center", minHeight: 56, borderTopWidth: 1, borderTopColor: colors.surface },
  kg: { width: 120, height: 56, textAlign: "right", fontFamily: fonts.medium, fontSize: 40, color: colors.ink, fontVariant: ["tabular-nums"], padding: 0 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
