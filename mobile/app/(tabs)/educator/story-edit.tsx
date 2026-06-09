import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { canAccessEducatorPanel, useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  EducatorStoryChapter,
  useEducatorLessons,
  useEducatorStoryArc,
  useReplaceStoryChapters,
  useUpdateStoryArc,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChapterDraft = Omit<EducatorStoryChapter, "id"> & { key: string };

function ChapterEditor({
  index,
  chapter,
  lessonOptions,
  onChange,
  onDelete,
  t,
}: Readonly<{
  index: number;
  chapter: ChapterDraft;
  lessonOptions: { id: string; title: string }[];
  onChange: (updated: ChapterDraft) => void;
  onDelete: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}>) {
  const M = useMuseumTheme();
  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-widest text-amber-500">
          {t("educator.story.chapterLabel", { number: index + 1 })}
        </Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={16} color={M.error} />
        </Pressable>
      </View>

      <Text className="mb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {t("educator.story.chapterTitleLabel")}
      </Text>
      <TextInput
        value={chapter.title}
        onChangeText={(v) => onChange({ ...chapter, title: v })}
        placeholder={t("educator.story.chapterTitlePlaceholder")}
        className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        placeholderTextColor={M.muted}
      />

      <Text className="mb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {t("educator.story.chapterLessonLabel")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 -mx-4 px-4"
      >
        <View className="flex-row gap-2">
          {lessonOptions.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => onChange({ ...chapter, lessonId: l.id })}
              className={`rounded-lg border px-2.5 py-1.5 ${
                chapter.lessonId === l.id
                  ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20"
                  : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  chapter.lessonId === l.id
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
                numberOfLines={1}
              >
                {l.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text className="mb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {t("educator.story.chapterNarrativeIntroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeIntro}
        onChangeText={(v) => onChange({ ...chapter, narrativeIntro: v })}
        placeholder={t("educator.story.chapterNarrativeIntroPlaceholder")}
        multiline
        numberOfLines={3}
        className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        placeholderTextColor={M.muted}
        textAlignVertical="top"
      />

      <Text className="mb-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {t("educator.story.chapterNarrativeOutroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeOutro}
        onChangeText={(v) => onChange({ ...chapter, narrativeOutro: v })}
        placeholder={t("educator.story.chapterNarrativeOutroPlaceholder")}
        multiline
        numberOfLines={3}
        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        placeholderTextColor={M.muted}
        textAlignVertical="top"
      />
    </View>
  );
}

export default function StoryEditScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { data: currentUser } = useCurrentUser();
  const canAccess = currentUser ? canAccessEducatorPanel(currentUser) : false;

  const { data: arc, isLoading } = useEducatorStoryArc(courseId, canAccess);
  const { data: allLessons = [] } = useEducatorLessons(canAccess);
  const updateArc = useUpdateStoryArc();
  const replaceChapters = useReplaceStoryChapters();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!arc) return;
    setTitle(arc.title);
    setDescription(arc.description);
    setChapters(
      [...arc.chapters]
        .sort((a, b) => a.order - b.order)
        .map((ch, i) => ({
          key: ch.id ?? `ch-${i}`,
          lessonId: ch.lessonId,
          title: ch.title,
          narrativeIntro: ch.narrativeIntro,
          narrativeOutro: ch.narrativeOutro,
          order: ch.order,
        }))
    );
  }, [arc]);

  const courseLessons = allLessons.filter(
    (l) => arc && l.courseId === arc.courseId
  );

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        lessonId: courseLessons[0]?.id ?? "",
        title: "",
        narrativeIntro: "",
        narrativeOutro: "",
        order: prev.length + 1,
      },
    ]);
  };

  const handleSave = async () => {
    if (!arc) return;
    if (!title.trim()) { toastError(t("educator.story.errorTitleRequiredShort")); return; }

    for (const [i, ch] of chapters.entries()) {
      if (!ch.lessonId) {
        toastError(t("educator.story.errorChapterNeedsLesson", { number: i + 1 }));
        return;
      }
      if (!ch.title.trim() || !ch.narrativeIntro.trim() || !ch.narrativeOutro.trim()) {
        toastError(t("educator.story.errorChapterIncomplete", { number: i + 1 }));
        return;
      }
    }

    setSaving(true);
    try {
      await updateArc.mutateAsync({ id: arc.id, title: title.trim(), description: description.trim() });
      await replaceChapters.mutateAsync({
        id: arc.id,
        chapters: chapters.map((ch, i) => ({
          lessonId: ch.lessonId,
          title: ch.title.trim(),
          narrativeIntro: ch.narrativeIntro.trim(),
          narrativeOutro: ch.narrativeOutro.trim(),
          order: i + 1,
        })),
      });
      toastSuccess(t("educator.story.arcSaved"));
      router.back();
    } catch (e) {
      toastError(friendlyError(e as Error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteChapter = (index: number) => {
    Alert.alert(
      t("educator.story.removeChapterTitle"),
      t("educator.story.removeChapterMessage"),
      [
        { text: t("educator.story.removeChapterCancel"), style: "cancel" },
        {
          text: t("educator.story.removeChapterConfirm"),
          style: "destructive",
          onPress: () =>
            setChapters((prev) => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: arc?.title ?? t("educator.story.screenTitle"),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="mr-2"
            >
              <Text className="text-base font-semibold text-amber-500 disabled:opacity-50">
                {saving ? t("educator.story.saving") : t("educator.story.saveHeader")}
              </Text>
            </Pressable>
          ),
        }}
      />
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950" edges={["bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-neutral-400">{t("educator.story.loading")}</Text>
          </View>
        ) : !arc ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="exclamationmark.triangle" size={40} color={M.border} />
            <Text className="mt-4 text-center text-base text-neutral-500">
              {t("educator.story.noArcsTitle")}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Arc metadata */}
            <View className="mb-5 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t("educator.story.labelArcTitle")}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.arcTitlePlaceholder")}
              />
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t("educator.story.labelDescription")}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.arcDescriptionPlaceholder")}
                textAlignVertical="top"
              />
            </View>

            {/* Chapter list */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-neutral-400 dark:text-neutral-500">
                {t("educator.story.chaptersCount", { count: chapters.length })}
              </Text>
              <Pressable
                onPress={addChapter}
                className="flex-row items-center gap-1"
              >
                <IconSymbol name="plus.circle.fill" size={18} color={getAccent("amber").solid} />
                <Text className="text-sm font-semibold text-amber-500">
                  {t("educator.story.addChapter")}
                </Text>
              </Pressable>
            </View>

            {chapters.length === 0 ? (
              <View className="mb-4 items-center rounded-2xl border border-dashed border-neutral-300 py-10 dark:border-neutral-700">
                <IconSymbol name="book.pages" size={32} color={M.border} />
                <Text className="mt-2 text-sm text-neutral-400">
                  {t("educator.story.noChapters")}
                </Text>
              </View>
            ) : (
              chapters.map((ch, i) => (
                <ChapterEditor
                  key={ch.key}
                  index={i}
                  chapter={ch}
                  lessonOptions={courseLessons.map((l) => ({
                    id: l.id,
                    title: l.title,
                  }))}
                  onChange={(updated) =>
                    setChapters((prev) =>
                      prev.map((c, idx) => (idx === i ? updated : c))
                    )
                  }
                  onDelete={() => confirmDeleteChapter(i)}
                  t={(key, opts) => t(key as any, opts as any) as string}
                />
              ))
            )}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="mt-2 items-center rounded-xl bg-amber-500 py-4 active:opacity-80 disabled:opacity-50"
            >
              <Text className="text-base font-bold text-white">
                {saving ? t("educator.story.saving") : t("educator.story.saveButton")}
              </Text>
            </Pressable>
          </ScrollView>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
