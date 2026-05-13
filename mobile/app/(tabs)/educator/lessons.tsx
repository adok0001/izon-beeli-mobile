import { IconSymbol } from "@/components/ui/icon-symbol";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
    EducatorLesson,
    useEducatorCourses,
    useEducatorLessons,
} from "@/lib/hooks/use-educator-panel";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function LessonRow({
  lesson,
  onPress,
}: Readonly<{ lesson: EducatorLesson; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
        <IconSymbol name="waveform" size={18} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-neutral-900 dark:text-white">{lesson.title}</Text>
        {lesson.description ? (
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {lesson.description}
          </Text>
        ) : null}
        <View className="mt-1.5 flex-row gap-2">
          {lesson.type ? (
            <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">{lesson.type}</Text>
            </View>
          ) : null}
          {lesson.audioUrl ? (
            <View className="rounded-full bg-blue-50 px-2 py-0.5 dark:bg-blue-950/30">
              <Text className="text-xs font-semibold text-blue-500">Audio</Text>
            </View>
          ) : null}
          {lesson.isActive === false ? (
            <View className="rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-950/30">
              <Text className="text-xs font-semibold text-amber-600">Draft</Text>
            </View>
          ) : null}
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
    </Pressable>
  );
}

export default function EducatorLessonsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data: currentUser } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const { data: courses = [] } = useEducatorCourses(canAccess);
  const { data: lessons = [] } = useEducatorLessons(canAccess);

  const course = courses.find((c) => c.id === courseId);
  const courseLessons = lessons.filter((l) => l.courseId === courseId);

  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: "Lessons" }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("review.adminRequired")}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: course?.title ?? "Lessons", headerBackTitle: "Courses" }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-4">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
              {course?.title ?? "Lessons"}
            </Text>
            {course?.description ? (
              <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {course.description}
              </Text>
            ) : null}
            {course?.courseType ? (
              <View className="mt-2 self-start rounded-full bg-neutral-100 px-2.5 py-0.5 dark:bg-neutral-800">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {course.courseType}
                </Text>
              </View>
            ) : null}
          </View>

          {/* New Lesson CTA */}
          <View className="mt-4 px-5">
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/educator/lesson-edit",
                  params: { courseId: courseId ?? "" },
                })
              }
              className="flex-row items-center justify-center rounded-2xl bg-blue-500 py-3.5 active:opacity-80"
            >
              <IconSymbol name="plus" size={16} color="#ffffff" />
              <Text className="ml-2 text-sm font-semibold text-white">New Lesson</Text>
            </Pressable>
          </View>

          {/* Lesson List */}
          <View className="mt-5 px-5">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
              Lessons ({courseLessons.length})
            </Text>
            {courseLessons.length > 0 ? (
              <View className="gap-2">
                {courseLessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onPress={() =>
                      router.push({
                        pathname: "/educator/lesson-edit",
                        params: { lessonId: lesson.id, courseId: lesson.courseId },
                      })
                    }
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-2xl bg-neutral-50 px-4 py-6 dark:bg-neutral-800">
                <Text className="text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  No lessons yet in this course.
                </Text>
                <Text className="mt-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  Tap "New Lesson" above to add the first one.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
