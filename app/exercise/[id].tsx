import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, shortDate } from "../../components/progress/LineChart";
import { SKILLS } from "../../lib/ladders";
import { getRepo } from "../../lib/repo";
import type { SetEntry } from "../../lib/types";
import { colors, fonts, space, type } from "../../theme";

type Row = { date: string; sets: SetEntry[]; step: string | null; changedFrom: string | null };

function fmtSets(sets: SetEntry[]): string {
  const sec = sets.some((x) => x.seconds != null);
  const vals = sets.map((x) => (sec ? x.seconds : x.reps)).filter((v): v is number => v != null);
  if (vals.length === 0) return "";
  const unit = sec ? " s" : "";
  return vals.every((v) => v === vals[0]) ? `${vals.length} × ${vals[0]}${unit}` : `${vals.join(", ")}${unit}`;
}

export default function ExerciseHistory() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(String(raw ?? ""));
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [title, setTitle] = useState(id);
  const skill = SKILLS.find((k) => k.name === id);

  useEffect(() => {
    const r = getRepo();
    r.init().then(() => r.getSessions()).then((sessions) => {
      const out: Row[] = [];
      let name = skill?.name ?? "";
      for (const se of sessions) {
        const sets = se.sets.filter((x) => x.done !== false && (x.skill === id || x.exerciseId === id));
        if (sets.length === 0) continue;
        if (!name) name = sets[0].name;
        const step = sets[sets.length - 1].step;
        out.push({ date: se.date, sets, step, changedFrom: null });
      }
      out.sort((a, b) => a.date.localeCompare(b.date));
      out.forEach((row, i) => { if (i > 0 && row.step && out[i - 1].step && row.step !== out[i - 1].step) row.changedFrom = out[i - 1].step; });
      setTitle(name || id);
      setRows(out);
    });
  }, [id]);

  const best = (r: Row) => {
    const v = r.sets.map((x) => x.seconds ?? x.reps).filter((n): n is number => n != null);
    return v.length ? Math.max(...v) : null;
  };
  const isSec = rows?.some((r) => r.sets.some((x) => x.seconds != null)) ?? false;
  const perf = (rows ?? []).flatMap((r) => { const b = best(r); return b == null ? [] : [{ label: r.date, value: b }]; });
  const assist = (rows ?? []).flatMap((r) => {
    const v = r.sets.map((x) => x.assistKg).filter((n): n is number => n != null);
    return v.length ? [{ label: r.date, value: Math.min(...v) }] : [];
  });
  const newest = [...(rows ?? [])].reverse();

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back} accessibilityRole="button"><Text style={type.labelAccent}>Back</Text></Pressable>
        <Text style={[type.display, { marginTop: 8 }]} numberOfLines={3} adjustsFontSizeToFit>{title}</Text>
        {rows === null ? null : rows.length === 0 ? (
          <Text style={[type.body, { marginTop: 32 }]}>No sets logged for this yet. Log a workout and the chart will show up here.</Text>
        ) : (
          <>
            {skill && <Text style={[type.muted, { marginTop: 16 }]}>{skill.goal}</Text>}
            <Text style={[type.label, { marginTop: 40 }]}>Best {isSec ? "seconds" : "reps"} per session</Text>
            {perf.length > 0 ? <View style={{ marginTop: 8 }}><LineChart points={perf} unit={isSec ? "seconds" : "reps"} /></View> : <Text style={[type.muted, { marginTop: 8 }]}>No numbers logged yet.</Text>}
            {assist.length > 0 && (
              <>
                <Text style={[type.label, { marginTop: 32 }]}>Assist kg per session (lower is better)</Text>
                <View style={{ marginTop: 8 }}><LineChart points={assist} height={110} unit="kg" lowerIsBetter /></View>
              </>
            )}
            <Text style={[type.label, { marginTop: 40 }]}>Sessions, newest first</Text>
            {newest.map((r) => {
              const kg = r.sets.map((x) => x.assistKg).filter((n): n is number => n != null);
              return (
                <View key={r.date + (r.step ?? "")} style={s.row}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={[type.exercise, { flex: 1, fontVariant: ["tabular-nums"] }]}>{shortDate(r.date)}</Text>
                    <Text style={[type.exercise, { fontVariant: ["tabular-nums"] }]}>{fmtSets(r.sets)}</Text>
                  </View>
                  <Text style={[type.muted, { marginTop: 2 }]}>
                    {r.step ?? ""}{kg.length ? `${r.step ? ", " : ""}assist ${Math.min(...kg)} kg` : ""}
                  </Text>
                  {r.changedFrom && <Text style={[type.labelAccent, { marginTop: 6 }]}>Moved up to this step</Text>}
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space.margin },
  back: { minHeight: space.tap, justifyContent: "center", marginTop: 8 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.surface, marginTop: 0 },
});
