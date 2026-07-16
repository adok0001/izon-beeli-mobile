import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDirtyTracker, useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { SeasonCastEditor } from "@/components/studio/season-cast-editor";
import {
  EducatorStoryChapter,
  type EducatorStoryCastMember,
  useEducatorLessons,
  useEducatorStoryArc,
  useEducatorStoryArcById,
  useReplaceStoryCast,
  useReplaceStoryChapters,
  useUpdateStoryArc,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
  onOpenLesson,
  t,
}: Readonly<{
  index: number;
  chapter: ChapterDraft;
  lessonOptions: { id: string; title: string }[];
  onChange: (updated: ChapterDraft) => void;
  onDelete: () => void;
  onOpenLesson: (lessonId: string) => void;
  t: TFunction;
}>) {
  const M = useMuseumTheme();
  const selectedLesson = lessonOptions.find((l) => l.id === chapter.lessonId);
  return (
    <View className="mx-5 mb-4 rounded-2xl border p-4" style={{ backgroundColor: M.card, borderColor: M.border }}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: M.warning }}>
          {t("educator.story.chapterLabel", { number: String(index + 1) })}
        </Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={16} color={M.error} />
        </Pressable>
      </View>

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterTitleLabel")}
      </Text>
      <TextInput
        value={chapter.title}
        onChangeText={(v) => onChange({ ...chapter, title: v })}
        placeholder={t("educator.story.chapterTitlePlaceholder")}
        className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
        placeholderTextColor={M.muted}
      />

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
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
              className="rounded-lg border px-2.5 py-1.5"
              style={{
                backgroundColor: chapter.lessonId === l.id ? M.warningBg : M.pillBg,
                borderColor: chapter.lessonId === l.id ? M.warningBorder : M.border,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: chapter.lessonId === l.id ? M.warning : M.sub }}
                numberOfLines={1}
              >
                {l.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {selectedLesson ? (
        <Pressable
          onPress={() => onOpenLesson(chapter.lessonId)}
          className="mb-3 flex-row items-center gap-2.5 rounded-xl border px-3 py-2.5 active:opacity-70"
          style={{ backgroundColor: M.warningBg, borderColor: M.warningBorder }}
        >
          <IconSymbol name="waveform" size={16} color={M.warning} />
          <View className="flex-1">
            <Text className="text-xs font-bold" style={{ color: M.text }} numberOfLines={1}>
              {selectedLesson.title}
            </Text>
            <Text className="text-[11px]" style={{ color: M.muted }}>
              {t("educator.story.openLessonHint")}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={13} color={M.warning} />
        </Pressable>
      ) : null}

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterNarrativeIntroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeIntro}
        onChangeText={(v) => onChange({ ...chapter, narrativeIntro: v })}
        placeholder={t("educator.story.chapterNarrativeIntroPlaceholder")}
        multiline
        numberOfLines={3}
        className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
        placeholderTextColor={M.muted}
        textAlignVertical="top"
      />

      <Text className="mb-1 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.story.chapterNarrativeOutroLabel")}
      </Text>
      <TextInput
        value={chapter.narrativeOutro}
        onChangeText={(v) => onChange({ ...chapter, narrativeOutro: v })}
        placeholder={t("educator.story.chapterNarrativeOutroPlaceholder")}
        multiline
        numberOfLines={3}
        className="rounded-xl border px-3 py-2.5 text-sm"
        style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
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
  const { arcId, courseId } = useLocalSearchParams<{ arcId?: string; courseId?: string }>();
  const { canAccess } = useStudioAccess();
  const { uiLanguage } = useUiLanguageStore();

  // Prefer the arc id: a standalone season (no owning course) can only be
  // reached that way. courseId is kept for older deep links.
  const byId = useEducatorStoryArcById(arcId, canAccess && !!arcId);
  const byCourse = useEducatorStoryArc(courseId, canAccess && !arcId && !!courseId);
  const { data: arc, isLoading } = arcId ? byId : byCourse;
  const { data: allLessons = [] } = useEducatorLessons(canAccess);
  const updateArc = useUpdateStoryArc();
  const replaceChapters = useReplaceStoryChapters();
  const replaceCast = useReplaceStoryCast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nativeTitle, setNativeTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [cast, setCast] = useState<EducatorStoryCastMember[]>([]);
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!arc) return;
    setTitle(arc.title);
    setDescription(arc.description);
    setNativeTitle(arc.nativeTitle ?? "");
    setLogline(arc.logline ?? "");
    setCast(arc.cast ?? []);
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
    setLoaded(true);
  }, [arc]);

  // Baseline only once the arc has populated the form, so an untouched load
  // doesn't read as dirty. A successful save navigates back, so gate the guard
  // on `leaving` to let that intentional exit through.
  const { dirty } = useDirtyTracker({ title, description, nativeTitle, logline, cast, chapters }, loaded);
  useUnsavedGuard(dirty && !leaving);
  useEffect(() => {
    if (leaving) router.back();
  }, [leaving, router]);

  // A course-bound season draws its chapters from that course. A standalone one
  // is a cross-course narrative, so it may pick any lesson in its language.
  const courseLessons = allLessons.filter((l) =>
    arc?.courseId ? l.courseId === arc.courseId : l.languageId === arc?.languageId
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
        toastError(t("educator.story.errorChapterNeedsLesson", { number: String(i + 1) }));
        return;
      }
      if (!ch.title.trim() || !ch.narrativeIntro.trim() || !ch.narrativeOutro.trim()) {
        toastError(t("educator.story.errorChapterIncomplete", { number: String(i + 1) }));
        return;
      }
    }

    setSaving(true);
    try {
      await updateArc.mutateAsync({
        id: arc.id,
        title: title.trim(),
        description: description.trim(),
        nativeTitle: nativeTitle.trim(),
        logline: logline.trim(),
      });
      await replaceCast.mutateAsync({
        id: arc.id,
        cast: cast.map((m) => ({ ...m, castId: m.castId.trim(), name: m.name.trim(), role: m.role.trim() })),
      });
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
      // Stand the guard down before leaving so the save's own exit doesn't
      // trip the discard prompt; the effect handles the actual navigation.
      setLeaving(true);
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
              <Text className="text-base font-semibold disabled:opacity-50" style={{ color: M.warning }}>
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top", "bottom"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm" style={{ color: M.muted }}>{t("educator.story.loading")}</Text>
          </View>
        ) : !arc ? (
          <View className="flex-1 items-center justify-center px-8">
            <IconSymbol name="exclamationmark.triangle" size={40} color={M.border} />
            <Text className="mt-4 text-center text-base" style={{ color: M.sub }}>
              {t("educator.story.noArcsTitle")}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Arc metadata */}
            <View className="mx-5 mb-5 rounded-2xl border p-4" style={{ backgroundColor: M.card, borderColor: M.border }}>
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: M.muted }}>
                {t("educator.story.labelArcTitle")}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                className="mb-3 rounded-xl border px-3 py-2.5 text-base"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.arcTitlePlaceholder")}
              />
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: M.muted }}>
                {t("educator.story.labelDescription")}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="rounded-xl border px-3 py-2.5 text-base"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.arcDescriptionPlaceholder")}
                textAlignVertical="top"
              />

              {/* Season "bible" — what the Series screen shows above the episodes. */}
              <Text className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider" style={{ color: M.muted }}>
                {t("educator.story.labelNativeTitle")}
              </Text>
              <TextInput
                value={nativeTitle}
                onChangeText={setNativeTitle}
                className="mb-1 rounded-xl border px-3 py-2.5 text-base"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.nativeTitlePlaceholder")}
              />
              <Text className="mb-3 text-xs" style={{ color: M.sub }}>
                {t("educator.story.nativeTitleHint")}
              </Text>

              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: M.muted }}>
                {t("educator.story.labelLogline")}
              </Text>
              <TextInput
                value={logline}
                onChangeText={setLogline}
                multiline
                numberOfLines={2}
                className="rounded-xl border px-3 py-2.5 text-base"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.loglinePlaceholder")}
                textAlignVertical="top"
              />
            </View>

            <SeasonCastEditor cast={cast} onChange={setCast} />

            {/* Chapter list */}
            <View className="mx-5 mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px]" style={{ color: M.muted }}>
                {t("educator.story.chaptersCount", { count: chapters.length })}
              </Text>
              <Pressable
                onPress={addChapter}
                className="flex-row items-center gap-1.5 active:opacity-70"
              >
                <IconSymbol name="plus.circle.fill" size={16} color={M.accent} />
                <Text className="text-sm font-bold" style={{ color: M.accent }}>
                  {t("educator.story.addChapter")}
                </Text>
              </Pressable>
            </View>

            {chapters.length === 0 ? (
              <View className="mx-5 mb-4 items-center rounded-2xl border border-dashed py-10" style={{ borderColor: M.border }}>
                <IconSymbol name="book.pages" size={32} color={M.border} />
                <Text className="mt-2 text-sm" style={{ color: M.muted }}>
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
                    title: localize(l.title, uiLanguage),
                  }))}
                  onChange={(updated) =>
                    setChapters((prev) =>
                      prev.map((c, idx) => (idx === i ? updated : c))
                    )
                  }
                  onDelete={() => confirmDeleteChapter(i)}
                  onOpenLesson={(lessonId) =>
                    router.push({
                      pathname: "/educator/lesson-edit",
                      // The lesson's own courseId, not the screen's — a standalone
                      // season's courseId param is undefined, and even a course-bound
                      // season's chapters can reference lessons from other courses.
                      params: { lessonId, courseId: allLessons.find((l) => l.id === lessonId)?.courseId },
                    } as never)
                  }
                  t={t}
                />
              ))
            )}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="mx-5 mt-2 items-center rounded-xl py-4 active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: M.warning }}
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
