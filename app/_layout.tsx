import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HabitProvider } from "../context/Habitcontext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <HabitProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </HabitProvider>
    </SafeAreaProvider>
  );
}
