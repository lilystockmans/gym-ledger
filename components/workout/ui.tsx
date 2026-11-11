import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, space, type } from "../../theme";

export function PrimaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: object }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[ui.primary, style]}>
      <Text style={type.button}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress, color = colors.ink }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={ui.textBtn}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color }}>{label}</Text>
    </Pressable>
  );
}

/** Warm-up and cool-down list. Each row is one tap target of at least 56 px. */
export function TickList({ items, ticked, onToggle }: { items: string[]; ticked: Set<number>; onToggle: (i: number) => void }) {
  return (
    <View>
      {items.map((t, i) => {
        const on = ticked.has(i);
        return (
          <Pressable key={i} onPress={() => onToggle(i)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={ui.tickRow}>
            <View style={[ui.box, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
              {on ? <Text style={{ color: colors.onAccent, fontFamily: fonts.bold, fontSize: 16, lineHeight: 18 }}>✓</Text> : null}
            </View>
            <Text style={[type.exercise, { flex: 1, fontFamily: fonts.regular, fontSize: 16, lineHeight: 21 }, on && { color: colors.muted, textDecorationLine: "line-through" }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ui = StyleSheet.create({
  primary: { height: space.tap + 8, borderRadius: 4, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  textBtn: { minHeight: space.tap, justifyContent: "center", paddingHorizontal: 4 },
  tickRow: { flexDirection: "row", alignItems: "center", gap: 16, minHeight: space.tap, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surface },
  box: { width: 28, height: 28, borderRadius: 4, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
