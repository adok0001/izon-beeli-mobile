import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { friendlyError } from "@/lib/api";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useDirtyTracker, useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { SeasonCastEditor } from "@/components/studio/season-cast-editor";
import { ChapterEditor, type ChapterDraft } from "@/components/studio/chapter-editor";
import { ChapterReorderSheet } from "@/components/studio/chapter-reorder-sheet";
import { LessonPickerModal } from "@/components/studio/lesson-picker-modal";
import { SeasonPreviewModal } from "@/components/studio/season-preview-modal";
import {
  type EducatorStoryCastMember,
  useEducatorLessons,
  useEducatorStoryArc,
  useEducatorStoryArcById,
  useSaveStoryArc,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  const saveArc = useSaveStoryArc();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nativeTitle, setNativeTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [cast, setCast] = useState<EducatorStoryCastMember[]>([]);
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [lessonPickerFor, setLessonPickerFor] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Inline validation: all offending fields highlight at once, view scrolls to
  // the first. Chapter errors are keyed by draft key so they survive reorders.
  const [titleError, setTitleError] = useState<string | null>(null);
  const [chapterErrors, setChapterErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const chapterY = useRef<Record<string, number>>({});

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
  const lessonOptions = courseLessons.map((l) => ({ id: l.id, title: localize(l.title, uiLanguage) }));

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

    // Collect ALL errors at once rather than bailing on the first, so the
    // author sees every offending field in one pass.
    const nextTitleError = !title.trim() ? t("educator.story.errorTitleRequiredShort") : null;
    const nextChapterErrors: Record<string, string> = {};
    for (const [i, ch] of chapters.entries()) {
      if (!ch.lessonId) {
        nextChapterErrors[ch.key] = t("educator.story.errorChapterNeedsLesson", { number: String(i + 1) });
      } else if (!ch.title.trim() || !ch.narrativeIntro.trim() || !ch.narrativeOutro.trim()) {
        nextChapterErrors[ch.key] = t("educator.story.errorChapterIncomplete", { number: String(i + 1) });
      }
    }
    const dupCastId = (() => {
      const seen = new Set<string>();
      for (const m of cast) {
        const id = m.castId.trim().toLowerCase();
        if (id && seen.has(id)) return m.castId.trim();
        if (id) seen.add(id);
      }
      return null;
    })();

    setTitleError(nextTitleError);
    setChapterErrors(nextChapterErrors);

    if (nextTitleError || Object.keys(nextChapterErrors).length > 0 || dupCastId) {
      toastError(t("educator.story.errorFixHighlighted", { defaultValue: "Fix the highlighted fields before saving." }));
      // Scroll to the first offender — the title (top) or the first bad chapter.
      const firstBadKey = chapters.find((ch) => nextChapterErrors[ch.key])?.key;
      const y = nextTitleError ? 0 : firstBadKey ? chapterY.current[firstBadKey] ?? 0 : 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      return;
    }

    setSaving(true);
    try {
      // One atomic round-trip — arc + cast + chapters commit together or not at
      // all, so a failure never leaves a half-saved season. Stay on the screen
      // on error so the author can retry.
      await saveArc.mutateAsync({
        id: arc.id,
        arc: {
          title: title.trim(),
          description: description.trim(),
          nativeTitle: nativeTitle.trim(),
          logline: logline.trim(),
        },
        cast: cast.map((m) => ({ ...m, castId: m.castId.trim(), name: m.name.trim(), role: m.role.trim() })),
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
            <View className="mr-2 flex-row items-center gap-4">
              <Pressable onPress={() => setPreviewOpen(true)} hitSlop={6}>
                <Text className="text-base font-semibold" style={{ color: M.accent }}>
                  {t("educator.story.preview", { defaultValue: "Preview" })}
                </Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving}>
                <Text className="text-base font-semibold disabled:opacity-50" style={{ color: M.warning }}>
                  {saving ? t("educator.story.saving") : t("educator.story.saveHeader")}
                </Text>
              </Pressable>
            </View>
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
            ref={scrollRef}
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
                onChangeText={(v) => { setTitle(v); if (titleError) setTitleError(null); }}
                className="mb-1 rounded-xl border px-3 py-2.5 text-base"
                style={{ backgroundColor: M.inputBg, borderColor: titleError ? M.errorBorder : M.inputBorder, color: M.inputText }}
                placeholderTextColor={M.muted}
                placeholder={t("educator.story.arcTitlePlaceholder")}
              />
              {titleError ? (
                <Text className="mb-3 text-xs font-semibold" style={{ color: M.error }}>{titleError}</Text>
              ) : (
                <View className="mb-2" />
              )}
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
              <View className="flex-row items-center gap-4">
                {chapters.length >= 2 ? (
                  <Pressable
                    onPress={() => setReorderOpen(true)}
                    className="flex-row items-center gap-1.5 active:opacity-70"
                  >
                    <IconSymbol name="arrow.up.arrow.down" size={15} color={M.accent} />
                    <Text className="text-sm font-bold" style={{ color: M.accent }}>
                      {t("educator.story.reorder", { defaultValue: "Reorder" })}
                    </Text>
                  </Pressable>
                ) : null}
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
                <View
                  key={ch.key}
                  onLayout={(e) => {
                    chapterY.current[ch.key] = e.nativeEvent.layout.y;
                  }}
                >
                  <ChapterEditor
                    index={i}
                    chapter={ch}
                    lessonOptions={lessonOptions}
                    error={chapterErrors[ch.key]}
                    onChange={(updated) => {
                      setChapters((prev) => prev.map((c, idx) => (idx === i ? updated : c)));
                      if (chapterErrors[ch.key]) {
                        setChapterErrors((prev) => {
                          const next = { ...prev };
                          delete next[ch.key];
                          return next;
                        });
                      }
                    }}
                    onDelete={() => confirmDeleteChapter(i)}
                    onPickLesson={() => setLessonPickerFor(i)}
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
                </View>
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

      <ChapterReorderSheet
        visible={reorderOpen}
        chapters={chapters}
        lessonTitleFor={(lessonId) => {
          const l = allLessons.find((x) => x.id === lessonId);
          return l ? localize(l.title, uiLanguage) : undefined;
        }}
        onClose={() => setReorderOpen(false)}
        onReorder={(reordered) =>
          setChapters(reordered.map((ch, i) => ({ ...ch, order: i + 1 })))
        }
      />

      <LessonPickerModal
        visible={lessonPickerFor !== null}
        selectedId={lessonPickerFor !== null ? chapters[lessonPickerFor]?.lessonId ?? "" : ""}
        lessons={lessonOptions}
        annotationFor={(lessonId) => {
          if (lessonPickerFor === null) return undefined;
          const other = chapters.findIndex((c, i) => i !== lessonPickerFor && c.lessonId === lessonId);
          return other >= 0
            ? t("educator.story.lessonUsedInChapter", { number: other + 1, defaultValue: `Already in Ch. ${other + 1}` })
            : undefined;
        }}
        onSelect={(id) => {
          const idx = lessonPickerFor;
          if (idx !== null) setChapters((prev) => prev.map((c, i) => (i === idx ? { ...c, lessonId: id } : c)));
          setLessonPickerFor(null);
        }}
        onClose={() => setLessonPickerFor(null)}
      />

      <SeasonPreviewModal
        visible={previewOpen}
        title={title}
        nativeTitle={nativeTitle}
        logline={logline}
        cast={cast}
        chapters={chapters}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
