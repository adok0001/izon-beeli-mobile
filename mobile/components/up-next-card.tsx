import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNextLesson } from "@/lib/hooks/use-next-lesson";
import { localizeField } from "@/lib/localize";
import { formatDuration } from "@/lib/mock-data";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

export function UpNextCard({ languageId }: { languageId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const { data, isLoading } = useNextLesson(languageId);

  if (isLoading || !data?.lesson || !data?.course) return null;

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
            {t("learn.yourPath")} · {localizeField(course.title, course.titleFr, uiLanguage)}
          </Text>
          <Text className="text-xs font-semibold text-blue-500">
            {t("learn.lessonsCount", { done: overallProgress.completed, total: overallProgress.total })}
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
            {t("learn.upNext")}
          </Text>
          <Text
            className="text-base font-bold text-neutral-900 dark:text-white"
            numberOfLines={1}
          >
            {localizeField(lesson.title, lesson.titleFr, uiLanguage)}
          </Text>
          <Text
            className="text-sm text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {localizeField(lesson.description, lesson.descriptionFr, uiLanguage)}
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
