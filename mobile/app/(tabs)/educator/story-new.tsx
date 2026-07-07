import { LanguagePickerModal } from "@/components/language-picker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import {
  useCreateStoryArc,
  useEducatorCourses,
  useEducatorStoryArcs,
} from "@/lib/hooks/use-educator-panel";
import { getLanguageName } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StoryNewScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser, canAccess } = useStudioAccess();

  const { data: arcs = [] } = useEducatorStoryArcs(canAccess);
  const { data: courses = [], isLoading: coursesLoading } = useEducatorCourses(canAccess);
  const createArc = useCreateStoryArc();

  const allowedLanguages = useMemo(() => {
    if (!currentUser) return [] as string[];
    if (currentUser.isAdmin) return Array.from(new Set(courses.map((c) => c.languageId)));
    return currentUser.reviewerLanguages ?? [];
  }, [currentUser, courses]);

  const defaultLanguage =
    allowedLanguages[0] ?? currentUser?.selectedLanguageId ?? "izon";

  const [languageId, setLanguageId] = useState(defaultLanguage);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const arcCourseIds = useMemo(() => new Set(arcs.map((a) => a.courseId)), [arcs]);

  const languageCourses = useMemo(
    () => courses.filter((c) => c.languageId === languageId && !arcCourseIds.has(c.id)),
    [courses, languageId, arcCourseIds]
  );

  // Reset course selection when language changes
  const handleLanguageSelect = (id: string) => {
    setLanguageId(id);
    setCourseId("");
    setLanguagePickerVisible(false);
  };

  const handleCreate = async () => {
    if (!courseId) { setError(t("educator.story.errorSelectCourse")); return; }
    if (!title.trim()) { setError(t("educator.story.errorTitleRequired")); return; }
    if (!description.trim()) { setError(t("educator.story.errorDescriptionRequired")); return; }
    setError("");
    try {
      await createArc.mutateAsync({ courseId, title: title.trim(), description: description.trim() });
      router.back();
    } catch (e) {
      setError(friendlyError(e as Error));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("educator.story.newArcTitle"),
          headerBackTitle: t("educator.story.newArcBackTitle"),
          headerRight: () => (
            <Pressable onPress={handleCreate} disabled={createArc.isPending} className="mr-2">
              <Text
                className={`text-base font-semibold ${
                  createArc.isPending ? "text-neutral-400" : "text-amber-500"
                }`}
              >
                {createArc.isPending ? t("educator.story.creating") : t("educator.story.saveHeader")}
              </Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-5 pt-4">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                {t("educator.story.newArcTitle")}
              </Text>
              <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {t("educator.story.newArcSubtitle")}
              </Text>
            </View>

            {error ? (
              <View className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            ) : null}

            {/* Language */}
            <View className="mt-5 px-5">
              <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                {t("educator.story.labelLanguage")}
              </Text>
              <Pressable
                onPress={() => setLanguagePickerVisible(true)}
                className="flex-row items-center justify-between rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 dark:border-neutral-600 dark:bg-neutral-800"
              >
                <View className="flex-row items-center">
                  <IconSymbol name="globe" size={16} color={getAccent("amber").solid} />
                  <Text className="ml-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {getLanguageName(languageId)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    {t("educator.story.coursesAvailable", { count: languageCourses.length })}
                  </Text>
                  <IconSymbol name="chevron.right" size={14} color={M.muted} />
                </View>
              </Pressable>
            </View>

            {/* Course */}
            <View className="mt-5 px-5">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                {t("educator.story.labelCourse")}
              </Text>
              {coursesLoading ? (
                <Text className="text-sm text-neutral-400">{t("educator.story.loading")}</Text>
              ) : languageCourses.length === 0 ? (
                <View className="rounded-xl bg-neutral-50 px-4 py-4 dark:bg-neutral-800">
                  <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {t("educator.story.allCoursesHaveArc", { language: getLanguageName(languageId) })}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {languageCourses.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCourseId(c.id)}
                      className={`rounded-xl border p-3 ${
                        courseId === c.id
                          ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20"
                          : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <IconSymbol
                          name={courseId === c.id ? "checkmark.circle.fill" : "circle"}
                          size={18}
                          color={courseId === c.id ? getAccent("amber").solid : M.border}
                        />
                        <View className="ml-2.5 flex-1">
                          <Text
                            className={`text-sm font-semibold ${
                              courseId === c.id
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {c.title}
                          </Text>
                          {c.description ? (
                            <Text className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
                              {c.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Title */}
            <View className="mt-5 px-5">
              <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                {t("educator.story.labelTitle")}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t("educator.story.titlePlaceholder")}
                returnKeyType="next"
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholderTextColor={M.muted}
              />
            </View>

            {/* Description */}
            <View className="mt-5 px-5">
              <Text className="mb-1.5 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                {t("educator.story.labelDescription")}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t("educator.story.descriptionPlaceholder")}
                multiline
                numberOfLines={4}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholderTextColor={M.muted}
                textAlignVertical="top"
              />
            </View>

            <View className="mt-8 px-5">
              <Pressable
                onPress={handleCreate}
                disabled={createArc.isPending || languageCourses.length === 0}
                className="items-center rounded-xl bg-amber-500 py-4 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-base font-bold text-white">
                  {createArc.isPending ? t("educator.story.creating") : t("educator.story.createButton")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LanguagePickerModal
        visible={languagePickerVisible}
        selectedId={languageId}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguagePickerVisible(false)}
        allowedIds={allowedLanguages.length > 0 ? allowedLanguages : undefined}
      />
    </>
  );
}
