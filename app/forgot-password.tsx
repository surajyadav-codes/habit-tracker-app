import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import {
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push({ pathname: "/verify-reset", params: { email } });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{"‹"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email and we&apos;ll send a 6-digit verification code to your inbox.
      </Text>

      <TextInput
        placeholder="Email address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoFocus
      />

      <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 25 },
  backButton: { position: "absolute", top: 60, left: 20, padding: 8 },
  backText: { fontSize: 32, color: "#111827" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 12, color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 30, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 15, backgroundColor: "#fff" },
  button: { backgroundColor: "#111827", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  linkText: { textAlign: "center", color: "#6366F1", fontWeight: "600", fontSize: 14 },
});