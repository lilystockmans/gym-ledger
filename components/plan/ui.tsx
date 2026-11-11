import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, space, type } from "../../theme";

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function mondayOf(s: string): string {
  const d = parseIso(s);
  return addDays(s, -((d.getDay() + 6) % 7));
}
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function niceDate(s: string): string {
  const d = parseIso(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function shortDate(s: string): string {
  const d = parseIso(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Off-black primary button, 56 px high. */
export function Btn({ label, onPress, ghost, flex }: { label: string; onPress: () => void; ghost?: boolean; flex?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.btn, ghost ? s.ghost : s.primary, flex && { flex: 1 }]}
    >
      <Text style={[type.button, ghost && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Plain text action, 56 px high tap area. */
export function TextBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.textBtn}>
      <Text style={[type.exercise, { fontSize: 15, color: danger ? colors.muted : colors.ink, textDecorationLine: "underline" }]}>{label}</Text>
    </Pressable>
  );
}

export function Rule() {
  return <View style={{ height: 1, backgroundColor: colors.surface }} />;
}

export function Field(props: TextInputProps & { label: string; width?: number }) {
  const { label, width, style, ...rest } = props;
  return (
    <View style={{ width, flex: width ? undefined : 1 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.muted}
        style={[s.input, style]}
      />
    </View>
  );
}

/** - value + stepper, 56 px buttons. */
export function Stepper({ label, value, onChange, min = 0, max = 99, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <View style={{ minWidth: 150 }}>
      <Text style={type.label}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Less ${label}`} style={s.step} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>
          <Text style={type.number}>-</Text>
        </Pressable>
        <Text style={[type.number, { minWidth: 56, textAlign: "center" }]}>{value}{suffix}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`More ${label}`} style={s.step} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))}>
          <Text style={type.number}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  btn: { minHeight: space.tap, borderRadius: 4, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  primary: { backgroundColor: colors.ink },
  ghost: { borderWidth: 1, borderColor: colors.ink },
  textBtn: { minHeight: space.tap, justifyContent: "center" },
  input: {
    minHeight: 56, fontFamily: fonts.medium, fontSize: 18, color: colors.ink,
    borderBottomWidth: 1, borderBottomColor: colors.ink, paddingVertical: 8, backgroundColor: "transparent",
  },
  step: { width: space.tap, height: space.tap, alignItems: "center", justifyContent: "center" },
});
