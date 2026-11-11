// CONTRACT FILE (tokens). Workers must not change this file. Ask the scrum master.
// Source: design/brief.md and the Design direction in the plan.
import { Platform, StyleSheet, type TextStyle } from "react-native";

export const colors = {
  bg: "#F5F5F5",
  surface: "#D8D6C9",
  ink: "#303236",
  muted: "#52555A",
  accent: "#73795D", // big headings, buttons, ticks, chart lines. Never small text, never on charcoal
  accentText: "#5C6149", // small green text on light
  accentOnDark: "#9CA37F", // green on charcoal
  dark: "#303236", // rest timer and finish screen
  onAccent: "#F5F5F5",
  onDark: "#F5F5F5",
} as const;

export const space = { margin: 24, tap: 56, gap: 16, rule: StyleSheet.hairlineWidth < 1 ? 1 : 1 } as const;

export const fonts = {
  regular: "InterTight_400Regular",
  medium: "InterTight_500Medium",
  semibold: "InterTight_600SemiBold",
} as const;

const tabular: TextStyle = { fontVariant: ["tabular-nums"] };

export const type = {
  display: { fontFamily: fonts.medium, fontSize: 64, lineHeight: 62, letterSpacing: -1.92, color: colors.accent } as TextStyle,
  displayOnDark: { fontFamily: fonts.medium, fontSize: 64, lineHeight: 62, letterSpacing: -1.92, color: colors.accentOnDark } as TextStyle,
  number: { fontFamily: fonts.medium, fontSize: 40, lineHeight: 44, color: colors.ink, ...tabular } as TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink } as TextStyle,
  muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted } as TextStyle,
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: "uppercase", color: colors.muted } as TextStyle,
  labelAccent: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: "uppercase", color: colors.accentText } as TextStyle,
  button: { fontFamily: fonts.semibold, fontSize: 17, color: colors.onAccent } as TextStyle,
  fallback: { fontFamily: Platform.select({ android: "sans-serif", default: "System" }) } as TextStyle,
};

export const rule = { height: 1, backgroundColor: colors.surface } as const;
