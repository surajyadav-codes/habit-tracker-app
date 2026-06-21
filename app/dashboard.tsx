import { Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import React, { useContext, useEffect } from "react";
import { HabitContext } from "../context/Habitcontext";
import { SafeAreaView } from "react-native-safe-area-context";
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
  isComplete: boolean;
  isToday?: boolean;
}

// --- Mock Data (weekly strip is still illustrative; not stored yet) ---
const WEEKLY_STREAK: DayStreak[] = [
  { day: 'Mon', date: 12, isComplete: true },
  { day: 'Tue', date: 13, isComplete: true },
  { day: 'Wed', date: 14, isComplete: true },
  { day: 'Thu', date: 15, isComplete: true },
  { day: 'Fri', date: 16, isComplete: false, isToday: true },
  { day: 'Sat', date: 17, isComplete: false },
  { day: 'Sun', date: 18, isComplete: false },
];

const { width } = Dimensions.get('window');


export default function DashboardScreen() {
  const {
    session,
    authLoading,
    habits,
    habitsLoading,
    toggleHabit,
    deleteHabit,
    signOut,
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

  // Calculate dynamic progress
  const completedCount = habits.filter((h) => h.completed).length;
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
            <Text style={styles.subtitleText}>Let&apos;s smash your goals today</Text>
          </View>
      <TouchableOpacity
  style={styles.profileAvatar}
  onPress={handleLogout}
>
  <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
</TouchableOpacity>
          </View>
      

        {/* --- Quick Stats Rows (Responsive Side-by-Side) --- */}
        <View style={styles.statsContainer}>
          {/* Weekly Streak Card */}
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={styles.cardLabelText}>Current Streak</Text>
            <Text style={styles.statValueText}>12 🔥</Text>
            <Text style={styles.cardSublabelText}>Days consistent</Text>
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
          {WEEKLY_STREAK.map((item, index) => (
            <View key={index} style={[styles.dayColumn, item.isToday && styles.todayColumn]}>
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
});