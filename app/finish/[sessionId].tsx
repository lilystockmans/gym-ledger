import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRepo } from "../../lib/repo";
import { nextAction } from "../../lib/rules";
import type { Feel, Session, Signal } from "../../lib/types";
import { colors, fonts, space, type } from "../../theme";
import { todayIso } from "../../components/workout/util";

const FEELS: Feel[] = ["Easy", "OK", "Hard"];

export default function Finish() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [feel, setFeel] = useState<Feel | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const r = getRepo();
      await r.init();
      const [s, all, st] = await Promise.all([r.getSession(sessionId), r.getSessions(), r.getSettings()]);
      if (!s) return;
      setSession(s);
      const skills = Array.from(new Set(s.sets.filter((x) => x.done && x.skill).map((x) => x.skill as string)));
      setSignals(skills.map((k) => nextAction(k, all, st, todayIso())).filter((x) => x.kind !== "none"));
    })();
  }, [sessionId]);

  if (!session) return <View style={{ flex: 1, backgroundColor: colors.dark }} />;

  const done = session.sets.filter((x) => x.done).length;
  const save = async () => {
    await getRepo().saveSession({ ...session, finishedAt: new Date().toISOString(), feel, note: note.trim() });
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.margin }} keyboardShouldPersistTaps="handled">
          <Text style={[type.label, { color: colors.onDark, marginTop: 24 }]}>Workout finished</Text>
          <Text style={[type.displayOnDark, { marginTop: 12 }]}>Well done</Text>
          <Text style={[type.exercise, { color: colors.onDark, marginTop: 24, fontSize: 20 }]}>
            {done} of {session.sets.length} sets done
          </Text>
          {signals.map((g) => (
            <View key={g.skill} style={s.signal}>
              <Text style={[type.labelAccent, { color: colors.accentOnDark }]}>{g.kind === "ready" ? "Ready to move up" : "Stuck"} · {g.skill}</Text>
              <Text style={[type.body, { color: colors.onDark, marginTop: 4 }]}>{g.message}</Text>
            </View>
          ))}
          <Text style={[type.label, { color: colors.onDark, marginTop: 40 }]}>How did it feel?</Text>
          <View style={s.feels}>
            {FEELS.map((f) => (
              <Pressable key={f} onPress={() => setFeel(f)} accessibilityRole="button" style={[s.feel, feel === f && s.feelOn]}>
                <Text style={[type.button, { color: feel === f ? colors.dark : colors.onDark }]}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={colors.accentOnDark}
            multiline
            style={s.note}
          />
          <View style={{ height: 120 }} />
        </ScrollView>
        <View style={s.bar}>
          <Pressable onPress={save} accessibilityRole="button" style={s.done}>
            <Text style={[type.button, { color: colors.dark }]}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  signal: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#4A4D52" },
  feels: { flexDirection: "row", gap: 8, marginTop: 12 },
  feel: { flex: 1, height: 64, borderRadius: 4, borderWidth: 1, borderColor: colors.onDark, alignItems: "center", justifyContent: "center" },
  feelOn: { backgroundColor: colors.onDark },
  note: { marginTop: 16, minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#4A4D52", color: colors.onDark, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 12, outlineStyle: "none" } as object,
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: space.margin },
  done: { height: 64, borderRadius: 4, backgroundColor: colors.onDark, alignItems: "center", justifyContent: "center" },
});
