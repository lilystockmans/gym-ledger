import { useRouter } from "expo-router";
import { Background } from "../components/Background";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardScroll } from "../components/KeyboardScroll";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn, Field, Rule, Stepper, TextBtn, iso, niceDate } from "../components/plan/ui";
import { shareExport } from "../lib/export";
import { getRepo } from "../lib/repo";
import { predictNextPeriod } from "../lib/rules";
import type { Settings } from "../lib/types";
import { DEFAULT_SETTINGS } from "../lib/types";
import { colors, space, type } from "../theme";

function daysAgo(isoStamp: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStamp).getTime()) / 86400000));
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [starts, setStarts] = useState<string[]>([]);
  const [past, setPast] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = getRepo();
    await r.init();
    setSettings(await r.getSettings());
    setStarts(await r.getPeriodStarts());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(date: string) {
    await getRepo().addPeriodStart(date);
    await load();
  }
  async function addPast() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(past) || isNaN(new Date(past).getTime())) {
      setMsg("Type the date as year-month-day, for example 2026-11-03.");
      return;
    }
    setMsg("");
    await add(past);
    setPast("");
  }
  async function doExport() {
    try {
      await shareExport(getRepo());
      setMsg("");
    } catch (e) {
      setMsg(e instanceof Error ? `Export did not work: ${e.message}` : "Export did not work.");
    }
    await load();
  }

  const next = predictNextPeriod(starts).nextStart;
  const recent = starts.slice().reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <Background />
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <KeyboardScroll contentStyle={{ paddingHorizontal: space.margin, paddingBottom: 80 }}>
        <TextBtn label="Back" onPress={() => router.back()} />
        <Text style={[type.display, { marginTop: 8, fontSize: 88, lineHeight: 100 }]} numberOfLines={1}>Settings</Text>

        <View style={{ height: 40 }} />
        <Text style={type.label}>Period</Text>
        <View style={{ height: 8 }} />
        <Btn label="Period started today" onPress={() => add(iso(new Date()))} />
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 20 }}>
          <Field label="Or a past start (YYYY-MM-DD)" placeholder="2026-11-03" value={past} onChangeText={setPast} autoCapitalize="none" />
          <View style={{ width: 12 }} />
          <Btn label="Add" ghost onPress={addPast} />
        </View>
        {msg ? <Text style={[type.muted, { marginTop: 8 }]}>{msg}</Text> : null}

        <View style={{ height: 32 }} />
        <Text style={type.label}>Period starts</Text>
        <Rule />
        {recent.length === 0 ? <Text style={[type.muted, { paddingVertical: 16 }]}>None yet.</Text> : null}
        {recent.map((d) => (
          <View key={d}>
            <View style={{ flexDirection: "row", alignItems: "center", minHeight: space.tap }}>
              <Text style={[type.exercise, { flex: 1 }]}>{niceDate(d)}</Text>
              <TextBtn label="Remove" danger onPress={async () => { await getRepo().removePeriodStart(d); await load(); }} />
            </View>
            <Rule />
          </View>
        ))}

        <View style={{ height: 32 }} />
        <Text style={type.label}>Next period, predicted</Text>
        <Text style={[type.number, { marginTop: 4 }]}>{next ? niceDate(next) : "Not enough data"}</Text>

        <View style={{ height: 32 }} />
        <Stepper label="Easy days after a period starts" value={settings.easyDays} min={0} max={7}
          onChange={async (n) => setSettings(await getRepo().saveSettings({ easyDays: n }))} />
        <Text style={[type.muted, { marginTop: 4 }]}>Each easy day has one set fewer per exercise.</Text>

        <View style={{ height: 32 }} />
        <Text style={type.label}>Rest timer</Text>
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <Choice label="On" on={settings.restTimer} onPress={async () => setSettings(await getRepo().saveSettings({ restTimer: true }))} />
          <Choice label="Off" on={!settings.restTimer} onPress={async () => setSettings(await getRepo().saveSettings({ restTimer: false }))} />
        </View>
        <Text style={[type.muted, { marginTop: 8 }]}>A rest screen with a countdown after each ticked set. Turn it off when your watch times the rests.</Text>
        {settings.restTimer ? (
          <>
            <View style={{ height: 24 }} />
            <Text style={type.label}>Vibrate when the rest ends</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <Choice label="On" on={settings.restVibrate} onPress={async () => setSettings(await getRepo().saveSettings({ restVibrate: true }))} />
              <Choice label="Off" on={!settings.restVibrate} onPress={async () => setSettings(await getRepo().saveSettings({ restVibrate: false }))} />
            </View>
          </>
        ) : null}

        <View style={{ height: 40 }} />
        <Text style={type.label}>Export</Text>
        <View style={{ height: 8 }} />
        <Btn label="Export" onPress={doExport} />
        <Text style={[type.muted, { marginTop: 8 }]}>
          {settings.lastExportAt ? `Last export ${daysAgo(settings.lastExportAt)} days ago` : "Never exported"}
        </Text>
      </KeyboardScroll>
    </SafeAreaView>
    </View>
  );
}

function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={{ minHeight: space.tap, minWidth: 96, paddingHorizontal: 16, marginRight: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.ink, backgroundColor: on ? colors.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Text style={[type.exercise, { fontSize: 16 }, on && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}
