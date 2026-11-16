import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, type } from "../../theme";

/** Full-screen rest timer. Calls onDone at zero or on Skip. */
export function RestTimer({ seconds, vibrate, next, onDone }: { seconds: number; vibrate: boolean; next: string; onDone: () => void }) {
  const end = useRef(Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  const finished = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !finished.current) {
        finished.current = true;
        clearInterval(t);
        if (vibrate) {
          try { Vibration.vibrate([0, 400, 150, 400]); } catch {}
        }
        setTimeout(onDone, 900);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(left / 60);
  const sec = String(left % 60).padStart(2, "0");
  return (
    <View style={s.full}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        <Text style={[type.label, { color: colors.onDark, marginTop: 24 }]}>Rest</Text>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={s.big}>{m}:{sec}</Text>
          <Text style={[type.exercise, { color: colors.accentOnDark, marginTop: 8 }]}>{left === 0 ? "Go" : `Next: ${next}`}</Text>
        </View>
        <Pressable onPress={onDone} accessibilityRole="button" style={s.skip}>
          <Text style={[type.button, { color: colors.dark }]}>Skip</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  full: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.dark, zIndex: 50 },
  big: { fontFamily: fonts.medium, fontSize: 140, lineHeight: 140, letterSpacing: -4, color: colors.accentOnDark, fontVariant: ["tabular-nums"] },
  skip: { height: 64, borderRadius: 4, backgroundColor: colors.onDark, alignItems: "center", justifyContent: "center", marginBottom: 24 },
});
