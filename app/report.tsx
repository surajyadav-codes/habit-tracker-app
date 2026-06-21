import { useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { HabitContext } from "../context/Habitcontext";
import type { ReportItem } from "../context/Habitcontext";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Range = "week" | "month";

function statusFor(rate: number): { label: string; color: string; bg: string } {
  if (rate >= 80) return { label: "On track", color: "#059669", bg: "#ECFDF5" };
  if (rate >= 50) return { label: "Needs attention", color: "#B45309", bg: "#FFFBEB" };
  return { label: "Falling behind", color: "#DC2626", bg: "#FEF2F2" };
}

export default function ReportsScreen() {
  const { habits, fetchReport } = useContext(HabitContext);
  const [range, setRange] = useState<Range>("week");
  const [data, setData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReport(range === "week" ? 7 : 30).then((res) => {
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range, habits.length]);

  const overallRate =
    data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.rate, 0) / data.length)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Habit Report</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, range === "week" && styles.toggleButtonActive]}
          onPress={() => setRange("week")}
        >
          <Text style={[styles.toggleText, range === "week" && styles.toggleTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, range === "month" && styles.toggleButtonActive]}
          onPress={() => setRange("month")}
        >
          <Text style={[styles.toggleText, range === "month" && styles.toggleTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="black" style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No habits to report on yet 📊</Text>
          <Text style={styles.emptySubtitle}>
            Add a habit and start checking it off to see your trends here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Overall completion · {range === "week" ? "last 7 days" : "last 30 days"}
            </Text>
            <Text style={styles.summaryValue}>{overallRate}%</Text>
            <View style={styles.summaryBarBg}>
              <View style={[styles.summaryBarFill, { width: `${overallRate}%` }]} />
            </View>
          </View>

          {data.map((item) => {
            const status = statusFor(item.rate);
            return (
              <View key={item.id} style={styles.habitCard}>
                <View style={styles.habitRow}>
                  <View style={styles.habitIconContainer}>
                    <Text style={styles.habitIcon}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitTitle}>{item.title}</Text>
                    <Text style={styles.habitSubtext}>
                      {item.completedCount} of {item.totalDays} days
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${item.rate}%`, backgroundColor: status.color },
                    ]}
                  />
                </View>
                <Text style={styles.rateText}>{item.rate}% completion</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: "#111827",
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "700",
    marginVertical: 6,
  },
  summaryBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
  },
  summaryBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 3,
  },
  habitCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  habitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 18,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  habitSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  barBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginBottom: 6,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  rateText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});