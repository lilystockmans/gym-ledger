import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../../theme";

// Soft stops that fake a gaussian falloff, so edges melt instead of showing a ring.
const FALL = [
  [0, 1],
  [0.2, 0.82],
  [0.4, 0.5],
  [0.62, 0.2],
  [0.82, 0.05],
  [1, 0],
] as const;

function Grad({ id, color, peak }: { id: string; color: string; peak: number }) {
  return (
    <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
      {FALL.map(([o, a]) => (
        <Stop key={o} offset={o} stopColor={color} stopOpacity={a * peak} />
      ))}
    </RadialGradient>
  );
}

/**
 * Fixed full-screen background: beige with a fluid, organic green gradient pooling in the lower left
 * and melting diagonally towards the upper right, like the reference image.
 * Mount once in the tabs layout. Screens on top must keep a transparent background.
 */
export function RunBackground() {
  const { width: w, height: h } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h}>
        <Defs>
          <Grad id="r-core" color={colors.pool} peak={1} />
          <Grad id="r-body" color={colors.pool} peak={1} />
          <Grad id="r-streak" color={colors.pool} peak={0.9} />
          <Grad id="r-deep" color={colors.accent} peak={1} />
          <Grad id="r-glow" color={colors.glow} peak={0.9} />
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={colors.bg} />
        {/* light glow, top right */}
        <Ellipse cx={w * 0.95} cy={h * 0.08} rx={w * 0.8} ry={h * 0.3} fill="url(#r-glow)" />
        {/* big soft body of green, lower left */}
        <Ellipse cx={w * 0.05} cy={h * 0.95} rx={w * 1.5} ry={h * 0.62} fill="url(#r-body)" transform={`rotate(-22 ${w * 0.05} ${h * 0.95})`} />
        {/* diagonal streak that pulls the colour up and to the right */}
        <Ellipse cx={w * 0.55} cy={h * 0.72} rx={w * 0.95} ry={h * 0.26} fill="url(#r-streak)" transform={`rotate(-38 ${w * 0.55} ${h * 0.72})`} />
        {/* dense core in the corner */}
        <Ellipse cx={w * 0.0} cy={h * 1.0} rx={w * 0.95} ry={h * 0.36} fill="url(#r-core)" transform={`rotate(-18 0 ${h})`} />
        {/* deepest tone, only in the very corner */}
        <Ellipse cx={w * 0.0} cy={h * 1.02} rx={w * 0.5} ry={h * 0.2} fill="url(#r-deep)" transform={`rotate(-18 0 ${h})`} />
      </Svg>
    </View>
  );
}
