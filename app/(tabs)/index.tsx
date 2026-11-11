// SAMPLE Home screen (Phase 0). W3 replaces the content with the real Home.
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Blob } from "../../components/Blob";
import { getRepo } from "../../lib/repo";
import type { Workout } from "../../lib/types";
import { colors, rule, space, type } from "../../theme";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Home() {
  const [w, setW] = useState<Workout | null>(null);
  useEffect(() => {
    const r = getRepo();
    r.init().then(() => r.getWorkout("A")).then(setW);
  }, []);
  const now = new Date();
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View style={s.blob} pointerEvents="none"><Blob size={460} /></View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[type.label, { marginTop: 24 }]}>Today · {now.getDate()} Nov</Text>
        <Text style={[type.display, { marginTop: 8 }]} numberOfLines={1} adjustsFontSizeToFit>{DAY[now.getDay()]}</Text>
        <Text style={[type.body, { marginTop: 16 }]}>{w ? `${w.title}: ${w.subtitle}` : ""}</Text>
        <Text style={[type.labelAccent, { marginTop: 8 }]}>Easy day 2 of 3 · one set fewer</Text>

        <View style={{ height: 96 }} />
        <Text style={type.label}>Next up</Text>
        {(w?.exercises.slice(0, 6) ?? []).map((e) => (
          <View key={e.id} style={s.row}>
            <Text style={[type.body, { flex: 1 }]}>{e.name}</Text>
            <Text style={[type.muted, { fontVariant: ["tabular-nums"] }]}>
              {e.sets - 1} × {e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}{e.unit === "seconds" ? " s" : ""}
            </Text>
          </View>
        ))}
        <View style={{ height: 24 }} />
        <Text style={type.label}>Last time</Text>
        <Text style={[type.number, { marginTop: 4 }]}>25.5 kg</Text>
        <Text style={type.muted}>Pull-up assist · 3 × 7 · ready to move up after one more</Text>
        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={s.bar}>
        <Pressable style={s.button} accessibilityRole="button"><Text style={type.button}>Start workout</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  blob: { position: "absolute", right: -160, top: -40 },
  scroll: { paddingHorizontal: space.margin },
  row: { flexDirection: "row", alignItems: "center", minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.surface },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: space.margin, backgroundColor: colors.bg },
  button: { height: space.tap, borderRadius: 4, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
});
void rule;
