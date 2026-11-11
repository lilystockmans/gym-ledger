// SAMPLE Home screen (Phase 0). W3 replaces the content with the real Home.
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRepo } from "../../lib/repo";
import type { Workout } from "../../lib/types";
import { colors, space, type } from "../../theme";

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
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[type.label, { marginTop: 24 }]}>{DAY[now.getDay()]} · {now.getDate()} Nov</Text>
        <Text style={[type.display, { marginTop: 12 }]}>{w ? w.title.split(" ").join("\n") : ""}</Text>
        <Text style={[type.exercise, { marginTop: 20, fontSize: 15 }]}>{w ? w.subtitle : ""}</Text>
        <Text style={[type.labelAccent, { marginTop: 8 }]}>Easy day 2 of 3 · one set fewer</Text>

        <View style={{ height: 72 }} />
        <Text style={type.label}>Next up</Text>
        {(w?.exercises.slice(0, 6) ?? []).map((e) => (
          <View key={e.id} style={s.row}>
            <Text style={[type.exercise, { flex: 1 }]}>{e.name}</Text>
            <Text style={[type.exercise, { fontSize: 15, fontVariant: ["tabular-nums"] }]}>
              {e.sets - 1} × {e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}{e.unit === "seconds" ? " s" : ""}
            </Text>
          </View>
        ))}
        <View style={{ height: 32 }} />
        <Text style={type.label}>Last time</Text>
        <Text style={[type.number, { marginTop: 4 }]}>25.5 kg</Text>
        <Text style={type.body}>Pull-up assist · 3 × 7 · ready to move up after one more</Text>
        <View style={{ height: 200 }} />
      </ScrollView>
      <View style={s.bar}>
        <Pressable style={s.button} accessibilityRole="button"><Text style={type.button}>Start workout</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  scroll: { paddingHorizontal: space.margin },
  row: { flexDirection: "row", alignItems: "center", minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.surface },
  bar: { position: "absolute", left: 0, right: 0, bottom: 64, padding: space.margin },
  button: { height: space.tap, borderRadius: 4, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
