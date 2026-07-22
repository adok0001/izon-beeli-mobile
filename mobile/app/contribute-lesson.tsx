import { AudioStep } from "@/components/contribute-lesson/audio-step";
import { CourseStep } from "@/components/contribute-lesson/course-step";
import { DetailsStep } from "@/components/contribute-lesson/details-step";
import { LanguageStep } from "@/components/contribute-lesson/language-step";
import { StepIndicator } from "@/components/contribute-lesson/step-indicator";
import { TranscriptStep } from "@/components/contribute-lesson/transcript-step";
import type { Course } from "@/components/contribute-lesson/types";
import { useLessonAudio } from "@/components/contribute-lesson/use-lesson-audio";
import { useStepNav } from "@/components/contribute-lesson/use-step-nav";
import { useTranscriptSegments } from "@/components/contribute-lesson/use-transcript-segments";
import { WizardNavBar } from "@/components/contribute-lesson/wizard-nav-bar";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { apiFetch, friendlyError } from "@/lib/api";
import {
    useSubmitLessonContribution,
    type LessonContributionSegmentInput,
} from "@/lib/hooks/use-contributions";
import { useToast } from "@/lib/hooks/use-toast";
import { lessonContributionSchema } from "@/lib/validation";
import { useLessonContributionStore } from "@/store/lesson-contribution-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContributeLessonScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useLessonContributionStore();
  const submitLesson = useSubmitLessonContribution();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { segments, handleMarkSegment, updateSegment, addSegment, removeSegment } =
    useTranscriptSegments(store.getCurrentPosition);
  const { handlePickAudio, handleRecord } = useLessonAudio(store, toastError);

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
    } catch (err) {
      setCourses([]);
      toastError(t("common.error"), friendlyError(err));
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toastError]);

  const { step, currentIndex, canGoNext, goNext, goBack } = useStepNav({
    selectedLanguage,
    title,
    description,
    audioUri: store.audioUri,
    segments,
    onLeaveLanguage: fetchCourses,
  });

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
          <StepIndicator currentIndex={currentIndex} />

          {step === "language" ? (
            <LanguageStep selectedLanguage={selectedLanguage} onSelect={setSelectedLanguage} />
          ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === "course" && (
              <CourseStep
                courses={courses}
                loadingCourses={loadingCourses}
                selectedCourse={selectedCourse}
                onSelectCourse={setSelectedCourse}
              />
            )}

            {step === "details" && (
              <DetailsStep
                title={title}
                description={description}
                onChangeTitle={setTitle}
                onChangeDescription={setDescription}
              />
            )}

            {step === "audio" && (
              <AudioStep
                store={store}
                onPickAudio={handlePickAudio}
                onRecord={handleRecord}
              />
            )}

            {step === "transcript" && (
              <TranscriptStep
                store={store}
                segments={segments}
                onMarkSegment={handleMarkSegment}
                onUpdateSegment={updateSegment}
                onAddSegment={addSegment}
                onRemoveSegment={removeSegment}
              />
            )}
          </ScrollView>
          )}

          <WizardNavBar
            step={step}
            currentIndex={currentIndex}
            canGoNext={canGoNext()}
            isSubmitting={submitLesson.isPending}
            summary={{ languageId: selectedLanguage, title, segments }}
            onNext={goNext}
            onBack={goBack}
            onSubmit={handleSubmit}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
