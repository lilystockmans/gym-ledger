import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton, TextButton } from "../../components/workout/ui";
import { buildSession, plannedSets, rangeText, todayIso } from "../../components/workout/util";
import { getRepo } from "../../lib/repo";
import type { Session, Settings, Workout, WorkoutId } from "../../lib/types";
import { colors, fonts, space, type } from "../../theme";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [planned, setPlanned] = useState<WorkoutId | null>(null);
  const [picked, setPicked] = useState<WorkoutId | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [full, setFull] = useState<Set<string>>(new Set());
  const today = todayIso();
  const insets = useSafeAreaInsets();
  const starting = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const r = getRepo();
        await r.init();
        const [w, p, ss, st, ps] = await Promise.all([
          r.getWorkouts(), r.getPlannedDays(today, today), r.getSessions(), r.getSettings(), r.getPeriodStarts(),
        ]);
        if (!live) return;
        setWorkouts(w); setPlanned(p[0]?.workoutId ?? null); setSessions(ss); setSettings(st); setPeriods(ps);
        setFull(new Set(st.easyOverrides.filter((k) => k.startsWith(`${today}:`)).map((k) => k.slice(today.length + 1))));
      })();
      return () => { live = false; };
    }, [today]),
  );

  const now = new Date();
  const id = planned ?? picked;
  const w = workouts.find((x) => x.id === id) ?? null;
  const unfinished = sessions.filter((x) => x.date === today && x.source === "app" && !x.finishedAt).pop() ?? null;

  const start = async () => {
    if (!w || !settings || starting.current) return;
    starting.current = true;
    const s = buildSession(w, today, sessions, settings, periods, full);
    await getRepo().saveSession(s);
    router.push(`/workout/${s.id}`);
    setTimeout(() => { starting.current = false; }, 1500);
  };

  const rows = w && settings ? w.exercises.map((e) => ({ e, p: plannedSets(e, today, periods, settings, full) })) : [];
  const anyEasy = rows.some((r) => r.p.easy) || rows.some((r) => full.has(r.e.id));
  const toggleFull = (eid: string) => {
    const n = new Set(full);
    if (n.has(eid)) n.delete(eid); else n.add(eid);
    setFull(n);
    // Stored for today, so the choice survives a restart.
    if (settings) {
      const others = settings.easyOverrides.filter((k) => !k.startsWith(`${today}:`));
      const mine = [...n].map((x) => `${today}:${x}`);
      getRepo().saveSettings({ easyOverrides: [...others, ...mine] }).then(setSettings);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <Text style={type.label}>{DAY[now.getDay()]} · {now.getDate()} {MON[now.getMonth()]}</Text>
          <TextButton label="Settings" onPress={() => router.push("/settings")} />
        </View>
        {w ? (
          <>
            <Text style={[type.display, { marginTop: 12 }]}>{w.title}</Text>
            <Text style={[type.exercise, { marginTop: 20, fontSize: 15 }]}>{w.subtitle}</Text>
            {anyEasy ? <Text style={[type.labelAccent, { marginTop: 8 }]}>Easy day · one set fewer. Tap a set count to switch back.</Text> : null}
            <View style={{ height: 40 }} />
            <Text style={type.label}>{planned ? "Planned for today" : "Your pick"}</Text>
            {rows.map(({ e, p }) => (
              <Pressable key={e.id} style={s.row} onPress={() => (p.easy || full.has(e.id) ? toggleFull(e.id) : undefined)}>
                <Text style={[type.exercise, { flex: 1 }]}>{e.name}</Text>
                <Text style={[type.exercise, { fontSize: 15, fontVariant: ["tabular-nums"] }]}>{p.sets} × {rangeText(e)}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Text style={[type.display, { marginTop: 12 }]}>Today</Text>
            <Text style={[type.muted, { marginTop: 20 }]}>Nothing is planned. Pick a workout.</Text>
          </>
        )}
        {!planned ? (
          <View style={{ marginTop: 32 }}>
            {workouts.map((x) => (
              <Pressable key={x.id} style={s.row} onPress={() => setPicked(x.id)} accessibilityRole="button">
                <Text style={[type.exercise, { flex: 1 }]}>{x.title}</Text>
                <Text style={type.muted}>{picked === x.id ? "Chosen" : x.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={{ height: unfinished ? 260 : 190 }} />
      </ScrollView>
      <View style={[s.bar, { bottom: 64 + insets.bottom }]}>
        {unfinished ? (
          <PrimaryButton label="Continue" onPress={() => router.push(`/workout/${unfinished.id}`)} style={{ marginBottom: 8 }} />
        ) : null}
        {w ? (
          <Pressable onPress={start} accessibilityRole="button" style={[ui2.btn, unfinished && { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.ink }]}>
            <Text style={[type.button, unfinished && { color: colors.ink }]}>{unfinished ? "Start a new one" : "Start workout"}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const ui2 = StyleSheet.create({
  btn: { height: space.tap + 8, borderRadius: 4, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  scroll: { paddingHorizontal: space.margin },
  row: { flexDirection: "row", alignItems: "center", minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.surface },
  bar: { position: "absolute", left: 0, right: 0, padding: space.margin, backgroundColor: "rgba(216,214,201,0.97)", borderTopWidth: 1, borderTopColor: colors.surface },
});
