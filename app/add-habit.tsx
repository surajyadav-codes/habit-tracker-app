import { useState, useEffect, useContext } from "react";
import { HabitContext } from "../context/Habitcontext";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
} from "react-native";

export default function AddHabitScreen() {
  const { addHabit, updateHabit, editingHabit, setEditingHabit } =
    useContext(HabitContext);

  const [habitName, setHabitName] = useState("");
  const [habitTime, setHabitTime] = useState("");
  const [category, setCategory] = useState("Personal");
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingHabit;

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
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setSaving(true);

    const payload = { title: habitName, time: habitTime, category };
    const { error } = isEditing
      ? await updateHabit(editingHabit!.id, payload)
      : await addHabit(payload);

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Failed to save habit: " + error);
      return;
    }

    if (Platform.OS === "android") {
      ToastAndroid.show(
        isEditing ? "Habit updated ✅" : "Habit saved ✅",
        ToastAndroid.SHORT
      );
    } else {
      Alert.alert(isEditing ? "Habit updated ✅" : "Habit saved ✅");
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{"‹"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isEditing ? "Edit Habit" : "Add New Habit"}
      </Text>

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
          <Text style={styles.buttonText}>
            {isEditing ? "Update Habit" : "Save Habit"}
          </Text>
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
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    padding: 8,
  },
  backText: {
    fontSize: 32,
    color: "#111827",
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
