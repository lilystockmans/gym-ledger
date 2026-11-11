import { Text, useWindowDimensions } from "react-native";
import { space, type } from "../../theme";

/** Screen title at 100 px, shrunk only when its longest word would otherwise break across lines. */
export function Title({ children }: { children: string }) {
  const { width } = useWindowDimensions();
  const longest = Math.max(...children.split(/\s+/).map((w) => w.length), 1);
  const size = Math.min(100, Math.floor((Math.min(width, 480) - space.margin * 2) / (longest * 0.47)));
  return <Text style={[type.display, { fontSize: size, lineHeight: Math.round(size * 0.9), marginTop: 24 }]}>{children}</Text>;
}
