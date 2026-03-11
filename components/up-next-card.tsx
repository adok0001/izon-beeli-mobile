import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNextLesson } from "@/lib/hooks/use-next-lesson";
import { formatDuration } from "@/lib/mock-data";

export function UpNextCard() {
  const router = useRouter();
  const { data, isLoading } = useNextLesson();

  if (isLoading || !data?.lesson) return null;

  const { lesson, course, overallProgress } = data;
  const progressPct =
    overallProgress.total > 0
      ? Math.round((overallProgress.completed / overallProgress.total) * 100)
      : 0;

  return (
    <Pressable
      onPress={() => router.push(`/lesson/${lesson.id}`)}
      className="mb-3 rounded-2xl bg-blue-50 p-4 active:opacity-70 dark:bg-blue-950"
    >
      {/* Path progress */}
      <View className="mb-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Your Path · {course?.title}
          </Text>
          <Text className="text-xs font-semibold text-blue-500">
            {overallProgress.completed}/{overallProgress.total} lessons
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
          <View
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${progressPct}%` }}
          />
        </View>
      </View>

      {/* Lesson row */}
      <View className="flex-row items-center">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
          <IconSymbol name="play.fill" size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Up Next
          </Text>
          <Text
            className="text-base font-bold text-neutral-900 dark:text-white"
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
          <Text
            className="text-sm text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {lesson.description}
          </Text>
        </View>
        <View className="ml-2 items-end gap-1">
          {lesson.duration ? (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              {formatDuration(lesson.duration)}
            </Text>
          ) : null}
          <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
        </View>
      </View>
    </Pressable>
  );
}
