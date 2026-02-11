import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePickerButton } from "@/components/language-picker";
import { useLanguageStore } from "@/store/language-store";
import { useProgressStore } from "@/store/progress-store";
import {
  getCoursesByLanguage,
  getLessonsByCourse,
  formatDuration,
} from "@/lib/mock-data";
import type { Course, Lesson } from "@/types";

function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const { isCompleted } = useProgressStore();
  const lessons = getLessonsByCourse(course.id);
  const completedCount = lessons.filter((l) => isCompleted(l.id)).length;
  const progressPercent =
    lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <View className="mb-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900">
          <Text className="text-xs font-semibold capitalize text-blue-700 dark:text-blue-300">
            {course.level}
          </Text>
        </View>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {completedCount}/{lessons.length} lessons
        </Text>
      </View>

      <Text className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">
        {course.title}
      </Text>
      <Text className="mb-3 text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={2}>
        {course.description}
      </Text>

      {progressPercent > 0 && (
        <View className="mb-3">
          <View className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}

      {lessons.map((lesson) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          onPress={() => router.push(`/lesson/${lesson.id}`)}
        />
      ))}
    </View>
  );
}

function LessonRow({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  const { isCompleted } = useProgressStore();
  const completed = isCompleted(lesson.id);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-t border-neutral-200 py-3 active:opacity-70 dark:border-neutral-700"
    >
      <IconSymbol
        name={completed ? "checkmark.circle.fill" : "circle"}
        size={20}
        color={completed ? "#22c55e" : "#9ca3af"}
      />
      <View className="ml-3 flex-1">
        <Text
          className="text-sm font-medium text-neutral-900 dark:text-white"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
          {lesson.description}
        </Text>
      </View>
      {lesson.duration && (
        <Text className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
          {formatDuration(lesson.duration)}
        </Text>
      )}
      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
    </Pressable>
  );
}

export default function LearnScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const courses = getCoursesByLanguage(selectedLanguageId);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View>
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Learn
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Pick a language and start learning
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/dictionary")}
            className="h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"
          >
            <IconSymbol name="character.book.closed" size={20} color="#f59e0b" />
          </Pressable>
          <LanguagePickerButton />
        </View>
      </View>

      {courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconSymbol name="book.fill" size={48} color="#d1d5db" />
          <Text className="mt-4 text-center text-base text-neutral-400 dark:text-neutral-500">
            No courses available for this language yet. Check back soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8 pt-2"
          renderItem={({ item }) => <CourseCard course={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
