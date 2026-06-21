import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://crjliaeuvnaunubusjmb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyamxpYWV1dm5hdW51YnVzam1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODg5MzYsImV4cCI6MjA5NzI2NDkzNn0.OJ8LFJJ6NBSQhakGQ1GnbVdDOEdYJ_DIwoUxP_OWMf8";

// On native (iOS/Android) we always use AsyncStorage.
// On web, Expo Router's static export pre-renders on Node, where
// `window`/`localStorage` don't exist — so we no-op there and only
// touch localStorage once we're actually running in a browser.
const ExpoCompatibleStorage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve(null);
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoCompatibleStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
