import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GLOSS_LANGUAGES, toLocalizedText } from "@/components/ui/localized-text-input";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { LessonHero } from "@/components/lesson/lesson-hero";
import { SchedulePublishModal } from "@/components/studio/schedule-publish-modal";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import {
    canPublishContent,
    canSubmitForReview,
    EducatorLessonSegment,
    isScheduled,
    STATUS_LABEL,
    STATUS_TONE,
    useCreateEducatorLesson,
    useDeleteEducatorLesson,
    useEducatorCourses,
    useEducatorLessonDetail,
    usePublishContent,
    useReplaceEducatorLessonAudio,
    useReplaceEducatorLessonSegments,
    useSchedulePublishContent,
    useUnschedulePublishContent,
    useUpdateEducatorLesson,
} from "@/lib/hooks/use-educator-panel";
import { friendlyError } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { localize } from "@/lib/localize";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SegmentEditor = {
  uid: string;
  text: string;
  translation: LocalizedText;
  startTime: string;
  endTime: string;
};

let _segUid = 0;
const makeSegment = (overrides?: Partial<Omit<SegmentEditor, "uid">>): SegmentEditor => ({
  uid: `seg-${(_segUid++).toString()}`,
  text: "",
  translation: {},
  startTime: "",
  endTime: "",
  ...overrides,
});

const EMPTY_SEGMENT = (): SegmentEditor => makeSegment();

/** Compact chip row for picking which language's translation to view/edit across all segments. */
function TranslationLanguagePicker({
  value,
  onChange,
  filledLangs,
}: Readonly<{ value: UiLanguage; onChange: (lang: UiLanguage) => void; filledLangs: Set<UiLanguage> }>) {
  const M = useMuseumTheme();
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {GLOSS_LANGUAGES.map((lang) => {
        const active = value === lang.key;
        const filled = filledLangs.has(lang.key);
        return (
          <Pressable
            key={lang.key}
            onPress={() => onChange(lang.key)}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70"
            style={{
              borderColor: active ? getAccent("blue").solid : M.border,
              backgroundColor: active ? `${getAccent("blue").solid}20` : "transparent",
            }}
          >
            {filled ? (
              <IconSymbol name="checkmark.circle.fill" size={11} color={active ? getAccent("blue").solid : M.muted} />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: active ? getAccent("blue").solid : M.muted }}
            >
              {lang.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SegmentItem({
  segment,
  index,
  total,
  translationLang,
  playbackPositionSeconds,
  onChange,
  onChangeTranslation,
  onRemove,
}: Readonly<{
  segment: SegmentEditor;
  index: number;
  total: number;
  translationLang: UiLanguage;
  playbackPositionSeconds: number;
  onChange: (index: number, key: "text" | "startTime" | "endTime", value: string) => void;
  onChangeTranslation: (index: number, lang: UiLanguage, value: string) => void;
  onRemove: (index: number) => void;
}>) {
  const M = useMuseumTheme();
  const stamp = (key: "startTime" | "endTime") =>
    onChange(index, key, playbackPositionSeconds.toFixed(1));
  const translationLabel = GLOSS_LANGUAGES.find((l) => l.key === translationLang)?.label ?? translationLang.toUpperCase();

  return (
    <View className="mb-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <TextInput
        value={segment.text}
        onChangeText={(v) => onChange(index, "text", v)}
        placeholder="Segment text"
        placeholderTextColor={M.muted}
        className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
      />
      <TextInput
        value={segment.translation[translationLang] ?? ""}
        onChangeText={(v) => onChangeTranslation(index, translationLang, v)}
        placeholder={`Translation (${translationLabel}, optional)`}
        placeholderTextColor={M.muted}
        className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
      />
      <View className="mt-2 flex-row gap-2">
        {(["startTime", "endTime"] as const).map((key) => (
          <View key={key} className="flex-1">
            <Text className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              {key === "startTime" ? "Start" : "End"}
            </Text>
            <View className="flex-row items-center gap-1">
              <TextInput
                value={segment[key]}
                onChangeText={(v) => onChange(index, key, v)}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={M.muted}
                className="flex-1 rounded-lg bg-neutral-50 px-2.5 py-2 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
              />
              <Pressable
                onPress={() => stamp(key)}
                hitSlop={4}
                className="items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2 active:opacity-70 dark:bg-blue-950/30"
              >
                <IconSymbol name="record.circle" size={16} color={getAccent("blue").solid} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {total > 1 ? (
        <Pressable onPress={() => onRemove(index)} className="mt-2 self-end">
          <Text className="text-xs font-semibold text-red-500">Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PlaybackButton({ source, onPositionChange }: Readonly<{ source?: string | null; onPositionChange?: (posSeconds: number) => void }>) {
  const M = useMuseumTheme();
  const { currentTrackId, isPlaying, isLoading, progress, duration, togglePlayback, loadAndPlay } = useAudioStore();

  const isThisTrack = !!source && currentTrackId === source;
  const thisIsPlaying = isThisTrack && isPlaying;
  const thisIsLoading = isThisTrack && isLoading;
  const positionMs = isThisTrack ? progress * 1000 : 0;
  const durationMs = isThisTrack ? duration * 1000 : 0;
  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;

  useEffect(() => {
    if (isThisTrack) onPositionChange?.(progress);
  }, [isThisTrack, progress, onPositionChange]);

  if (!source) return null;

  const handleToggle = async () => {
    if (!isThisTrack) {
      await loadAndPlay(source, source, "Lesson Preview");
    } else {
      await togglePlayback();
    }
  };

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <View className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20">
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center gap-2 px-3 py-2.5 active:opacity-70"
      >
        {thisIsLoading ? (
          <ActivityIndicator size="small" color={getAccent("teal").solid} />
        ) : (
          <IconSymbol
            name={thisIsPlaying ? "pause.circle.fill" : "play.circle.fill"}
            size={20}
            color={getAccent("teal").solid}
          />
        )}
        <Text className="flex-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {thisIsPlaying ? "Pause" : "Play audio"}
        </Text>
        {durationMs > 0 ? (
          <Text className="text-xs text-emerald-600 dark:text-emerald-400">
            {formatMs(positionMs)} / {formatMs(durationMs)}
          </Text>
        ) : null}
      </Pressable>
      {durationMs > 0 ? (
        <View className="mx-3 mb-2 h-1 overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-800">
          <View
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.round(progressRatio * 100)}%` }}
          />
        </View>
      ) : null}
    </View>
  );
}

function RecordButton({
  isDisabled,
  onRecorded,
}: Readonly<{ isDisabled: boolean; onRecorded: (uri: string) => void }>) {
  const M = useMuseumTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      toastError("Permission required", "Microphone access is needed to record audio.");
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(rec);
    setIsRecording(true);
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((prev) => prev + 1000), 1000);
  };

  const stopRecording = async () => {
    if (!recording) return;
    stopTimer();
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    if (uri) onRecorded(uri);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <Pressable
      onPress={isRecording ? stopRecording : startRecording}
      disabled={isDisabled && !isRecording}
      className={`flex-row items-center justify-center rounded-xl py-3 active:opacity-70 disabled:opacity-40 ${
        isRecording
          ? "bg-red-500"
          : "border border-dashed border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20"
      }`}
    >
      <IconSymbol
        name={isRecording ? "stop.circle.fill" : "mic.fill"}
        size={16}
        color={isRecording ? M.parchment : M.error}
      />
      <Text className={`ml-2 text-sm font-semibold ${isRecording ? "text-white" : "text-red-500"}`}>
        {isRecording ? `Stop  ${formatTime(elapsedMs)}` : "Record audio"}
      </Text>
    </Pressable>
  );
}

function AudioSection({
  isEditMode,
  audioUrl,
  audioUri,
  isPending,
  onReplace,
  onPick,
  onRecord,
  onPositionChange,
  loadingLabel,
}: Readonly<{
  isEditMode: boolean;
  audioUrl?: string | null;
  audioUri?: string;
  isPending: boolean;
  onReplace: (uri: string) => void;
  onPick: () => void;
  onRecord: (uri: string) => void;
  onPositionChange?: (posSeconds: number) => void;
  loadingLabel: string;
}>) {
  const [recordedUri, setRecordedUri] = useState<string | undefined>(undefined);

  const pickAndReplace = () => {
    DocumentPicker.getDocumentAsync({ type: ["audio/*"], copyToCacheDirectory: true, multiple: false })
      .then((r) => { if (!r.canceled && r.assets[0]?.uri) onReplace(r.assets[0].uri); })
      .catch(() => {});
  };

  const handleRecorded = (uri: string) => {
    setRecordedUri(uri);
    if (isEditMode) {
      onReplace(uri);
    } else {
      onRecord(uri);
    }
  };

  const playbackSource = isEditMode ? audioUrl : (audioUri ?? recordedUri);
  const hasAudio = !!playbackSource;

  let uploadLabel: string;
  if (isEditMode) {
    uploadLabel = audioUrl ? "Replace file" : "Upload file";
  } else {
    uploadLabel = audioUri ? "Change file" : "Upload file";
  }

  return (
    <View className="gap-2">
      {/* Playback */}
      {hasAudio ? <PlaybackButton source={playbackSource} onPositionChange={onPositionChange} /> : null}

      {/* Record */}
      <RecordButton isDisabled={isPending} onRecorded={handleRecorded} />

      {/* Upload / replace file */}
      <Pressable
        onPress={isEditMode ? pickAndReplace : onPick}
        disabled={isPending}
        className="flex-row items-center justify-center rounded-xl border border-dashed border-neutral-300 py-3 active:opacity-70 disabled:opacity-40 dark:border-neutral-600"
      >
        <IconSymbol name="square.and.arrow.up" size={16} color={getAccent("blue").solid} />
        <Text className="ml-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          {isPending ? loadingLabel : uploadLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * en/fr persist through their dedicated DB columns (translation/translationFr).
 * Other languages (pcm/ar/pt) have no dedicated column, so once any of those are
 * filled the whole map is JSON-encoded into `translation` — `localize()` already
 * unpacks that transparently wherever segment translations are read.
 */
function serializeSegmentTranslation(t: LocalizedText): { translation?: string; translationFr?: string } {
  const hasExtraLangs = !!(t.pcm?.trim() || t.ar?.trim() || t.pt?.trim());
  if (hasExtraLangs) return { translation: JSON.stringify(t) };
  return {
    translation: t.en?.trim() || undefined,
    translationFr: t.fr?.trim() || undefined,
  };
}

function toSegmentsPayload(source: SegmentEditor[]): EducatorLessonSegment[] {
  return source
    .map((seg, i) => ({
      text: seg.text.trim(),
      ...serializeSegmentTranslation(seg.translation),
      startTime: seg.startTime ? Number(seg.startTime) : 0,
      endTime: seg.endTime ? Number(seg.endTime) : 0,
      order: i,
    }))
    .filter((seg) => seg.text.length > 0);
}

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
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [segments, setSegments] = useState<SegmentEditor[]>([EMPTY_SEGMENT()]);
  const [translationLang, setTranslationLang] = useState<UiLanguage>(uiLanguage);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const { data: courses = [] } = useEducatorCourses(canAccess);
  const { data: lessonDetail, isLoading: detailLoading } = useEducatorLessonDetail(lessonId, canAccess);

  const createLesson = useCreateEducatorLesson();
  const updateLesson = useUpdateEducatorLesson();
  const replaceSegments = useReplaceEducatorLessonSegments();
  const replaceAudio = useReplaceEducatorLessonAudio();
  const deleteLesson = useDeleteEducatorLesson();
  const publishLesson = usePublishContent("lessons", [["educator", "lesson", lessonId ?? null], ["educator", "lessons"]]);
  const schedulePublishLesson = useSchedulePublishContent("lessons", [["educator", "lesson", lessonId ?? null], ["educator", "lessons"]]);
  const unschedulePublishLesson = useUnschedulePublishContent("lessons", [["educator", "lesson", lessonId ?? null], ["educator", "lessons"]]);
  const [schedulingOpen, setSchedulingOpen] = useState(false);

  const course = courses.find((c) => c.id === courseId);

  // Pre-populate form when editing
  useEffect(() => {
    if (!lessonDetail) return;
    setTitle(localize(lessonDetail.title, uiLanguage));
    setDescription(localize(lessonDetail.description, uiLanguage));
    setType(lessonDetail.type ?? "");
    setArtist(lessonDetail.artist ?? "");
    setGenre(lessonDetail.genre ?? "");
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
        },
      },
      { onError: (err: Error) => toastError("Save failed", friendlyError(err)) },
    );
    replaceSegments.mutate(
      { id: lessonId, segments: toSegmentsPayload(segments) },
      {
        onSuccess: () => toastSuccess("Saved", "Lesson and segments updated."),
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
        <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
          <View className="flex-row items-center px-5 pb-1 pt-2">
            <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-1 p-1 active:opacity-60">
              <IconSymbol name="chevron.left" size={22} color={M.text} />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{t("common.loading")}</Text>
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
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
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
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">{localize(course.title, uiLanguage)}</Text>
            </View>
          ) : null}

          {/* Basic Details */}
          <View className="mt-3 px-5">
            <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
                Lesson Details
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Lesson title *"
                placeholderTextColor={M.muted}
                className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Lesson description *"
                placeholderTextColor={M.muted}
                multiline
                className="mt-2 min-h-[64px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <TextInput
                value={type}
                onChangeText={setType}
                placeholder="Type (e.g. podcast, song, story)"
                placeholderTextColor={M.muted}
                className="mt-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
              <View className="mt-2 flex-row gap-2">
                <TextInput
                  value={artist}
                  onChangeText={setArtist}
                  placeholder="Artist"
                  placeholderTextColor={M.muted}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <TextInput
                  value={genre}
                  onChangeText={setGenre}
                  placeholder="Genre"
                  placeholderTextColor={M.muted}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </View>
            </View>
          </View>

          {/* Audio */}
          <View className="mt-4 px-5">
            <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
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
            <View className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400 dark:text-neutral-500">
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
                className="rounded-xl bg-neutral-200 py-2.5 active:opacity-80 dark:bg-neutral-700"
              >
                <Text className="text-center text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  + Add segment
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Learner Preview */}
          <View className="mt-4 px-5">
            <Pressable
              onPress={() => setPreviewVisible((v) => !v)}
              className="flex-row items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 active:opacity-70 dark:bg-neutral-800"
            >
              <View className="flex-row items-center gap-2">
                <IconSymbol name="eye.fill" size={16} color={getAccent("blue").solid} />
                <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {t("educator.lessonEdit.previewTitle")}
                </Text>
              </View>
              <IconSymbol
                name={previewVisible ? "chevron.up" : "chevron.down"}
                size={14}
                color={M.muted}
              />
            </Pressable>
            {previewVisible && (
              <View className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                <LessonHero
                  title={title || t("educator.lessonEdit.untitled")}
                  overline={type ? type.toUpperCase() : "LESSON"}
                  accentColor={getAccent("blue").solid}
                />
                {description ? (
                  <View className="border-b border-neutral-100 px-4 pb-4 dark:border-neutral-800">
                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                      {description}
                    </Text>
                  </View>
                ) : null}
                {segments.some((s) => s.text.trim().length > 0) ? (
                  <View className="px-4 py-3">
                    <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {t("review.transcript")}
                    </Text>
                    {segments
                      .filter((s) => s.text.trim().length > 0)
                      .map((s, i) => {
                        const previewTranslation = localize(s.translation, uiLanguage);
                        return (
                          <View key={s.uid} className={`${i > 0 ? "mt-3" : ""}`}>
                            <Text className="text-base text-neutral-900 dark:text-white">
                              {s.text}
                            </Text>
                            {previewTranslation ? (
                              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                {previewTranslation}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                  </View>
                ) : (
                  <View className="px-4 py-6 items-center">
                    <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                      {t("educator.lessonEdit.noSegments")}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

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
              className="rounded-2xl bg-blue-500 py-4 active:opacity-80 disabled:opacity-50"
            >
              <Text className="text-center font-semibold text-white">{saveButtonLabel}</Text>
            </Pressable>
            {isEditMode && lessonDetail && canSubmitForReview(lessonDetail.status) ? (
              <Pressable
                onPress={handleSubmitForReview}
                disabled={updateLesson.isPending}
                className="rounded-2xl bg-amber-500 py-4 active:opacity-80 disabled:opacity-50"
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
                className="rounded-2xl bg-green-600 py-4 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-center font-semibold text-white">Publish</Text>
              </Pressable>
            ) : null}
            {isEditMode && lessonDetail && currentUser && canPublishContent(lessonDetail.status, lessonDetail.createdBy, {
              isAdmin: currentUser.isAdmin, reviewerRole: currentUser.reviewerRole, userId: currentUser.id,
            }) ? (
              isScheduled(lessonDetail.status, lessonDetail.publishAt) ? (
                <Pressable
                  onPress={() => lessonId && unschedulePublishLesson.mutate(lessonId)}
                  disabled={unschedulePublishLesson.isPending}
                  className="rounded-2xl bg-blue-100 py-4 active:opacity-70 dark:bg-blue-900/40"
                >
                  <Text className="text-center font-semibold text-blue-700 dark:text-blue-400">Cancel scheduled publish</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setSchedulingOpen(true)}
                  className="rounded-2xl bg-neutral-100 py-4 active:opacity-70 dark:bg-neutral-800"
                >
                  <Text className="text-center font-semibold text-neutral-700 dark:text-neutral-200">Schedule publish…</Text>
                </Pressable>
              )
            ) : null}
            {isEditMode ? (
              <Pressable
                onPress={confirmDelete}
                disabled={deleteLesson.isPending}
                className="rounded-2xl bg-red-600 py-4 active:opacity-80 disabled:opacity-50"
              >
                <Text className="text-center font-semibold text-white">{deleteButtonLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {schedulingOpen && lessonId && (
        <SchedulePublishModal
          onClose={() => setSchedulingOpen(false)}
          onSchedule={(publishAt) =>
            schedulePublishLesson.mutate(
              { id: lessonId, publishAt },
              { onSuccess: () => setSchedulingOpen(false) }
            )
          }
          saving={schedulePublishLesson.isPending}
        />
      )}
    </>
  );
}
