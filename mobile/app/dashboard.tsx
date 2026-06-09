import { IconSymbol } from "@/components/ui/icon-symbol";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { useChallengeHistory } from "@/lib/hooks/use-daily-challenge";
import { useStreakCalendar, useWeeklyStats } from "@/lib/hooks/use-dashboard";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { DayActivity } from "@/types";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = new Date().toISOString().slice(0, 10);

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function WeeklyBar({ day }: { day: DayActivity }) {
  const M = useMuseumTheme();
  const total = day.lessonsCompleted + day.wordsReviewed;
  const maxHeight = 64;
  const lessonH = total > 0 ? Math.max(4, Math.round((day.lessonsCompleted / Math.max(total, 5)) * maxHeight)) : 0;
  const wordH = total > 0 ? Math.max(4, Math.round((day.wordsReviewed / Math.max(total, 5)) * maxHeight)) : 0;
  const isToday = day.date === TODAY;

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View style={{ alignItems: "center", justifyContent: "flex-end", height: maxHeight }}>
        {wordH > 0 && (
          <View style={{ width: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: "#a78bfa", height: wordH, marginBottom: lessonH > 0 ? 1 : 0 }} />
        )}
        {lessonH > 0 && (
          <View style={{ width: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: M.accent, height: lessonH }} />
        )}
        {total === 0 && (
          <View style={{ width: 24, borderRadius: 4, backgroundColor: M.border, height: 4 }} />
        )}
      </View>
      <Text style={{ marginTop: 4, fontSize: 12, fontWeight: isToday ? "700" : "400", color: isToday ? M.accent : M.muted }}>
        {getDayLabel(day.date)}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const M = useMuseumTheme();
  const { data: summary } = useProgressSummary();
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { data: calendar, isLoading: calendarLoading } = useStreakCalendar();
  const { data: history = [] } = useChallengeHistory();
  const { t } = useTranslation();

  // Build 30-day grid
  const calendarDays: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    calendarDays.push(d.toISOString().slice(0, 10));
  }
  const activeDaysSet = new Set(calendar?.activeDays ?? []);

  return (
    <>
      <Stack.Screen options={{ title: "Progress", headerBackTitle: "Back" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* XP / Level */}
          <View style={{ marginBottom: 24, alignItems: "center", borderRadius: 16, backgroundColor: M.card, paddingVertical: 24, borderWidth: 1, borderColor: M.border }}>
            <XpLevelBadge points={summary?.points ?? 0} variant="full" />
          </View>

          {/* Weekly Activity */}
          <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: M.text }}>
            {t("dashboard.thisWeek")}
          </Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color={M.accent} />
          ) : weeklyStats ? (
            <>
              <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                  {weeklyStats.weeklyActivity.map((day) => (
                    <WeeklyBar key={day.date} day={day} />
                  ))}
                </View>
                <View style={{ marginTop: 12, flexDirection: "row", gap: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: M.accent }} />
                    <Text style={{ fontSize: 12, color: M.sub }}>{t("dashboard.lessonsLabel")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: "#a78bfa" }} />
                    <Text style={{ fontSize: 12, color: M.sub }}>{t("dashboard.wordsLabel")}</Text>
                  </View>
                </View>
              </View>

              <View style={{ marginBottom: 24, flexDirection: "row", gap: 12 }}>
                {[
                  { value: weeklyStats.totalLessonsThisWeek, label: t("dashboard.lessonsLabel") },
                  { value: weeklyStats.avgQuizAccuracyThisWeek != null ? `${weeklyStats.avgQuizAccuracyThisWeek}%` : "—", label: t("dashboard.avgQuizShort") },
                  { value: weeklyStats.totalWordsReviewedThisWeek, label: t("dashboard.wordsLabel") },
                ].map((item, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center", borderRadius: 12, backgroundColor: M.card, paddingVertical: 12, borderWidth: 1, borderColor: M.border }}>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: M.text }}>{item.value}</Text>
                    <Text style={{ marginTop: 2, fontSize: 11, color: M.sub }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Streak Calendar */}
          <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>
              {t("dashboard.thirtyDayActivity")}
            </Text>
            <Text style={{ fontSize: 13, color: M.sub }}>
              {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </Text>
          </View>
          <View style={{ marginBottom: 24, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border }}>
            {calendarLoading ? (
              <ActivityIndicator size="small" color={M.accent} />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {calendarDays.map((date) => {
                  const isToday = date === TODAY;
                  const isActive = activeDaysSet.has(date);
                  return (
                    <View
                      key={date}
                      style={{
                        height: 28, width: 28, borderRadius: 14,
                        backgroundColor: isActive ? M.accent : M.border,
                        borderWidth: isToday ? 2 : 0,
                        borderColor: M.accent,
                      }}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Challenge History */}
          {history.length > 0 && (
            <>
              <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: "700", color: M.text }}>
                {t("dashboard.recentChallenges")}
              </Text>
              <View style={{ borderRadius: 16, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, overflow: "hidden" }}>
                {history.map((c, i) => (
                  <View
                    key={c.id}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: M.border }}
                  >
                    <IconSymbol
                      name={c.completed ? "checkmark.circle.fill" : "circle"}
                      size={20}
                      color={c.completed ? M.success : M.muted}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: M.text }}>{c.title}</Text>
                      <Text style={{ fontSize: 11, color: M.muted }}>{c.date}</Text>
                    </View>
                    {c.completed && (
                      <Text style={{ fontSize: 11, fontWeight: "600", color: M.success }}>+{c.xpReward} XP</Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
