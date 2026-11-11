import { Tabs } from "expo-router";
import { colors, fonts } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.7 },
        tabBarIconStyle: { display: "none" },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.surface, borderTopWidth: 1, height: 64, elevation: 0 },
        tabBarItemStyle: { justifyContent: "center" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="plan" options={{ title: "Plan" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
    </Tabs>
  );
}
