import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { XpLevelBadge } from "@/components/xp-level-badge";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useWeeklyStats, useStreakCalendar } from "@/lib/hooks/use-dashboard";
import { useChallengeHistory } from "@/lib/hooks/use-daily-challenge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { DayActivity } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY = new Date().toISOString().slice(0, 10);

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function WeeklyBar({ day }: { day: DayActivity }) {
  const total = day.lessonsCompleted + day.wordsReviewed;
  const maxHeight = 64;
  const lessonH = total > 0 ? Math.max(4, Math.round((day.lessonsCompleted / Math.max(total, 5)) * maxHeight)) : 0;
  const wordH = total > 0 ? Math.max(4, Math.round((day.wordsReviewed / Math.max(total, 5)) * maxHeight)) : 0;
  const isToday = day.date === TODAY;

  return (
    <View className="flex-1 items-center">
      <View className="items-center justify-end" style={{ height: maxHeight }}>
        {wordH > 0 && (
          <View
            className="w-6 rounded-t bg-violet-400"
            style={{ height: wordH, marginBottom: lessonH > 0 ? 1 : 0 }}
          />
        )}
        {lessonH > 0 && (
          <View className="w-6 rounded-t bg-blue-500" style={{ height: lessonH }} />
        )}
        {total === 0 && (
          <View className="w-6 rounded bg-neutral-200 dark:bg-neutral-700" style={{ height: 4 }} />
        )}
      </View>
      <Text
        className={`mt-1 text-xs ${isToday ? "font-bold text-blue-500" : "text-neutral-400 dark:text-neutral-500"}`}
      >
        {getDayLabel(day.date)}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { data: summary } = useProgressSummary();
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { data: calendar, isLoading: calendarLoading } = useStreakCalendar();
  const { data: history = [] } = useChallengeHistory();

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
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <ScrollView
          contentContainerClassName="px-5 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* XP / Level */}
          <View className="mb-6 items-center rounded-2xl bg-neutral-50 py-6 dark:bg-neutral-800">
            <XpLevelBadge points={summary?.points ?? 0} variant="full" />
          </View>

          {/* Weekly Activity */}
          <Text className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
            This Week
          </Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : weeklyStats ? (
            <>
              <View className="mb-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <View className="flex-row items-end gap-1">
                  {weeklyStats.weeklyActivity.map((day) => (
                    <WeeklyBar key={day.date} day={day} />
                  ))}
                </View>
                <View className="mt-3 flex-row gap-4">
                  <View className="flex-row items-center gap-1">
                    <View className="h-3 w-3 rounded-sm bg-blue-500" />
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">Lessons</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View className="h-3 w-3 rounded-sm bg-violet-400" />
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">Words</Text>
                  </View>
                </View>
              </View>

              {/* Stats Summary */}
              <View className="mb-6 flex-row gap-3">
                <View className="flex-1 items-center rounded-xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                    {weeklyStats.totalLessonsThisWeek}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Lessons
                  </Text>
                </View>
                <View className="flex-1 items-center rounded-xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                    {weeklyStats.avgQuizAccuracyThisWeek != null
                      ? `${weeklyStats.avgQuizAccuracyThisWeek}%`
                      : "—"}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Avg Quiz
                  </Text>
                </View>
                <View className="flex-1 items-center rounded-xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Text className="text-xl font-bold text-neutral-900 dark:text-white">
                    {weeklyStats.totalWordsReviewedThisWeek}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Words
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Streak Calendar */}
          <Text className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
            30-Day Activity
          </Text>
          <View className="mb-6 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
            {calendarLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <View className="flex-row flex-wrap gap-1">
                {calendarDays.map((date) => (
                  <View
                    key={date}
                    className={`h-7 w-7 rounded-full ${
                      activeDaysSet.has(date)
                        ? "bg-blue-500"
                        : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Challenge History */}
          {history.length > 0 && (
            <>
              <Text className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
                Recent Challenges
              </Text>
              <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800">
                {history.map((c, i) => (
                  <View
                    key={c.id}
                    className={`flex-row items-center px-4 py-3 ${
                      i < history.length - 1
                        ? "border-b border-neutral-200 dark:border-neutral-700"
                        : ""
                    }`}
                  >
                    <IconSymbol
                      name={c.completed ? "checkmark.circle.fill" : "circle"}
                      size={20}
                      color={c.completed ? "#22c55e" : "#9ca3af"}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {c.title}
                      </Text>
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                        {c.date}
                      </Text>
                    </View>
                    {c.completed && (
                      <Text className="text-xs font-semibold text-green-500">
                        +{c.xpReward} XP
                      </Text>
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
