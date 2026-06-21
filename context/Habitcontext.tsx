import type { Session } from "@supabase/supabase-js";
import React, { createContext, useEffect, useState } from "react";
import { toDateKey, todayDateKey } from "../lib/dateUtils";
import { supabase } from "../lib/supabase";

export interface Habit {
  id: string;
  title: string;
  frequency: string;
  category: string;
  completed: boolean; // completed *today*
  time: string;
  icon: string;
}

export interface ReportItem {
  id: string;
  title: string;
  icon: string;
  category: string;
  completedCount: number;
  totalDays: number;
  rate: number; // 0-100
}

export interface HabitLog {
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
}

interface HabitContextValue {
  session: Session | null;
  authLoading: boolean;
  habits: Habit[];
  habitsLoading: boolean;
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  addHabit: (input: {
    title: string;
    time: string;
    category: string;
  }) => Promise<{ error: string | null }>;
  toggleHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  fetchReport: (days: number) => Promise<ReportItem[]>;
  fetchLogsForRange: (startDateKey: string, endDateKey: string) => Promise<HabitLog[]>;
  signOut: () => Promise<void>;
}

export const HabitContext = createContext<HabitContextValue>(
  null as unknown as HabitContextValue
);

function mapRow(row: any): Omit<Habit, "completed"> {
  return {
    id: row.id,
    title: row.title,
    frequency: row.frequency ?? "Daily",
    category: row.category,
    time: row.time,
    icon: row.icon ?? "🎯",
  };
}

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshHabits();
    } else {
      setHabits([]);
    }
  }, [session?.user?.id]);

  const refreshHabits = async () => {
    if (!session?.user) return;
    setHabitsLoading(true);

    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (habitsError) {
      console.log("Failed to load habits:", habitsError.message);
      setHabitsLoading(false);
      return;
    }

    // "Today" is always derived live from the device clock, never stored.
    const today = todayDateKey();
    const { data: logsToday, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("user_id", session.user.id)
      .eq("completed_date", today);

    if (logsError) {
      console.log("Failed to load today's logs:", logsError.message);
    }

    const completedIds = new Set((logsToday ?? []).map((l) => l.habit_id));

    setHabits(
      (habitsData ?? []).map((row) => ({
        ...mapRow(row),
        completed: completedIds.has(row.id),
      }))
    );
    setHabitsLoading(false);
  };

  const addHabit: HabitContextValue["addHabit"] = async ({
    title,
    time,
    category,
  }) => {
    if (!session?.user) return { error: "Not logged in" };

    const { data, error } = await supabase
      .from("habits")
      .insert([
        {
          title,
          time,
          category,
          icon: "🎯",
          frequency: "Daily",
          user_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
      return { error: error.message };
    }

    setHabits((prev) => [...prev, { ...mapRow(data), completed: false }]);
    return { error: null };
  };

  const toggleHabit = async (id: string) => {
    if (!session?.user) return;
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const today = todayDateKey();
    const willBeCompleted = !target.completed;

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: willBeCompleted } : h))
    );

    if (willBeCompleted) {
      const { error } = await supabase.from("habit_logs").insert([
        { habit_id: id, user_id: session.user.id, completed_date: today },
      ]);
      if (error) {
        console.log(error);
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, completed: !willBeCompleted } : h))
        );
      }
    } else {
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", id)
        .eq("completed_date", today);
      if (error) {
        console.log(error);
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, completed: !willBeCompleted } : h))
        );
      }
    }
  };

  const deleteHabit = async (id: string) => {
    const previous = habits;
    setHabits((prev) => prev.filter((h) => h.id !== id));

    const { error } = await supabase.from("habits").delete().eq("id", id);

    if (error) {
      console.log(error);
      setHabits(previous);
    }
  };

  // Completion rate per habit over the last `days` days (today included)
  const fetchReport = async (days: number): Promise<ReportItem[]> => {
    if (!session?.user) return [];

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = toDateKey(start);
    const endStr = toDateKey(end);

    const { data: logs, error } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_date")
      .eq("user_id", session.user.id)
      .gte("completed_date", startStr)
      .lte("completed_date", endStr);

    if (error) {
      console.log("Failed to load report:", error.message);
      return [];
    }

    return habits.map((h) => {
      const count = (logs ?? []).filter((l) => l.habit_id === h.id).length;
      return {
        id: h.id,
        title: h.title,
        icon: h.icon,
        category: h.category,
        completedCount: count,
        totalDays: days,
        rate: Math.round((count / days) * 100),
      };
    });
  };

  // Raw completion log rows for any date range (e.g. the current week),
  // used to color in the calendar strip with real data.
  const fetchLogsForRange = async (
    startDateKey: string,
    endDateKey: string
  ): Promise<HabitLog[]> => {
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_date")
      .eq("user_id", session.user.id)
      .gte("completed_date", startDateKey)
      .lte("completed_date", endDateKey);

    if (error) {
      console.log("Failed to load logs for range:", error.message);
      return [];
    }

    return data ?? [];
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setHabits([]);
  };

  return (
    <HabitContext.Provider
      value={{
        session,
        authLoading,
        habits,
        habitsLoading,
        editingHabit,
        setEditingHabit,
        addHabit,
        toggleHabit,
        deleteHabit,
        refreshHabits,
        fetchReport,
        fetchLogsForRange,
        signOut,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}