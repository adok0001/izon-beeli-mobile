import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProgressStore } from "@/store/progress-store";
import { LESSONS, COURSES, formatDuration } from "@/lib/mock-data";

export default function ProgressScreen() {
  const { completedLessonIds, points, streak } = useProgressStore();

  const completedLessons = LESSONS.filter((l) =>
    completedLessonIds.has(l.id)
  );

  const courseProgress = COURSES.map((course) => {
    const courseLessons = LESSONS.filter((l) => l.courseId === course.id);
    const completed = courseLessons.filter((l) =>
      completedLessonIds.has(l.id)
    ).length;
    return { ...course, total: courseLessons.length, completed };
  }).filter((c) => c.completed > 0);

  return (
    <>
      <Stack.Screen options={{ title: "My Progress" }} />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        <FlatList
          data={completedLessons}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Summary stats */}
              <View className="flex-row gap-3 py-5">
                <View className="flex-1 items-center rounded-xl bg-blue-50 py-4 dark:bg-blue-950">
                  <IconSymbol name="star.fill" size={22} color="#3b82f6" />
                  <Text className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">
                    {points}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Total Points
                  </Text>
                </View>
                <View className="flex-1 items-center rounded-xl bg-orange-50 py-4 dark:bg-orange-950">
                  <IconSymbol
                    name="flame.fill"
                    size={22}
                    color="#f59e0b"
                  />
                  <Text className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">
                    {streak}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Day Streak
                  </Text>
                </View>
                <View className="flex-1 items-center rounded-xl bg-green-50 py-4 dark:bg-green-950">
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={22}
                    color="#22c55e"
                  />
                  <Text className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">
                    {completedLessons.length}
                  </Text>
                  <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Lessons
                  </Text>
                </View>
              </View>

              {/* Course breakdown */}
              {courseProgress.length > 0 && (
                <View className="mb-4">
                  <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Course Progress
                  </Text>
                  {courseProgress.map((course) => {
                    const pct =
                      course.total > 0
                        ? (course.completed / course.total) * 100
                        : 0;
                    return (
                      <View
                        key={course.id}
                        className="mb-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800"
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="flex-1 text-base font-semibold text-neutral-900 dark:text-white">
                            {course.title}
                          </Text>
                          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                            {course.completed}/{course.total}
                          </Text>
                        </View>
                        <View className="mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <View
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${pct}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Completed Lessons
              </Text>
            </>
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <IconSymbol name="book.fill" size={40} color="#d1d5db" />
              <Text className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
                No lessons completed yet. Start learning!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color="#22c55e"
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                  {item.title}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.description}
                </Text>
              </View>
              {item.duration && (
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                  {formatDuration(item.duration)}
                </Text>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}
