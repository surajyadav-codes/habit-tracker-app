import { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { HabitContext } from "../context/Habitcontext";

export default function HomeScreen() {
  const { session, authLoading } = useContext(HabitContext);

  // If a session already exists (returning user, app reopened), skip straight in
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
      <Text style={styles.title}>Habit Tracker</Text>

      <Text style={styles.subtitle}>
        Build Better Habits Daily
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/signup")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.secondaryButtonText}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 18,
    marginTop: 10,
  },
  button: {
  marginTop: 20,
  backgroundColor: "black",
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 10,
},

buttonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
},

secondaryButton: {
  marginTop: 16,
},

secondaryButtonText: {
  color: "#555",
  fontSize: 14,
  fontWeight: "600",
},
});
