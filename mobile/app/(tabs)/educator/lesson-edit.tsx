import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GLOSS_LANGUAGES, toLocalizedText } from "@/components/ui/localized-text-input";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import {
    canPublishContent,
    canSubmitForReview,
    STATUS_LABEL,
    STATUS_TONE,
    useCreateEducatorLesson,
    useDeleteEducatorLesson,
    useEducatorCourses,
    useEducatorLessonDetail,
    usePublishContent,
    useReplaceEducatorLessonAudio,
    useReplaceEducatorLessonCulturalContent,
    useReplaceEducatorLessonSegments,
    useUpdateEducatorLesson,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AudioSection } from "@/components/studio/lesson-audio-section";
import { clampAttachments, CulturalContentSection } from "@/components/studio/lesson-cultural-section";
import { LessonPreviewSection } from "@/components/studio/lesson-preview-section";
import { LessonStylePicker } from "@/components/studio/lesson-style-picker";
import type { EducatorLessonCulturalAttachment, LessonStyle } from "@/lib/hooks/educator/use-lessons";
import {
  EMPTY_SEGMENT,
  makeSegment,
  SegmentItem,
  TranslationLanguagePicker,
  toSegmentsPayload,
  type SegmentEditor,
} from "@/components/studio/lesson-segment-editor";

export default function EducatorLessonEditScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { lessonId, courseId } = useLocalSearchParams<{ lessonId?: string; courseId: string }>();
  const isEditMode = !!lessonId;
  const { uiLanguage } = useUiLanguageStore();

  const { user: currentUser, canAccess } = useStudioAccess();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState<LessonStyle | null>(null);
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [segments, setSegments] = useState<SegmentEditor[]>([EMPTY_SEGMENT()]);
  const [culturalAttachments, setCulturalAttachments] = useState<EducatorLessonCulturalAttachment[]>([]);
  const [translationLang, setTranslationLang] = useState<UiLanguage>(uiLanguage);
  const [playbackPos, setPlaybackPos] = useState(0);

  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const { data: courses = [] } = useEducatorCourses(canAccess);
  const { data: lessonDetail, isLoading: detailLoading } = useEducatorLessonDetail(lessonId, canAccess);

  const createLesson = useCreateEducatorLesson();
  const updateLesson = useUpdateEducatorLesson();
  const replaceSegments = useReplaceEducatorLessonSegments();
  const replaceCulturalContent = useReplaceEducatorLessonCulturalContent();
  const replaceAudio = useReplaceEducatorLessonAudio();
  const deleteLesson = useDeleteEducatorLesson();
  const publishLesson = usePublishContent("lessons", [["educator", "lesson", lessonId ?? null], ["educator", "lessons"]]);

  const course = courses.find((c) => c.id === courseId);

  // Pre-populate form when editing
  useEffect(() => {
    if (!lessonDetail) return;
    setTitle(localize(lessonDetail.title, uiLanguage));
    setDescription(localize(lessonDetail.description, uiLanguage));
    setType(lessonDetail.type ?? "");
    setArtist(lessonDetail.artist ?? "");
    setGenre(lessonDetail.genre ?? "");
    setStyle(lessonDetail.style ?? null);
    setSegments(
      lessonDetail.segments.length > 0
        ? lessonDetail.segments.map((seg) =>
            makeSegment({
              text: seg.text,
              translation: toLocalizedText(seg.translation, seg.translationFr),
              startTime: String(seg.startTime ?? 0),
              endTime: String(seg.endTime ?? 0),
            }),
          )
        : [EMPTY_SEGMENT()],
    );
    // Prefer the anchored form; fall back to the flat id list (unanchored).
    setCulturalAttachments(
      lessonDetail.culturalAttachments ??
        (lessonDetail.culturalContentIds ?? []).map((id) => ({ culturalContentId: id, afterSegmentIndex: null })),
    );
  }, [lessonDetail, uiLanguage]);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setAudioUri(result.assets[0]?.uri);
  };

  const replaceExistingAudio = async (uri: string) => {
    if (!lessonId) return;
    replaceAudio.mutate(
      { id: lessonId, audioUri: uri },
      {
        onSuccess: () => toastSuccess("Audio replaced", "Lesson audio updated."),
        onError: (err: Error) => toastError("Audio failed", friendlyError(err)),
      },
    );
  };

  const handleCreate = () => {
    if (!course) {
      toastError("No course", "Could not find the course. Go back and try again.");
      return;
    }
    createLesson.mutate(
      {
        languageId: course.languageId,
        courseId: course.id,
        title: title.trim(),
        description: description.trim(),
        type: type.trim() || undefined,
        artist: artist.trim() || undefined,
        genre: genre.trim() || undefined,
        style,
        audioUri,
        segments: toSegmentsPayload(segments),
      },
      {
        onSuccess: () => router.back(),
        onError: (err: Error) => toastError("Create failed", friendlyError(err)),
      },
    );
  };

  const handleUpdate = () => {
    if (!lessonId) return;
    updateLesson.mutate(
      {
        id: lessonId,
        payload: {
          title: title.trim(),
          description: description.trim(),
          type: type.trim() || undefined,
          artist: artist.trim() || undefined,
          genre: genre.trim() || undefined,
          style,
        },
      },
      { onError: (err: Error) => toastError("Save failed", friendlyError(err)) },
    );
    // Culture-note anchors are validated against the *saved* segment count, so
    // they only go out once the new transcript has landed.
    replaceSegments.mutate(
      { id: lessonId, segments: toSegmentsPayload(segments) },
      {
        onSuccess: () => {
          toastSuccess("Saved", "Lesson and segments updated.");
          replaceCulturalContent.mutate(
            { id: lessonId, attachments: clampAttachments(culturalAttachments, segments) },
            { onError: (err: Error) => toastError("Culture notes failed", friendlyError(err)) },
          );
        },
        onError: (err: Error) => toastError("Segments failed", friendlyError(err)),
      },
    );
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      toastError("Missing fields", "Title and description are required.");
      return;
    }
    if (isEditMode) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const handleSubmitForReview = () => {
    if (!lessonId) return;
    updateLesson.mutate(
      { id: lessonId, payload: { status: "in_review" } },
      {
        onSuccess: () => toastSuccess("Submitted for review"),
        onError: (err: Error) => toastError("Failed to submit for review", friendlyError(err)),
      },
    );
  };

  const handlePublish = () => {
    if (!lessonId) return;
    publishLesson.mutate(lessonId, {
      onSuccess: () => toastSuccess("Published"),
      onError: (err: Error) => toastError("Failed to publish", friendlyError(err)),
    });
  };

  const confirmDelete = () => {
    if (!lessonId) return;
    Alert.alert(
      "Delete lesson",
      "This will permanently delete this lesson and all its segments.",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteLesson.mutate(lessonId, {
              onSuccess: () => router.back(),
              onError: (err: Error) => toastError("Delete failed", friendlyError(err)),
            });
          },
        },
      ],
    );
  };

  const addSegment = () => setSegments((prev) => [...prev, EMPTY_SEGMENT()]);
  const updateSegment = (index: number, key: "text" | "startTime" | "endTime", value: string) =>
    setSegments((prev) => prev.map((seg, idx) => (idx === index ? { ...seg, [key]: value } : seg)));
  const updateSegmentTranslation = (index: number, lang: UiLanguage, value: string) =>
    setSegments((prev) =>
      prev.map((seg, idx) =>
        idx === index ? { ...seg, translation: { ...seg.translation, [lang]: value } } : seg,
      ),
    );
  const removeSegment = (index: number) =>
    setSegments((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  const filledTranslationLangs = new Set(
    GLOSS_LANGUAGES.map((l) => l.key).filter((lang) => segments.some((s) => s.translation[lang]?.trim())),
  );

  const isSaving = createLesson.isPending || updateLesson.isPending || replaceSegments.isPending;

  const screenTitle = isEditMode ? "Edit Lesson" : "New Lesson";
  const savedLabel = isEditMode ? t("common.save") : "Create Lesson";
  const saveButtonLabel = isSaving ? t("common.loading") : savedLabel;
  const deleteButtonLabel = deleteLesson.isPending ? t("common.loading") : "Delete Lesson";

  if (isEditMode && detailLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Lesson" }} />
        <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
          <View className="flex-row items-center px-5 pb-1 pt-2">
            <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
              <IconSymbol name="chevron.left" size={22} color={M.text} />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm" style={{ color: M.sub }}>{t("common.loading")}</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: screenTitle, headerBackTitle: course ? localize(course.title, uiLanguage) : "Lessons" }}
      />
      <SafeAreaView className="flex-1" style={{ backgroundColor: M.bg }} edges={["top"]}>
        <View className="flex-row items-center px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
            <IconSymbol name="chevron.left" size={22} color={M.text} />
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Course breadcrumb */}
          {course ? (
            <View className="flex-row items-center gap-1 px-5 pt-4">
              <IconSymbol name="book.fill" size={12} color={M.muted} />
              <Text className="text-xs" style={{ color: M.muted }}>{localize(course.title, uiLanguage)}</Text>
            </View>
          ) : null}

          {/* Basic Details */}
          <View className="mt-3 px-5">
            <View className="rounded-2xl p-4" style={{ backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                Lesson Details
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Lesson title *"
                placeholderTextColor={M.muted}
                className="rounded-xl border px-3.5 py-2.5 text-sm"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Lesson description *"
                placeholderTextColor={M.muted}
                multiline
                className="mt-2 min-h-[64px] rounded-xl border px-3.5 py-2.5 text-sm"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
              />
              <TextInput
                value={type}
                onChangeText={setType}
                placeholder="Type (e.g. podcast, song, story)"
                placeholderTextColor={M.muted}
                className="mt-2 rounded-xl border px-3.5 py-2.5 text-sm"
                style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
              />
              <View className="mt-2 flex-row gap-2">
                <TextInput
                  value={artist}
                  onChangeText={setArtist}
                  placeholder="Artist"
                  placeholderTextColor={M.muted}
                  className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm"
                  style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                />
                <TextInput
                  value={genre}
                  onChangeText={setGenre}
                  placeholder="Genre"
                  placeholderTextColor={M.muted}
                  className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm"
                  style={{ backgroundColor: M.inputBg, borderColor: M.inputBorder, color: M.inputText }}
                />
              </View>
              <LessonStylePicker value={style} onChange={setStyle} />
            </View>
          </View>

          {/* Audio */}
          <View className="mt-4 px-5">
            <View className="rounded-2xl p-4" style={{ backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                Audio
              </Text>
              <AudioSection
                isEditMode={isEditMode}
                audioUrl={lessonDetail?.audioUrl}
                audioUri={audioUri}
                isPending={replaceAudio.isPending}
                onReplace={replaceExistingAudio}
                onPick={pickAudio}
                onRecord={(uri) => setAudioUri(uri)}
                onPositionChange={setPlaybackPos}
                loadingLabel={t("common.loading")}
              />
            </View>
          </View>

          {/* Transcript Segments */}
          <View className="mt-4 px-5">
            <View className="rounded-2xl p-4" style={{ backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
                Transcript Segments ({segments.length})
              </Text>
              <TranslationLanguagePicker
                value={translationLang}
                onChange={setTranslationLang}
                filledLangs={filledTranslationLangs}
              />
              {segments.map((segment, index) => (
                <SegmentItem
                  key={segment.uid}
                  segment={segment}
                  index={index}
                  total={segments.length}
                  translationLang={translationLang}
                  playbackPositionSeconds={playbackPos}
                  onChange={updateSegment}
                  onChangeTranslation={updateSegmentTranslation}
                  onRemove={removeSegment}
                />
              ))}
              <Pressable
                onPress={addSegment}
                className="rounded-xl py-2.5 active:opacity-80"
                style={{ backgroundColor: M.pillBg }}
              >
                <Text className="text-center text-sm font-semibold" style={{ color: M.text }}>
                  + Add segment
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Cultural Content — only meaningful once the lesson exists */}
          {isEditMode && course ? (
            <CulturalContentSection
              languageId={course.languageId}
              attachments={culturalAttachments}
              segments={segments}
              onChange={setCulturalAttachments}
            />
          ) : null}

          {/* Learner Preview */}
          <LessonPreviewSection
            title={title}
            description={description}
            type={type}
            segments={segments}
          />

          {/* Actions */}
          <View className="mt-5 gap-2 px-5">
            {isEditMode && lessonDetail ? (
              <View className="mb-1 flex-row items-center">
                <Badge label={STATUS_LABEL[lessonDetail.status]} tone={STATUS_TONE[lessonDetail.status]} />
              </View>
            ) : null}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="rounded-2xl bg-brand-500 py-4 active:opacity-80 disabled:opacity-50"
            >
              <Text className="text-center font-semibold text-white">{saveButtonLabel}</Text>
            </Pressable>
            {isEditMode && lessonDetail && canSubmitForReview(lessonDetail.status) ? (
              <Pressable
                onPress={handleSubmitForReview}
                disabled={updateLesson.isPending}
                className="rounded-2xl py-4 active:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: M.warning }}
              >
                <Text className="text-center font-semibold text-white">Submit for review</Text>
              </Pressable>
            ) : null}
            {isEditMode && lessonDetail && currentUser && canPublishContent(lessonDetail.status, lessonDetail.createdBy, {
              isAdmin: currentUser.isAdmin, reviewerRole: currentUser.reviewerRole, userId: currentUser.id,
            }) ? (
              <Pressable
                onPress={handlePublish}
                disabled={publishLesson.isPending}
                className="rounded-2xl py-4 active:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: M.success }}
              >
                <Text className="text-center font-semibold text-white">Publish</Text>
              </Pressable>
            ) : null}
            {isEditMode ? (
              <Pressable
                onPress={confirmDelete}
                disabled={deleteLesson.isPending}
                className="rounded-2xl py-4 active:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: M.error }}
              >
                <Text className="text-center font-semibold text-white">{deleteButtonLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
