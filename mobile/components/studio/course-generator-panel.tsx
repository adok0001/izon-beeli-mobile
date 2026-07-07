import { friendlyError } from "@/lib/api";
import type { EducatorCourse, EducatorStubCourseType } from "@/lib/hooks/use-educator-panel";
import { useGenerateEducatorStubs } from "@/lib/hooks/use-educator-panel";
import { getLanguageName } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

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

/** The "Add Courses" action panel — starter-set/one-type stub generation.
 * Shared by the full Courses screen and the Learn dropdown on Studio home. */
export function CourseGeneratorPanel({
  activeLanguageId,
  languageCourses,
  onSuccess,
  onError,
}: Readonly<{
  activeLanguageId: string;
  languageCourses: EducatorCourse[];
  onSuccess: (title: string, body: string) => void;
  onError: (title: string, body: string) => void;
}>) {
  const { t } = useTranslation();
  const [courseActionMode, setCourseActionMode] = useState<CourseActionMode>("generate");
  const [selectedStubType, setSelectedStubType] = useState<EducatorStubCourseType>("first-words");
  const generateStubs = useGenerateEducatorStubs();

  const hasCoursesForLanguage = languageCourses.length > 0;

  const existingStubTypes = useMemo(
    () => new Set(languageCourses.map((c) => c.courseType).filter((v): v is string => !!v)),
    [languageCourses],
  );
  const missingStubTypes = useMemo(
    () => STUB_TYPES.filter((s) => !existingStubTypes.has(s.value)),
    [existingStubTypes],
  );

  const effectiveStubType = missingStubTypes.some((s) => s.value === selectedStubType)
    ? selectedStubType
    : (missingStubTypes[0]?.value ?? "first-words");

  const effectiveStubLabel =
    STUB_TYPES.find((s) => s.value === effectiveStubType)?.label ?? effectiveStubType;

  const runCourseAction = () => {
    if (courseActionMode === "new" && hasCoursesForLanguage) {
      onError("Already seeded", "Courses exist for this language. Use Generate to add specific types.");
      return;
    }
    if (courseActionMode === "generate" && missingStubTypes.length === 0) {
      onError("Nothing to generate", "All course types already exist for this language.");
      return;
    }

    const payload =
      courseActionMode === "new"
        ? { languageId: activeLanguageId }
        : { languageId: activeLanguageId, courseType: effectiveStubType };

    generateStubs.mutate(payload, {
      onSuccess: (result) => {
        onSuccess(
          courseActionMode === "new" ? "Starter set created" : "Course generated",
          `Created ${result.courses} course(s) and ${result.lessons} lesson(s).`,
        );
      },
      onError: (error: Error) => onError("Action failed", friendlyError(error)),
    });
  };

  const generateLabel =
    courseActionMode === "new" ? "Create Starter Set" : `Generate "${effectiveStubLabel}"`;
  const actionButtonLabel = generateStubs.isPending ? t("common.loading") : generateLabel;

  return (
    <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
        Add Courses
      </Text>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
        disabled={generateStubs.isPending || (courseActionMode === "generate" && missingStubTypes.length === 0)}
        className="mt-4 rounded-xl bg-fuchsia-600 py-3 active:opacity-80 disabled:opacity-50"
      >
        <Text className="text-center text-sm font-semibold text-white">{actionButtonLabel}</Text>
      </Pressable>
    </View>
  );
}
