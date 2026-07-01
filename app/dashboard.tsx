import { Alert, ActivityIndicator, Modal } from "react-native";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { HabitContext } from "../context/Habitcontext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getWeekDates,
  toDateKey,
  todayDateKey,
  formatFullDate,
  WEEKDAY_SHORT,
} from "../lib/dateUtils";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';

// --- Types & Interfaces ---
interface DayStreak {
  day: string;
  date: number;
  dateKey: string;
  isComplete: boolean;
  isToday: boolean;
}

const { width } = Dimensions.get('window');

const ABOUT_SECTIONS = [
  {
    icon: "➕",
    title: "Add a habit",
    description: "Tap the dark + button in the bottom-right corner and fill in a name, time, and category.",
  },
  {
    icon: "✅",
    title: "Mark a habit done",
    description: "Tap anywhere on a habit card to check it off for today. Tap again to undo it.",
  },
  {
    icon: "🗑️",
    title: "Delete a habit",
    description: "Tap the trash icon on a habit card, then confirm. This removes it and its history permanently.",
  },
  {
    icon: "🔥",
    title: "Current Streak",
    description: "Counts consecutive days where every single habit was checked off. Missing even one habit on a day breaks the streak.",
  },
  {
    icon: "📊",
    title: "Weekly & Monthly Report",
    description: "Tap the report card on the dashboard to see a completion-rate breakdown for each habit, this week or this month.",
  },
  {
    icon: "🚪",
    title: "Logout",
    description: "Tap your avatar (top-right circle) and confirm to sign out of your account.",
  },
];

export default function DashboardScreen() {
  const {
    session,
    authLoading,
    habits,
    habitsLoading,
    toggleHabit,
    deleteHabit,
    signOut,
    fetchLogsForRange,
  } = useContext(HabitContext);

  // Auth guard: bounce anyone without a session back to the welcome screen
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/");
    }
  }, [authLoading, session]);

  // Prefer the saved name. If it's missing (e.g. an older account from
  // before names were stored), fall back to the part of the email before
  // the @ instead of dumping the whole address into the greeting.
  const username =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const [aboutVisible, setAboutVisible] = useState(false);

  // Calculate completed count once for use in dependency arrays
  const completedCount = habits.filter((h) => h.completed).length;

  // --- Live calendar strip: always derived from the device's current date,
  // and colored using *real* habit_logs data — never hardcoded. ---
  const [weekStrip, setWeekStrip] = useState<DayStreak[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    const weekDates = getWeekDates(new Date()); // Mon -> Sun, computed live
    const todayKey = todayDateKey();
    const startKey = toDateKey(weekDates[0]);
    const endKey = toDateKey(weekDates[6]);

    fetchLogsForRange(startKey, endKey).then((logs) => {
      if (cancelled) return;

      const countsByDate = new Map<string, Set<string>>();
      for (const log of logs) {
        const set = countsByDate.get(log.completed_date) ?? new Set<string>();
        set.add(log.habit_id);
        countsByDate.set(log.completed_date, set);
      }

      const strip: DayStreak[] = weekDates.map((d, i) => {
        const key = toDateKey(d);
        const doneCount = countsByDate.get(key)?.size ?? 0;
        // Only count habits that existed on this day (by their created_at date)
        const habitsOnDay = habits.filter(
          (h) => toDateKey(new Date(h.createdAt)) <= key
        ).length;
        return {
          day: WEEKDAY_SHORT[i],
          date: d.getDate(),
          dateKey: key,
          isComplete: habitsOnDay > 0 && doneCount >= habitsOnDay,
          isToday: key === todayKey,
        };
      });

      setWeekStrip(strip);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, habits.length, completedCount]);

  // --- Current Streak: consecutive days where ALL habits were completed.
  // Looks back up to a year so long streaks aren't cut off. If today isn't
  // finished yet, the streak isn't broken until the day actually ends —
  // it's counted from the most recent complete day backwards. ---
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    if (habits.length === 0) {
      setCurrentStreak(0);
      return;
    }

    let cancelled = false;
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 364);
    const startKey = toDateKey(start);
    const endKey = toDateKey(today);

    fetchLogsForRange(startKey, endKey).then((logs) => {
      if (cancelled) return;

      const countsByDate = new Map<string, Set<string>>();
      for (const log of logs) {
        const set = countsByDate.get(log.completed_date) ?? new Set<string>();
        set.add(log.habit_id);
        countsByDate.set(log.completed_date, set);
      }

      // A day is "complete" if every habit that existed on that day was done.
      // This prevents streaks from breaking when new habits are added.
      const isDayComplete = (key: string) => {
        const habitsOnDay = habits.filter(
          (h) => toDateKey(new Date(h.createdAt)) <= key
        ).length;
        if (habitsOnDay === 0) return false;
        return (countsByDate.get(key)?.size ?? 0) >= habitsOnDay;
      };

      const cursor = new Date();
      if (!isDayComplete(todayDateKey())) {
        // Today isn't done yet — that's fine, it's not "missed" until
        // the day ends. Start counting from yesterday instead.
        cursor.setDate(cursor.getDate() - 1);
      }

      let streak = 0;
      while (isDayComplete(toDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      setCurrentStreak(streak);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, habits.length, completedCount]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ]
    );
  };

  const totalCount = habits.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Habit",
      "Are you sure you want to delete this habit?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteHabit(id);
          },
        },
      ]
    );
  };

  if (authLoading || !session) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="black" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- Header Section --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, {username} 👋</Text>
            <Text style={styles.subtitleText}>{formatFullDate(new Date())}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setAboutVisible(true)}
              accessibilityLabel="About this app"
            >
              <Text style={styles.infoButtonText}>i</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={handleLogout}
            >
              <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      

        {/* --- Quick Stats Rows (Responsive Side-by-Side) --- */}
        <View style={styles.statsContainer}>
          {/* Weekly Streak Card */}
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={styles.cardLabelText}>Current Streak</Text>
            <Text style={styles.statValueText}>{currentStreak} 🔥</Text>
            <Text style={styles.cardSublabelText}>
              {currentStreak === 1 ? "Day" : "Days"} consistent
            </Text>
          </View>

          {/* Progress Card */}
          <View style={[styles.statCard, styles.progressCard]}>
            <Text style={[styles.cardLabelText, { color: '#FFF' }]}>Today&apos;s Progress</Text>
            <Text style={styles.progressValueText}>{progressPercentage}%</Text>
            {/* Minimal Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={[styles.cardSublabelText, { color: 'rgba(255,255,255,0.8)' }]}>
              {completedCount} of {totalCount} habits done
            </Text>
          </View>
        </View>

        {/* --- Reports Entry Point --- */}
        <TouchableOpacity
          style={styles.reportButton}
          activeOpacity={0.8}
          onPress={() => router.push("/report")}
        >
          <Text style={styles.reportButtonIcon}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportButtonTitle}>Weekly & Monthly Report</Text>
            <Text style={styles.reportButtonSubtitle}>
              See which habits are on track
            </Text>
          </View>
          <Text style={styles.reportButtonArrow}>{"›"}</Text>
        </TouchableOpacity>

        {/* --- Weekly Calendar Strip --- */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitleText}>This Week</Text>
        </View>
        <View style={styles.weekStrip}>
          {weekStrip.map((item) => (
            <View key={item.dateKey} style={[styles.dayColumn, item.isToday && styles.todayColumn]}>
              <Text style={[styles.dayText, item.isToday && styles.todayText]}>{item.day}</Text>
              <View 
                style={[
                  styles.dateCircle, 
                  item.isComplete && styles.dateCircleComplete,
                  item.isToday && !item.isComplete && styles.dateCircleToday
                ]}
              >
                <Text 
                  style={[
                    styles.dateText, 
                    item.isComplete && styles.dateTextComplete,
                    item.isToday && styles.todayDateText
                  ]}
                >
                  {item.date}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* --- Today&apos;s Habits List --- */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitleText}>Today&apos;s Habits</Text>
          <Text style={styles.sectionActionText}>See all</Text>
        </View>

   <View style={styles.habitsContainer}>
  {habitsLoading ? (
    <ActivityIndicator size="small" color="black" style={{ marginTop: 20 }} />
  ) : habits.length === 0 ? (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        No habits yet 🎯
      </Text>

      <Text style={styles.emptySubtitle}>
        Tap + button to add your first habit
      </Text>
    </View>
  ) : (
    habits.map((habit) => (
            <TouchableOpacity 
              key={habit.id} 
              activeOpacity={0.7}
              onPress={() => toggleHabit(habit.id)}
              style={[styles.habitCard, habit.completed && styles.habitCardCompleted]}
            >
              <View style={styles.habitLeftRow}>
                <View style={styles.habitIconContainer}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                </View>
                <View style={styles.habitMeta}>
                  <Text style={[styles.habitTitle, habit.completed && styles.textCrossed]}>
                    {habit.title}
                  </Text>
                  <Text style={styles.habitSubtext}>
                    {habit.time} • {habit.category}
                  </Text>
                </View>
              </View>

              {/* Custom High-Fidelity Checkbox */}
              <View 
                style={[
                  styles.checkbox, 
                  habit.completed && styles.checkboxChecked
                ]}
              >
                {habit.completed && <View style={styles.checkboxInnerCheck} />}
              </View>
       
  <TouchableOpacity
  onPress={() => handleDelete(habit.id)}
  style={styles.deleteButton}
>
  <Text style={styles.deleteText}>🗑️</Text>
</TouchableOpacity>
            </TouchableOpacity>

            
   ))
)}

</View>
      </ScrollView>

      {/* --- Floating Add Habit Button --- */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
      onPress={() => router.push("/add-habit")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* --- About / Help Sheet --- */}
      <Modal
        visible={aboutVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setAboutVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>About HabitTracker</Text>
              <TouchableOpacity
                onPress={() => setAboutVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {ABOUT_SECTIONS.map((section) => (
                <View key={section.title} style={styles.aboutRow}>
                  <View style={styles.aboutIconContainer}>
                    <Text style={styles.aboutIcon}>{section.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutRowTitle}>{section.title}</Text>
                    <Text style={styles.aboutRowDescription}>{section.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Luxury UI Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Off-white modern background
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 100, // Cushion for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  infoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#6366F1',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    width: (width - 52) / 2, // Perfect responsive sizing side-by-side
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    height: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  streakCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressCard: {
    backgroundColor: '#6366F1', // Indigo primary branding
  },
  cardLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 4,
  },
  progressValueText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginVertical: 4,
  },
  cardSublabelText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  reportButtonIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  reportButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  reportButtonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  reportButtonArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  todayColumn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 2,
  },
  dayText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 6,
  },
  todayText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleComplete: {
    backgroundColor: '#10B981', // Aesthetic success emerald green
  },
  dateCircleToday: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dateTextComplete: {
    color: '#FFF',
  },
  todayDateText: {
    color: '#6366F1',
  },
  habitsContainer: {
    gap: 12, // Native item separation spacing layout
  },
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  habitCardCompleted: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.75,
  },
  habitLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  habitIcon: {
    fontSize: 20,
  },
  habitMeta: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  textCrossed: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  habitSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxInnerCheck: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827', // Pitch charcoal black button for premium minimal contrast
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 30,
  },
  deleteButton: {
  marginLeft: 10,
},

deleteText: {
  fontSize: 20,
},
emptyContainer: {
  alignItems: "center",
  paddingVertical: 40,
},

emptyTitle: {
  fontSize: 22,
  fontWeight: "bold",
},

emptySubtitle: {
  marginTop: 10,
  fontSize: 16,
  color: "gray",
  textAlign: "center",
},
modalOverlay: {
  flex: 1,
  justifyContent: 'flex-end',
},
modalBackdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(17, 24, 39, 0.5)',
},
modalSheet: {
  backgroundColor: '#FFF',
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 36,
  maxHeight: '80%',
},
modalHandle: {
  width: 40,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#E5E7EB',
  alignSelf: 'center',
  marginBottom: 16,
},
modalHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
},
modalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#111827',
},
modalCloseButton: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: '#F3F4F6',
  alignItems: 'center',
  justifyContent: 'center',
},
modalCloseText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#374151',
},
aboutRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 20,
},
aboutIconContainer: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: '#F3F4F6',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 14,
},
aboutIcon: {
  fontSize: 18,
},
aboutRowTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 3,
},
aboutRowDescription: {
  fontSize: 13,
  color: '#6B7280',
  lineHeight: 19,
},
});