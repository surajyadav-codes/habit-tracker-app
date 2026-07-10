import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, ActivityIndicator,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        placeholder="Email address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => router.push("/forgot-password")} style={styles.forgotRow}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/signup")}>
        <Text style={styles.linkText}>
          Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 25 },
  title: { fontSize: 30, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: "#111827" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 15, backgroundColor: "#fff" },
  forgotRow: { alignSelf: "flex-end", marginBottom: 20, marginTop: -6 },
  forgotText: { fontSize: 14, color: "#6366F1", fontWeight: "600" },
  button: { backgroundColor: "#111827", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  linkText: { textAlign: "center", color: "#555" },
  linkBold: { fontWeight: "bold", color: "black" },
});