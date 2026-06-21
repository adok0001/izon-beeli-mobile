import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePicker } from "@/components/ui/language-picker";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { apiFetch, friendlyError } from "@/lib/api";
import {
    useSubmitLessonContribution,
    type LessonContributionSegmentInput,
} from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { lessonContributionSchema } from "@/lib/validation";
import { useLessonContributionStore } from "@/store/lesson-contribution-store";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "language" | "course" | "details" | "audio" | "transcript";

interface Course {
  id: string;
  title: string;
  level: string;
}

interface Segment {
  text: string;
  translation: string;
  startTime: string;
  endTime: string;
}

function useStepMeta(t: (key: any) => string): Record<Step, { label: string; icon: string }> {
  return {
    language: { label: t("contribute.stepLanguage"), icon: "globe" },
    course: { label: t("contribute.stepCourse"), icon: "book.fill" },
    details: { label: t("contribute.stepDetails"), icon: "pencil" },
    audio: { label: t("contribute.stepAudio"), icon: "waveform" },
    transcript: { label: t("contribute.stepTranscript"), icon: "text.alignleft" },
  };
}

const STEPS: Step[] = ["language", "course", "details", "audio", "transcript"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

export default function ContributeLessonScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const STEP_META = useStepMeta(t);
  const router = useRouter();
  const store = useLessonContributionStore();
  const submitLesson = useSubmitLessonContribution();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [step, setStep] = useState<Step>("language");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState<Segment[]>([
    { text: "", translation: "", startTime: "", endTime: "" },
  ]);

  const currentIndex = STEPS.indexOf(step);

  useEffect(() => {
    return () => {
      store.reset();
    };
  }, []);

  const fetchCourses = useCallback(async (langId: string) => {
    setLoadingCourses(true);
    try {
      const data = await apiFetch<Course[]>(`/courses?languageId=${langId}`);
      setCourses(data);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp4", "audio/m4a", "audio/wav", "audio/x-m4a"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await store.loadAudio(asset.uri);
    } catch {
      toastError("Error", "Could not pick audio file.");
    }
  };

  const handleRecord = async () => {
    if (store.isRecording) {
      const uri = await store.stopRecording();
      if (uri) await store.loadAudio(uri);
    } else {
      await store.startRecording();
    }
  };

  const handleMarkSegment = (index: number) => {
    const pos = store.getCurrentPosition();
    const newSegs = [...segments];
    newSegs[index] = { ...newSegs[index], startTime: pos.toFixed(1) };
    if (index > 0) {
      newSegs[index - 1] = { ...newSegs[index - 1], endTime: pos.toFixed(1) };
    }
    setSegments(newSegs);
  };

  const updateSegment = (index: number, field: keyof Segment, value: string) => {
    const newSegs = [...segments];
    newSegs[index] = { ...newSegs[index], [field]: value };
    setSegments(newSegs);
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      { text: "", translation: "", startTime: "", endTime: "" },
    ]);
  };

  const removeSegment = (index: number) => {
    if (segments.length === 1) return;
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const filledSegments = segments.filter((s) => s.text.trim());

    const validation = lessonContributionSchema.safeParse({
      languageId: selectedLanguage ?? "",
      courseId: selectedCourse,
      title,
      description,
      audioUri: store.audioUri ?? "",
      segments: filledSegments,
    });

    if (!validation.success) {
      const message = validation.error.issues[0]?.message ?? t("common.tryAgain");
      toastError(t("common.error"), message);
      return;
    }

    const segmentInputs: LessonContributionSegmentInput[] = filledSegments.map((s, i) => ({
      text: s.text.trim(),
      translation: s.translation.trim() || undefined,
      startTime: s.startTime ? parseFloat(s.startTime) : undefined,
      endTime: s.endTime ? parseFloat(s.endTime) : undefined,
      order: i,
    }));

    submitLesson.mutate(
      {
        languageId: validation.data.languageId,
        courseId: selectedCourse ?? undefined,
        title: validation.data.title,
        description: validation.data.description,
        audioUri: validation.data.audioUri,
        duration: store.audioDuration > 0 ? Math.round(store.audioDuration) : undefined,
        segments: segmentInputs,
      },
      {
        onSuccess: () => {
          toastSuccess(t("contribute.submitted"), t("contribute.submittedLessonDesc"));
          setTimeout(() => router.back(), 1500);
        },
        onError: (err) => {
          toastError(t("common.error"), friendlyError(err));
        },
      }
    );
  };

  const canGoNext = () => {
    switch (step) {
      case "language": return !!selectedLanguage;
      case "course": return true;
      case "details": return title.trim().length > 0 && description.trim().length > 0;
      case "audio": return !!store.audioUri;
      case "transcript": return segments.some((s) => s.text.trim().length > 0);
      default: return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= STEPS.length) return;
    if (step === "language" && selectedLanguage) fetchCourses(selectedLanguage);
    setStep(STEPS[nextIndex]);
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    setStep(STEPS[prevIndex]);
  };

  return (
    <>
      <Stack.Screen options={{ title: t("contribute.lessonTitle"), presentation: "modal" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Step indicator */}
          <View className="border-b border-neutral-100 px-5 pb-3 pt-2 dark:border-neutral-800">
            <View className="flex-row items-center justify-between">
              {STEPS.map((s, i) => {
                const meta = STEP_META[s];
                const isActive = i === currentIndex;
                const isDone = i < currentIndex;
                return (
                  <View key={s} className="items-center" style={{ flex: 1 }}>
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-blue-500"
                          : isDone
                            ? "bg-green-500"
                            : "bg-neutral-200 dark:bg-neutral-700"
                      }`}
                    >
                      {isDone ? (
                        <IconSymbol name="checkmark" size={14} color="white" />
                      ) : (
                        <IconSymbol
                          name={meta.icon as any}
                          size={14}
                          color={isActive ? M.parchment : M.muted}
                        />
                      )}
                    </View>
                    <Text
                      className={`mt-1 text-[10px] ${
                        isActive
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : isDone
                            ? "text-green-600 dark:text-green-400"
                            : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {meta.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            {/* Connecting line */}
            <View className="absolute left-[10%] right-[10%] top-[18px] z-[-1] h-[2px] bg-neutral-200 dark:bg-neutral-700" />
          </View>

          {step === "language" ? (
            <LanguagePicker
              value={selectedLanguage ?? ""}
              onSelect={setSelectedLanguage}
              languages={LANGUAGES}
              title={t("contribute.whichLanguage")}
              subtitle={t("contribute.chooseLanguageDesc")}
            />
          ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Step 2: Course ── */}
            {step === "course" && (
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
                      onPress={() => setSelectedCourse(null)}
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
                        onPress={() => setSelectedCourse(course.id)}
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
            )}

            {/* ── Step 3: Details ── */}
            {step === "details" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.lessonInfo")}
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.lessonInfoDesc")}
                </Text>

                <View className="mb-4">
                  <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("journal.titleLabel")}
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t("contribute.lessonTitlePlaceholder")}
                    placeholderTextColor={M.muted}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    autoFocus
                  />
                </View>

                <View className="mb-4">
                  <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("contribute.descriptionLabel")}
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t("contribute.lessonDescPlaceholder")}
                    placeholderTextColor={M.muted}
                    multiline
                    numberOfLines={4}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    style={{ minHeight: 120, textAlignVertical: "top" }}
                  />
                </View>
              </View>
            )}

            {/* ── Step 4: Audio ── */}
            {step === "audio" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.addAudio")}
                </Text>
                <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.addAudioDesc")}
                </Text>

                {store.audioUri ? (
                  <View className="items-center rounded-2xl bg-green-50 p-8 dark:bg-green-950">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <IconSymbol name="checkmark" size={28} color={M.success} />
                    </View>
                    <Text className="text-lg font-bold text-green-700 dark:text-green-400">
                      {t("contribute.audioReady")}
                    </Text>
                    {store.audioDuration > 0 && (
                      <Text className="mt-1 text-sm text-green-600 dark:text-green-500">
                        {formatTime(store.audioDuration)}
                      </Text>
                    )}
                    {/* Inline preview */}
                    <Pressable
                      onPress={store.isPlaying ? store.pause : store.play}
                      className="mt-4 flex-row items-center rounded-full bg-green-600 px-5 py-2.5"
                    >
                      <IconSymbol
                        name={store.isPlaying ? "pause.fill" : "play.fill"}
                        size={14}
                        color="white"
                      />
                      <Text className="ml-2 text-sm font-semibold text-white">
                        {store.isPlaying ? t("lesson.pause") : t("contribute.preview")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        store.unload();
                        store.reset();
                      }}
                      className="mt-3"
                    >
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t("contribute.chooseDifferentAudio")}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="gap-3">
                    <Pressable
                      onPress={handlePickAudio}
                      className="flex-row items-center rounded-2xl bg-blue-50 p-5 active:opacity-80 dark:bg-blue-950"
                    >
                      <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                        <IconSymbol name="folder.fill" size={22} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                          {t("contribute.chooseFile")}
                        </Text>
                        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                          {t("contribute.chooseFileFormats")}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={getAccent("blue").solid} />
                    </Pressable>

                    <Pressable
                      onPress={handleRecord}
                      className={`flex-row items-center rounded-2xl p-5 active:opacity-80 ${
                        store.isRecording
                          ? "bg-red-50 dark:bg-red-950"
                          : "bg-neutral-50 dark:bg-neutral-800"
                      }`}
                    >
                      <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
                        store.isRecording ? "bg-red-500" : "bg-red-100 dark:bg-red-900"
                      }`}>
                        {store.isRecording ? (
                          <View className="h-5 w-5 rounded-sm bg-white" />
                        ) : (
                          <IconSymbol name="mic.fill" size={22} color={M.error} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                          {store.isRecording ? t("contribute.stopRecording") : t("contribute.recordAudio")}
                        </Text>
                        <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                          {store.isRecording
                            ? t("contribute.recordingProgress", { duration: store.recordingDuration })
                            : t("contribute.tapToStartRecording")}
                        </Text>
                      </View>
                      {store.isRecording && (
                        <View className="h-3 w-3 rounded-full bg-red-500" />
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* ── Step 5: Transcript ── */}
            {step === "transcript" && (
              <View>
                <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
                  {t("contribute.addTranscript")}
                </Text>
                <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("contribute.addTranscriptDesc")}
                </Text>

                {/* Playback controls */}
                <View className="mb-5 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={store.isPlaying ? store.pause : store.play}
                      className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-500 active:opacity-80"
                    >
                      <IconSymbol
                        name={store.isPlaying ? "pause.fill" : "play.fill"}
                        size={18}
                        color="white"
                      />
                    </Pressable>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {formatTime(store.playbackPosition)}
                        </Text>
                        <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                          {formatTime(store.audioDuration)}
                        </Text>
                      </View>
                      <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <View
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: store.audioDuration > 0
                              ? `${(store.playbackPosition / store.audioDuration) * 100}%`
                              : "0%",
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Segments */}
                {segments.map((seg, index) => (
                  <View
                    key={index}
                    className="mb-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700"
                  >
                    {/* Segment header */}
                    <View className="flex-row items-center justify-between bg-neutral-50 px-4 py-2.5 dark:bg-neutral-800">
                      <View className="flex-row items-center">
                        <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                          <Text className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {index + 1}
                          </Text>
                        </View>
                        {seg.startTime ? (
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {seg.startTime}s — {seg.endTime || "..."}s
                          </Text>
                        ) : (
                          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                            {t("contribute.noTimingSet")}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Pressable
                          onPress={() => handleMarkSegment(index)}
                          className="flex-row items-center rounded-full bg-blue-500 px-3 py-1.5 active:opacity-80"
                        >
                          <IconSymbol name="hand.tap.fill" size={12} color="white" />
                          <Text className="ml-1 text-xs font-semibold text-white">
                            {t("contribute.mark")}
                          </Text>
                        </Pressable>
                        {segments.length > 1 && (
                          <Pressable
                            onPress={() => removeSegment(index)}
                            className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                          >
                            <IconSymbol name="xmark" size={10} color={M.muted} />
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Segment body */}
                    <View className="p-3">
                      <TextInput
                        value={seg.text}
                        onChangeText={(v) => updateSegment(index, "text", v)}
                        placeholder="Spoken text in the language..."
                        placeholderTextColor={M.muted}
                        multiline
                        className="mb-2 min-h-[40px] rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      />
                      <TextInput
                        value={seg.translation}
                        onChangeText={(v) => updateSegment(index, "translation", v)}
                        placeholder="English translation (optional)"
                        placeholderTextColor={M.muted}
                        multiline
                        className="mb-2 min-h-[36px] rounded-xl bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
                      />

                      {/* Time inputs row */}
                      <View className="flex-row gap-2">
                        <View className="flex-1 flex-row items-center rounded-xl bg-neutral-50 px-3 dark:bg-neutral-800">
                          <Text className="mr-2 text-xs text-neutral-400">Start</Text>
                          <TextInput
                            value={seg.startTime}
                            onChangeText={(v) => updateSegment(index, "startTime", v)}
                            placeholder="0.0"
                            placeholderTextColor={M.muted}
                            keyboardType="decimal-pad"
                            className="flex-1 py-2 text-sm text-neutral-900 dark:text-white"
                          />
                        </View>
                        <View className="flex-1 flex-row items-center rounded-xl bg-neutral-50 px-3 dark:bg-neutral-800">
                          <Text className="mr-2 text-xs text-neutral-400">End</Text>
                          <TextInput
                            value={seg.endTime}
                            onChangeText={(v) => updateSegment(index, "endTime", v)}
                            placeholder="0.0"
                            placeholderTextColor={M.muted}
                            keyboardType="decimal-pad"
                            className="flex-1 py-2 text-sm text-neutral-900 dark:text-white"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable
                  onPress={addSegment}
                  className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-4 active:opacity-70 dark:border-neutral-700"
                >
                  <IconSymbol name="plus.circle.fill" size={18} color={getAccent("blue").solid} />
                  <Text className="ml-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {t("contribute.addSegment")}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
          )}

          {/* Bottom bar */}
          <View className="border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
            {/* Summary chips */}
            {step === "transcript" && selectedLanguage && (
              <View className="mb-3 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                    {getLanguageName(selectedLanguage)}
                  </Text>
                </View>
                <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                    {title || t("contribute.untitled")}
                  </Text>
                </View>
                <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                    {t("contribute.segmentsCount", { count: segments.filter((s) => s.text.trim()).length })}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row gap-3">
              {currentIndex > 0 && (
                <Pressable
                  onPress={goBack}
                  className="flex-row items-center justify-center rounded-2xl bg-neutral-100 px-5 py-3.5 active:opacity-80 dark:bg-neutral-800"
                >
                  <IconSymbol name="chevron.left" size={14} color={M.sub} />
                  <Text className="ml-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    {t("common.back")}
                  </Text>
                </Pressable>
              )}
              {step !== "transcript" ? (
                <Pressable
                  onPress={goNext}
                  disabled={!canGoNext()}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
                    canGoNext() ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-900"
                  }`}
                >
                  <Text className="font-semibold text-white">{t("common.continue")}</Text>
                  <IconSymbol name="chevron.right" size={14} color="white" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitLesson.isPending || !segments.some((s) => s.text.trim())}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
                    !submitLesson.isPending && segments.some((s) => s.text.trim())
                      ? "bg-blue-500"
                      : "bg-blue-200 dark:bg-blue-900"
                  }`}
                >
                  {submitLesson.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <IconSymbol name="paperplane.fill" size={14} color="white" />
                      <Text className="ml-2 font-semibold text-white">{t("contribute.submitLesson")}</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
