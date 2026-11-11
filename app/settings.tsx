// STUB owned by W4. Replace this file's content; keep the default export.
import { Text, View } from "react-native";
import { colors, type } from "../theme";

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" }}>
      <Text style={type.label}>Settings: stub (W4)</Text>
    </View>
  );
}
