import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { colors, fonts } from "../../theme";

export type Point = { label: string; value: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Thin accent line with dots. Date labels under the first, middle and last point. No gridlines. */
export function LineChart({ points, height = 160, unit, lowerIsBetter = false }: { points: Point[]; height?: number; unit: string; lowerIsBetter?: boolean }) {
  const [w, setW] = useState(0);
  const padX = 12, padTop = 28, padBottom = 28;
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const plotW = Math.max(0, w - padX * 2), plotH = height - padTop - padBottom;
  const x = (i: number) => padX + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padTop + (1 - (v - min) / (max - min)) * plotH;
  const labelIdx = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));
  const first = points[0], last = points[points.length - 1];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityLabel={`Chart, ${points.length} sessions, from ${first.value} to ${last.value} ${unit}`}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} fill="none" stroke={colors.accent} strokeWidth={1.5} />
          {points.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.value)} r={3.5} fill={colors.accent} />
          ))}
          {points.length > 1 && (
            <>
              <SvgText x={x(0)} y={y(first.value) - 10} fontSize={12} fontFamily={fonts.medium} fill={colors.ink} textAnchor="start">{first.value}</SvgText>
            </>
          )}
          <SvgText x={x(points.length - 1)} y={y(last.value) - 10} fontSize={12} fontFamily={fonts.bold} fill={colors.ink} textAnchor={points.length > 1 ? "end" : "middle"}>{last.value}</SvgText>
          <Line x1={padX} x2={w - padX} y1={height - padBottom + 8} y2={height - padBottom + 8} stroke={colors.surface} strokeWidth={1} />
          {labelIdx.map((i) => (
            <SvgText key={i} x={x(i)} y={height - 6} fontSize={11} fontFamily={fonts.regular} fill={colors.muted} textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"}>
              {shortDate(points[i].label)}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}
