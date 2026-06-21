import { useState, useEffect } from "react";
import { useContext } from "react";
import { HabitContext } from "../context/Habitcontext";
import { router } from "expo-router";
import { ToastAndroid, Platform } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

export default function AddHabitScreen() {
  const [category, setCategory] = useState("Personal");
  const { addHabit, editingHabit, setEditingHabit } = useContext(HabitContext);

  const [habitName, setHabitName] = useState("");
  const [habitTime, setHabitTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setHabitName(editingHabit.title);
      setHabitTime(editingHabit.time);
      setCategory(editingHabit.category);
    }
    // Clear editing state when leaving the screen
    return () => setEditingHabit(null);
  }, [editingHabit]);

  const handleSave = async () => {
    if (!habitName || !habitTime) {
      alert("Please fill all fields");
      return;
    }

    setSaving(true);
    const { error } = await addHabit({
      title: habitName,
      time: habitTime,
      category,
    });
    setSaving(false);

    if (error) {
      alert("Failed to save habit: " + error);
      return;
    }

    if (Platform.OS === "android") {
      ToastAndroid.show("Habit saved successfully ✅", ToastAndroid.SHORT);
    }

    router.push("/dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Habit</Text>

      <TextInput
        placeholder="Habit Name (e.g. Morning Walk)"
        style={styles.input}
        value={habitName}
        onChangeText={setHabitName}
      />

      <TextInput
        placeholder="Time (e.g. 07:00 AM)"
        style={styles.input}
        value={habitTime}
        onChangeText={setHabitTime}
      />
       <TextInput
  placeholder="Category (Study/Fitness/Health)"
  style={styles.input}
  value={category}
  onChangeText={setCategory}
/>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Habit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
