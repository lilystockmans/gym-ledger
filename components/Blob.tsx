import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

/** The reference's soft radial blur: accent to surface. One per screen at most. No image files. */
export function Blob({ size = 420, dark = false }: { size?: number; dark?: boolean }) {
  const inner = dark ? colors.accentOnDark : colors.accent;
  const outer = dark ? colors.dark : colors.surface;
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id="g" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
          <Stop offset="0" stopColor={inner} stopOpacity={0.9} />
          <Stop offset="0.55" stopColor={outer} stopOpacity={0.55} />
          <Stop offset="1" stopColor={outer} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} fill="url(#g)" />
    </Svg>
  );
}
