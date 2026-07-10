import { useContext, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { HabitContext } from "../context/Habitcontext";

export default function HomeScreen() {
  const { session, authLoading } = useContext(HabitContext);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/dashboard");
    }
  }, [authLoading, session]);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>HabitTracker</Text>
      <Text style={styles.subtitle}>Build Better Habits Daily</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/signup")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/login")}>
        <Text style={styles.secondaryButtonText}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 25, backgroundColor: "#F9FAFB" },
  emoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, marginBottom: 40 },
  button: { backgroundColor: "#111827", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%", alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  secondaryButton: { marginTop: 16, paddingVertical: 12 },
  secondaryButtonText: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
});