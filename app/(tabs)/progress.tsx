import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { SKILLS } from "../../lib/ladders";
import { getRepo } from "../../lib/repo";
import { nextAction } from "../../lib/rules";
import type { Session, Settings, Signal } from "../../lib/types";
import { DEFAULT_SETTINGS } from "../../lib/types";
import { colors, fonts, space, type } from "../../theme";

function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function Progress() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Session[]>([]);
  useFocusEffect(
    useCallback(() => {
      const r = getRepo();
      r.init().then(async () => {
        setSettings(await r.getSettings());
        setSessions(await r.getSessions());
      });
    }, []),
  );
  const today = todayIso();
  const signals: Record<string, Signal> = {};
  for (const sk of SKILLS) signals[sk.name] = nextAction(sk.name, sessions, settings, today);
  const flagged = SKILLS.filter((sk) => signals[sk.name].kind !== "none");
  const open = (name: string) => router.push(`/exercise/${encodeURIComponent(name)}`);

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[type.display, { marginTop: 24 }]}>Progress</Text>

        <Text style={[type.label, { marginTop: 48 }]}>Signals</Text>
        {flagged.length === 0 ? (
          <Text style={[type.muted, s.empty]}>Nothing to act on right now. Keep logging.</Text>
        ) : (
          flagged.map((sk) => (
            <Pressable key={sk.name} onPress={() => open(sk.name)} style={s.row} accessibilityRole="button">
              <Text style={type.exercise}>{sk.name}</Text>
              <Text style={[type.labelAccent, { marginTop: 4 }]}>{signals[sk.name].kind === "ready" ? "Ready to move up" : "Stuck"}</Text>
              <Text style={[type.body, { marginTop: 4 }]}>{signals[sk.name].message}</Text>
            </Pressable>
          ))
        )}

        <Text style={[type.label, { marginTop: 48 }]}>Ladders</Text>
        {SKILLS.map((sk) => {
          const sig = signals[sk.name];
          const current = settings.currentSteps[sk.name];
          const idx = sk.steps.findIndex((st) => st.name === current);
          const kg = settings.assistKg[sk.name];
          return (
            <Pressable key={sk.name} onPress={() => open(sk.name)} style={s.row} accessibilityRole="button">
              <Text style={type.exercise}>{sk.name}</Text>
              <Text style={[type.muted, { marginTop: 2 }]}>{sk.goal}</Text>
              <View style={{ marginTop: 12 }}>
                {sk.steps.map((st, i) => {
                  const isCur = i === idx;
                  return (
                    <View key={st.name} style={s.step}>
                      <View style={[s.dot, isCur && s.dotOn, i < idx && s.dotPast]} />
                      <Text style={[s.stepText, isCur && s.stepNow, i < idx && { color: colors.muted }]}>{st.short}</Text>
                      {isCur && <Text style={[type.labelAccent, { marginLeft: 10 }]}>You are here</Text>}
                    </View>
                  );
                })}
              </View>
              {sk.usesAssist && kg != null && (
                <Text style={[type.body, { marginTop: 8 }]}>Assist now: <Text style={{ fontFamily: fonts.bold, fontVariant: ["tabular-nums"] }}>{kg} kg</Text> (less is better)</Text>
              )}
              {sig.kind !== "none" && (
                <Text style={[type.body, { marginTop: 8, fontFamily: fonts.semibold }]}>
                  {sig.kind === "ready" ? "Ready to move up. " : "Stuck. "}
                  <Text style={{ fontFamily: fonts.regular }}>{sig.message}</Text>
                </Text>
              )}
            </Pressable>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  scroll: { paddingHorizontal: space.margin },
  empty: { marginTop: 12 },
  row: { paddingVertical: 20, minHeight: space.tap, borderBottomWidth: 1, borderBottomColor: colors.surface },
  step: { flexDirection: "row", alignItems: "center", minHeight: 28 },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.muted, marginRight: 12 },
  dotOn: { backgroundColor: colors.accent, borderColor: colors.accent, width: 13, height: 13, borderRadius: 7, marginLeft: -2, marginRight: 10 },
  dotPast: { backgroundColor: colors.muted },
  stepText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  stepNow: { fontFamily: fonts.bold },
});
