import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Rule, TextBtn, DAY_NAMES, addDays, iso, mondayOf, niceDate, shortDate } from "../../components/plan/ui";
import { getRepo } from "../../lib/repo";
import { periodAdjust, predictNextPeriod } from "../../lib/rules";
import type { PlannedDay, Settings, WorkoutId } from "../../lib/types";
import { DEFAULT_SETTINGS } from "../../lib/types";
import { colors, space, type } from "../../theme";

const CHOICES: WorkoutId[] = ["A", "B", "C"];

export default function Plan() {
  const router = useRouter();
  const [monday, setMonday] = useState(mondayOf(iso(new Date())));
  const [planned, setPlanned] = useState<PlannedDay[]>([]);
  const [starts, setStarts] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const today = iso(new Date());

  const load = useCallback(async () => {
    const r = getRepo();
    await r.init();
    const [p, st, se] = await Promise.all([r.getPlannedDays(monday, addDays(monday, 6)), r.getPeriodStarts(), r.getSettings()]);
    setPlanned(p); setStarts(st); setSettings(se);
  }, [monday]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function place(date: string, current: WorkoutId | null, pick: WorkoutId) {
    await getRepo().setPlannedDay(date, current === pick ? null : pick);
    await load();
  }

  const next = predictNextPeriod(starts).nextStart;
  const thisWeek = monday === mondayOf(today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.margin, paddingBottom: 140 }}>
        <View style={{ alignItems: "flex-end", marginTop: 8 }}><TextBtn label="Settings" onPress={() => router.push("/settings")} /></View>
        <Text style={[type.display, { marginTop: 0 }]}>Plan</Text>

        <View style={s.weekRow}>
          <Pressable accessibilityRole="button" style={s.nav} onPress={() => setMonday(addDays(monday, -7))}><Text style={type.exercise}>Previous</Text></Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={type.label}>{thisWeek ? "This week" : "Week of"}</Text>
            <Text style={type.exercise}>{shortDate(monday)} to {shortDate(addDays(monday, 6))}</Text>
          </View>
          <Pressable accessibilityRole="button" style={s.nav} onPress={() => setMonday(addDays(monday, 7))}><Text style={[type.exercise, { textAlign: "right" }]}>Next</Text></Pressable>
        </View>
        <Rule />

        {DAY_NAMES.map((name, i) => {
          const date = addDays(monday, i);
          const cur = planned.find((p) => p.date === date)?.workoutId ?? null;
          const easy = periodAdjust(3, date, starts, settings.easyDays).easy;
          return (
            <View key={date}>
              <View style={s.day}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.exercise, date === today && { color: colors.accentText }]}>{name}</Text>
                  <Text style={type.muted}>{shortDate(date)}{date === today ? " · today" : ""}</Text>
                  {easy ? <Text style={type.labelAccent}>Easy day</Text> : null}
                </View>
                <View style={{ flexDirection: "row" }}>
                  {CHOICES.map((c) => {
                    const on = cur === c;
                    return (
                      <Pressable key={c} accessibilityRole="button" accessibilityLabel={`Full Body ${c} on ${name}`} accessibilityState={{ selected: on }}
                        onPress={() => place(date, cur, c)} style={[s.pick, on && s.pickOn]}>
                        <Text style={[type.exercise, { fontSize: 20 }, on && { color: colors.onAccent }]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Rule />
            </View>
          );
        })}
        <Text style={[type.muted, { marginTop: 12 }]}>Tap a letter to place that workout. Tap it again to clear the day.</Text>

        <View style={{ height: 40 }} />
        <Text style={type.label}>Next period, predicted</Text>
        <Text style={[type.number, { marginTop: 4 }]}>{next ? niceDate(next) : "Not enough data"}</Text>
        {!next ? <Text style={type.muted}>Add at least two period starts in Settings.</Text> : null}

        <View style={{ height: 32 }} />
        <Rule />
        {CHOICES.map((c) => (
          <View key={c}><TextBtn label={`Edit Full Body ${c}`} onPress={() => router.push(`/edit/${c}`)} /><Rule /></View>
        ))}
        <TextBtn label="Settings" onPress={() => router.push("/settings")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  weekRow: { flexDirection: "row", alignItems: "center", marginTop: 32, marginBottom: 8 },
  nav: { minHeight: space.tap, minWidth: 80, justifyContent: "center" },
  day: { flexDirection: "row", alignItems: "center", minHeight: 72, paddingVertical: 8 },
  pick: { width: space.tap, height: space.tap, marginLeft: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  pickOn: { backgroundColor: colors.ink },
});
