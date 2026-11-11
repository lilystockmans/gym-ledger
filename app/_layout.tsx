import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold, useFonts } from "@expo-google-fonts/inter-tight";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { colors } from "../theme";

export default function Root() {
  const [loaded] = useFonts({ InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
