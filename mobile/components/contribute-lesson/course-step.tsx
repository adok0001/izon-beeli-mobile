import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Course } from "./types";

type CourseStepProps = Readonly<{
  courses: Course[];
  loadingCourses: boolean;
  selectedCourse: string | null;
  onSelectCourse: (courseId: string | null) => void;
}>;

export function CourseStep({
  courses,
  loadingCourses,
  selectedCourse,
  onSelectCourse,
}: CourseStepProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
        {t("contribute.assignCourse")}
      </Text>
      <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
        {t("contribute.assignCourseDesc")}
      </Text>

      {loadingCourses ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={getAccent("blue").solid} />
          <Text className="mt-3 text-sm text-neutral-400">{t("contribute.loadingCourses")}</Text>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => onSelectCourse(null)}
            className={`mb-2.5 flex-row items-center rounded-2xl p-4 ${
              selectedCourse === null
                ? "bg-blue-50 dark:bg-blue-950"
                : "bg-neutral-50 dark:bg-neutral-800"
            }`}
          >
            <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
              selectedCourse === null ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
            }`}>
              <IconSymbol name="tray.fill" size={16} color={selectedCourse === null ? M.parchment : M.muted} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {t("contribute.unsorted")}
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("contribute.unsortedDesc")}
              </Text>
            </View>
            {selectedCourse === null && (
              <IconSymbol name="checkmark.circle.fill" size={22} color={getAccent("blue").solid} />
            )}
          </Pressable>

          {courses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => onSelectCourse(course.id)}
              className={`mb-2.5 flex-row items-center rounded-2xl p-4 ${
                selectedCourse === course.id
                  ? "bg-blue-50 dark:bg-blue-950"
                  : "bg-neutral-50 dark:bg-neutral-800"
              }`}
            >
              <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
                selectedCourse === course.id ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
              }`}>
                <IconSymbol name="book.fill" size={16} color={selectedCourse === course.id ? M.parchment : M.muted} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                  {course.title}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {course.level}
                </Text>
              </View>
              {selectedCourse === course.id && (
                <IconSymbol name="checkmark.circle.fill" size={22} color={getAccent("blue").solid} />
              )}
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}
