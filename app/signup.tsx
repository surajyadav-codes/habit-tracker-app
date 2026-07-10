import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.session) {
      alert("Account created! Please check your email to confirm your account, then log in.");
      router.replace("/login");
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Your full name"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          placeholder="Email address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password (min 6 characters)"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 25, paddingVertical: 40 },
  title: { fontSize: 30, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: "#111827" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 15, backgroundColor: "#fff" },
  button: { backgroundColor: "#111827", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  linkText: { textAlign: "center", color: "#555" },
  linkBold: { fontWeight: "bold", color: "black" },
});