import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { ToastAndroid, Platform } from "react-native";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function SignupScreen() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

   <TextInput
  placeholder="Enter your name"
  style={styles.input}
  value={name}
  onChangeText={setName}
   />
      <TextInput
        placeholder="Enter your email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
     
     <TextInput
  placeholder="Enter your password"
  secureTextEntry
  style={styles.input}
  value={password}
  onChangeText={setPassword}
/>
 
      <TouchableOpacity
  style={styles.button}
  disabled={loading}
onPress={async () => {
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
    options: {
      data: { full_name: name },
    },
  });
  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  // If email confirmation is enabled in Supabase, signUp succeeds
  // but no session is returned yet — the user must confirm first.
  if (!data.session) {
    alert(
      "Account created! Please check your email to confirm your account, then log in."
    );
    router.replace("/login");
    return;
  }

  if (Platform.OS === "android") {
    ToastAndroid.show("Account created successfully ✅", ToastAndroid.SHORT);
  }

  router.replace("/dashboard");
}}
>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBold}>Log In</Text>
        </Text>
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
    fontSize: 30,
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

  linkText: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },

  linkBold: {
    fontWeight: "bold",
    color: "black",
  },
});
