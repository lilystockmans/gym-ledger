import { Tabs } from "expo-router";
import { View } from "react-native";
import { Background } from "../../components/Background";
import { colors, fonts } from "../../theme";

// The Background is mounted here, once, so it stays fixed while screens scroll and while tabs change.
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Background />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.7 },
          tabBarIconStyle: { display: "none" },
          tabBarStyle: { position: "absolute", backgroundColor: "rgba(216,214,201,0.88)", borderTopColor: colors.surface, borderTopWidth: 1, height: 64, elevation: 0 },
          tabBarItemStyle: { justifyContent: "center" },
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Today" }} />
        <Tabs.Screen name="plan" options={{ title: "Plan" }} />
        <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      </Tabs>
    </View>
  );
}
