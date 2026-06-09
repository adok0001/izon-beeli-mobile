import { LanguagePickerModal } from "@/components/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
    EducatorCourse,
    EducatorStubCourseType,
    useEducatorCourses,
    useGenerateEducatorStubs,
    useToggleCourseActive,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getLanguageName } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CourseActionMode = "new" | "generate";

const STUB_TYPES: { value: EducatorStubCourseType; label: string }[] = [
  { value: "first-words", label: "First Words" },
  { value: "sound-script", label: "Sound & Script" },
  { value: "numbers-trade", label: "Numbers & Trade" },
  { value: "daily-life", label: "Daily Life" },
  { value: "verbs-grammar", label: "Verbs & Grammar" },
  { value: "culture-proverbs", label: "Culture & Proverbs" },
  { value: "songs-stories", label: "Songs & Stories" },
  { value: "market-travel", label: "Market & Travel" },
  { value: "community-ceremony", label: "Community & Ceremony" },
  { value: "children-home", label: "Children & Home" },
  { value: "pro-level", label: "Pro Level" },
  { value: "special-topic", label: "Special Topic" },
];

function CourseCard({
  course,
  onPress,
  onToggleActive,
  toggling,
}: Readonly<{
  course: EducatorCourse;
  onPress: () => void;
  onToggleActive: () => void;
  toggling: boolean;
}>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-neutral-200 bg-white p-4 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">{course.title}</Text>
          {course.description ? (
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
              {course.description}
            </Text>
          ) : null}
          {course.courseType ? (
            <View className="mt-2 self-start rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">{course.courseType}</Text>
            </View>
          ) : null}
        </View>
        <View className="ml-3 flex-row items-center gap-1">
          <Text className="text-xs font-semibold text-blue-500">Open</Text>
          <IconSymbol name="chevron.right" size={14} color={getAccent("blue").solid} />
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-700/60">
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleActive(); }}
          disabled={toggling}
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
            course.isActive !== false
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-neutral-100 dark:bg-neutral-800"
          }`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol
            name={course.isActive !== false ? "eye" : "eye.slash"}
            size={12}
            color={course.isActive !== false ? getAccent("teal").solid : M.muted}
          />
          <Text
            className={`text-xs font-semibold ${
              course.isActive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {toggling ? "…" : course.isActive !== false ? "Active" : "Inactive"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function EducatorCoursesScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const [selectedLanguageId, setSelectedLanguageId] = useState<string | undefined>(undefined);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [courseActionMode, setCourseActionMode] = useState<CourseActionMode>("generate");
  const [selectedStubType, setSelectedStubType] = useState<EducatorStubCourseType>("first-words");

  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const { data: courses = [] } = useEducatorCourses(canAccess);
  const generateStubs = useGenerateEducatorStubs();
  const toggleCourse = useToggleCourseActive();

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    if (currentUser.isAdmin) return Array.from(new Set(courses.map((c) => c.languageId)));
    return currentUser.reviewerLanguages;
  }, [currentUser, courses]);

  const activeLanguageId =
    selectedLanguageId ?? allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const languageCourses = courses.filter((c) => c.languageId === activeLanguageId);
  const hasCoursesForLanguage = languageCourses.length > 0;

  const existingStubTypes = useMemo(
    () => new Set(languageCourses.map((c) => c.courseType).filter((v): v is string => !!v)),
    [languageCourses],
  );
  const missingStubTypes = useMemo(
    () => STUB_TYPES.filter((s) => !existingStubTypes.has(s.value)),
    [existingStubTypes],
  );

  // Derive the effective stub type without a useEffect
  const effectiveStubType = missingStubTypes.some((s) => s.value === selectedStubType)
    ? selectedStubType
    : (missingStubTypes[0]?.value ?? "first-words");

  const effectiveStubLabel =
    STUB_TYPES.find((s) => s.value === effectiveStubType)?.label ?? effectiveStubType;

  const runCourseAction = () => {
    if (courseActionMode === "new" && hasCoursesForLanguage) {
      toastError(
        "Already seeded",
        "Courses exist for this language. Use Generate to add specific types.",
      );
      return;
    }
    if (courseActionMode === "generate" && missingStubTypes.length === 0) {
      toastError("Nothing to generate", "All course types already exist for this language.");
      return;
    }

    const payload =
      courseActionMode === "new"
        ? { languageId: activeLanguageId }
        : { languageId: activeLanguageId, courseType: effectiveStubType };

    generateStubs.mutate(payload, {
      onSuccess: (result) => {
        toastSuccess(
          courseActionMode === "new" ? "Starter set created" : "Course generated",
          `Created ${result.courses} course(s) and ${result.lessons} lesson(s).`,
        );
      },
      onError: (error: Error) => toastError("Action failed", friendlyError(error)),
    });
  };

  const generateLabel =
    courseActionMode === "new" ? "Create Starter Set" : `Generate "${effectiveStubLabel}"`;
  const actionButtonLabel = generateStubs.isPending ? t("common.loading") : generateLabel;

  if (!canAccess) {
    return (
      <>
        <Stack.Screen options={{ title: "Courses" }} />
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
      <Stack.Screen options={{ title: "Courses", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-4">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Courses</Text>
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Select a language, manage its courses, then add lessons.
            </Text>
          </View>

          {/* Language Picker */}
          <View className="mt-4 px-5">
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
              Language
            </Text>
            <Pressable
              onPress={() => setLanguagePickerVisible(true)}
              className="flex-row items-center justify-between rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 dark:border-neutral-600 dark:bg-neutral-800"
            >
              <View className="flex-row items-center">
                <IconSymbol name="book.fill" size={16} color={getAccent("blue").solid} />
                <Text className="ml-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {getLanguageName(activeLanguageId)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                  {languageCourses.length} course{languageCourses.length === 1 ? "" : "s"}
                </Text>
                <IconSymbol name="chevron.right" size={14} color={M.muted} />
              </View>
            </Pressable>
          </View>

          {/* Course List */}
          <View className="mt-5 px-5">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
              Courses ({languageCourses.length})
            </Text>
            {languageCourses.length > 0 ? (
              <View className="gap-2">
                {languageCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onPress={() =>
                      router.push({
                        pathname: "/educator/lessons",
                        params: { courseId: course.id },
                      })
                    }
                    onToggleActive={() =>
                      toggleCourse.mutate(
                        { id: course.id, isActive: course.isActive === false },
                        {
                          onSuccess: () =>
                            toastSuccess(
                              course.isActive !== false ? "Course hidden" : "Course published",
                              course.title,
                            ),
                          onError: (err: Error) => toastError("Failed", err.message),
                        },
                      )
                    }
                    toggling={toggleCourse.isPending && toggleCourse.variables?.id === course.id}
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-2xl bg-neutral-50 px-4 py-6 dark:bg-neutral-800">
                <Text className="text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  No courses yet for {getLanguageName(activeLanguageId)}.
                </Text>
                <Text className="mt-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  Use the actions below to generate a starter set.
                </Text>
              </View>
            )}
          </View>

          {/* Course Actions */}
          <View className="mt-5 px-5">
            <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                Add Courses
              </Text>

              {/* Mode switcher */}
              <View className="mt-3 flex-row rounded-xl bg-neutral-100 p-1 dark:bg-neutral-700">
                {(["new", "generate"] as CourseActionMode[]).map((mode) => {
                  const active = courseActionMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setCourseActionMode(mode)}
                      className={`flex-1 rounded-lg px-3 py-2 ${active ? "bg-white dark:bg-neutral-600" : "bg-transparent"}`}
                    >
                      <Text
                        className={`text-center text-xs font-semibold ${active ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}
                      >
                        {mode === "new" ? "Starter Set" : "One Type"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {courseActionMode === "new" ? (
                <View className="mt-3">
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    Seeds all {STUB_TYPES.length} recommended course types with lesson stubs for{" "}
                    <Text className="font-semibold">{getLanguageName(activeLanguageId)}</Text>.
                  </Text>
                  {hasCoursesForLanguage ? (
                    <View className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30">
                      <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Courses already exist. Only missing types will be added.
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="mt-3">
                  <Text className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Choose which course type to generate:
                  </Text>
                  {missingStubTypes.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {missingStubTypes.map((stubType) => {
                        const active = effectiveStubType === stubType.value;
                        return (
                          <Pressable
                            key={stubType.value}
                            onPress={() => setSelectedStubType(stubType.value)}
                            className={`rounded-full border px-3 py-1.5 ${active ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30" : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900"}`}
                          >
                            <Text
                              className={`text-xs font-semibold ${active ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-neutral-600 dark:text-neutral-300"}`}
                            >
                              {stubType.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <View className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                      <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        All course types already exist for this language.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Pressable
                onPress={runCourseAction}
                disabled={
                  generateStubs.isPending ||
                  (courseActionMode === "generate" && missingStubTypes.length === 0)
                }
                className="mt-4 rounded-xl bg-fuchsia-600 py-3 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-center text-sm font-semibold text-white">
                  {actionButtonLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <LanguagePickerModal
          visible={languagePickerVisible}
          selectedId={activeLanguageId}
          allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
          onSelect={(languageId) => {
            setSelectedLanguageId(languageId);
            setLanguagePickerVisible(false);
          }}
          onClose={() => setLanguagePickerVisible(false)}
        />
      </SafeAreaView>
    </>
  );
}
