import { AudioPlayer } from "@/components/audio/audio-player";
import { InteractiveTranscript } from "@/components/audio/interactive-transcript";
import { LevelUpModal } from "@/components/level-up-modal";
import { LessonHero } from "@/components/lesson/lesson-hero";
import { LessonMetaPills } from "@/components/lesson/lesson-meta-pills";
import { LessonListen } from "@/components/lesson/lesson-listen";
import { LessonObjectives } from "@/components/lesson/lesson-objectives";
import { LessonWords } from "@/components/lesson/lesson-words";
import { ShareModal } from "@/components/share/share-modal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCompletedLessons, useCompleteLesson, useTrackListen } from "@/lib/hooks/use-progress";
import { useToast } from "@/lib/hooks/use-toast";
import { useLesson } from "@/lib/hooks/use-courses";
import { getCourseTypeColors } from "@/constants/course-colors";
import { useNextLesson } from "@/lib/hooks/use-next-lesson";
import { useQueryClient } from "@tanstack/react-query";
import type { Course } from "@/types";
import { formatDuration, getLanguageName, BUNDLED_AUDIO } from "@/lib/mock-data";
import { playFinishSound } from "@/lib/sounds";
import { hapticHeavy } from "@/lib/haptics";
import { cancelDailyStreakReminder } from "@/lib/hooks/use-daily-reminder";
import { useReviewPrompt } from "@/lib/hooks/use-review-prompt";
import { getCachedAudioSource } from "@/lib/audio-cache";
import { useAudioStore } from "@/store/audio-store";
import { analytics } from "@/lib/analytics";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useTourStore } from "@/store/tour-store";
import { useForegroundClaim, useOverlayStore } from "@/store/overlay-store";
import { localize } from "@/lib/localize";
import { JOURNEY } from "@/lib/journey";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { useHeaderHeight } from "@react-navigation/elements";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function LessonScreen() {
  const M = useMuseumTheme();
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lesson, isLoading, isError } = useLesson(id ?? "");
  const { loadAndPlay, currentTrackId, isPlaying, togglePlayback } = useAudioStore();
  const { data: completedLessonIds } = useCompletedLessons();
  const { selectedLanguageId } = useLanguageStore();
  const { uiLanguage } = useUiLanguageStore();
  const queryClient = useQueryClient();
  const courses = queryClient.getQueryData<Course[]>(["courses", selectedLanguageId]);
  const lessonCourse = courses?.find((c) => c.id === lesson?.courseId);
  const typeColors = getCourseTypeColors(lessonCourse?.courseType);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [pendingSummary, setPendingSummary] = useState(false);
  const [isResolvingAudio, setIsResolvingAudio] = useState(false);

  useEffect(() => {
    if (pendingSummary && !isPlaying) {
      setShowSummary(true);
      setPendingSummary(false);
    }
  }, [pendingSummary, isPlaying]);

  const { t } = useTranslation();
  const { toast, success: toastSuccess, dismiss: dismissToast } = useToast();
  const { data: nextLessonData } = useNextLesson(selectedLanguageId);
  const showTour = useTourStore((s) => s.showTour);
  const hasSeen = useTourStore((s) => s.hasSeen);
  const reviewPrompt = useReviewPrompt();

  // Queue the milestone celebration; hold the foreground while the lesson stays
  // in front of the learner so the app-level modal waits until they move on.
  const isFocused = useIsFocused();
  const pendingStreak = useOverlayStore((s) => s.pendingStreak);
  const [streakHolding, setStreakHolding] = useState(false);
  useForegroundClaim(streakHolding && isFocused);
  useEffect(() => {
    if (!pendingStreak) setStreakHolding(false);
  }, [pendingStreak]);

  const handleStreakUpdate = useCallback(
    (streak: number, isMilestone: boolean) => {
      if (isMilestone) {
        useOverlayStore.getState().showStreak(streak, true);
        setStreakHolding(true);
      } else {
        toastSuccess(t("streak.toastTitle", { count: streak }));
      }
    },
    [toastSuccess, t]
  );

  const completeLesson = useCompleteLesson({
    onLevelUp: (level, title) => {
      analytics.levelUp(level, title);
      setLevelUp({ level, title });
      reviewPrompt.onLevelUp(level);
    },
    onStreakUpdate: (streak, isMilestone) => {
      reviewPrompt.onStreakUpdate(streak);
      handleStreakUpdate(streak, isMilestone);
    },
  });
  const trackListen = useTrackListen({ onStreakUpdate: handleStreakUpdate });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: t("lesson.title"), headerStyle: { backgroundColor: M.ink }, headerTintColor: M.parchment }} />
        <LoadingScreen />
      </>
    );
  }

  if (isError || !lesson) {
    return (
      <>
        <Stack.Screen options={{ title: t("lesson.title"), headerStyle: { backgroundColor: M.ink }, headerTintColor: M.parchment }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: M.bg }}>
          <IconSymbol name="book.fill" size={40} color={M.textDimDark} />
          <Text style={{ marginTop: 12, fontSize: 15, color: M.sub }}>{t("lesson.notFound")}</Text>
        </View>
      </>
    );
  }

  const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];
  const isCurrentTrack = currentTrackId === lesson.id;
  const completed = completedLessonIds?.includes(lesson.id) ?? false;
  const isSong = lesson.type === "song";
  const lessonTitle = localize(lesson.title, uiLanguage);
  const lessonDescription = localize(lesson.description, uiLanguage);
  const accentColor = typeColors.tickActive ?? M.accent;

  const handlePlayAudio = async () => {
    if (isCurrentTrack) {
      togglePlayback();
      return;
    }
    if (!audioSource) return;
    setIsResolvingAudio(true);
    const resolved = await getCachedAudioSource(lesson.id, audioSource);
    setIsResolvingAudio(false);
    loadAndPlay(lesson.id, resolved ?? audioSource, lessonTitle, `/lesson/${lesson.id}`, {
      onFinish: () => trackListen.mutate(lesson.id),
    });
    analytics.lessonStarted(lesson.id, selectedLanguageId);
  };

  const wordCount = (() => {
    if (lesson.vocab?.length) return lesson.vocab.length;
    if (!lesson.transcript?.length) return undefined;
    return new Set(
      lesson.transcript
        .flatMap((s) => s.text.split(/\s+/))
        .map((w) => w.toLowerCase().replace(/[.,!?;:'"]/g, ""))
        .filter(Boolean)
    ).size;
  })();

  const overline = [
    typeColors.label,
    lessonCourse?.level ? t(`levels.${lessonCourse.level}`, { defaultValue: lessonCourse.level }) : null,
  ]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  const handleMarkComplete = () => {
    completeLesson.mutate(lesson.id);
    playFinishSound();
    hapticHeavy();
    analytics.lessonCompleted(lesson.id, selectedLanguageId);
    cancelDailyStreakReminder().catch(() => {});
    if (isCurrentTrack && isPlaying) {
      setPendingSummary(true);
    } else {
      setShowSummary(true);
    }
    setTimeout(() => {
      if (!hasSeen("journal")) showTour("journal");
      else if (!hasSeen("practice")) showTour("practice");
    }, 1500);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerTitle: "",
          headerTintColor: JOURNEY.sheetBg,
          headerBackTitle: t("common.back"),
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => setShareVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("share.shareButton")}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={JOURNEY.sheetBg} />
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        {showSummary ? (
          /* ── Post-lesson summary ── */
          <ScrollView
            style={{ flex: 1, backgroundColor: M.bg }}
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: headerHeight + 16, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: M.successBg,
                  borderWidth: 1.5,
                  borderColor: M.successBorder,
                }}
              >
                <IconSymbol name="checkmark.circle.fill" size={38} color={M.success} />
              </View>
              <Text
                style={{ marginTop: 14, fontSize: 22, fontWeight: "900", color: M.text, letterSpacing: -0.3 }}
              >
                {t("lesson.summary")}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
              {wordCount ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 16,
                    borderRadius: 16,
                    backgroundColor: M.accentGlow,
                    borderWidth: 1,
                    borderColor: M.accentBorder,
                  }}
                >
                  <Text style={{ fontSize: 26, fontWeight: "900", color: M.accent }}>{wordCount}</Text>
                  <Text
                    style={{ marginTop: 4, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}
                  >
                    {t("lesson.wordsLearned")}
                  </Text>
                </View>
              ) : null}
              {lesson.duration ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 16,
                    borderRadius: 16,
                    backgroundColor: M.successBg,
                    borderWidth: 1,
                    borderColor: M.successBorder,
                  }}
                >
                  <Text style={{ fontSize: 26, fontWeight: "900", color: M.success }}>
                    {formatDuration(lesson.duration)}
                  </Text>
                  <Text
                    style={{ marginTop: 4, fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: M.muted }}
                  >
                    {t("lesson.timeSpent")}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={{ width: 16, height: 1, backgroundColor: `${accentColor}60` }} />
              <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase", color: M.muted }}>
                {t("lesson.whatsNext")}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
            </View>

            <View style={{ gap: 10 }}>
              {nextLessonData?.lesson && nextLessonData.lesson.id !== lesson.id && (
                <Pressable
                  onPress={() => {
                    setShowSummary(false);
                    router.replace(`/lesson/${nextLessonData.lesson!.id}`);
                  }}
                  style={{ borderRadius: 16, overflow: "hidden" }}
                  className="active:opacity-75"
                  accessibilityRole="button"
                  accessibilityLabel={t("lesson.continueToNext")}
                >
                  <LinearGradient
                    colors={["#D89A3A", JOURNEY.bronze]}
                    style={{ paddingVertical: 16, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: JOURNEY.sheetBg }}>
                      {t("lesson.continueToNext")} ›
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => router.push({ pathname: "/quiz", params: { courseId: lesson.courseId, lessonId: lesson.id } })}
                  style={{
                    flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16,
                    borderWidth: 1, borderColor: `${accentColor}35`, backgroundColor: `${accentColor}08`,
                  }}
                  className="active:opacity-70"
                  accessibilityRole="button"
                >
                  <IconSymbol name="trophy.fill" size={18} color={accentColor} />
                  <Text style={{ marginTop: 5, fontSize: 12, fontWeight: "700", color: accentColor }}>{t("lesson.takeQuiz")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: "/word-review", params: { lessonId: lesson.id } })}
                  style={{
                    flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16,
                    borderWidth: 1, borderColor: M.successBorder, backgroundColor: M.successBg,
                  }}
                  className="active:opacity-70"
                  accessibilityRole="button"
                >
                  <IconSymbol name="brain.head.profile" size={18} color={M.success} />
                  <Text style={{ marginTop: 5, fontSize: 12, fontWeight: "700", color: M.success }}>{t("lesson.reviewWords")}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/journal" as any)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
                  borderWidth: 1, borderColor: M.border, backgroundColor: M.card,
                }}
                className="active:opacity-70"
                accessibilityRole="button"
              >
                <IconSymbol name="pencil.and.list.clipboard" size={16} color={M.muted} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: M.sub }}>{t("lesson.writeReflection")}</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowSummary(false)}
                style={{ alignItems: "center", paddingVertical: 12 }}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 13, color: M.muted }}>
                  {isSong ? t("songs.lyrics") : t("lesson.transcript")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          /* ── Galerie lesson detail ── */
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
          >
            {/* Hero scene */}
            <LessonHero title={lessonTitle} overline={overline} accentColor={accentColor} scene={lesson.scene} />

            {/* Song artist */}
            {isSong && lesson.artist ? (
              <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
                <Text style={{ fontSize: 12, color: M.muted }}>
                  {lesson.artist}
                  {lesson.genre ? ` · ${t(`songs.genre_${lesson.genre}`, { defaultValue: lesson.genre })}` : ""}
                </Text>
              </View>
            ) : null}

            {/* Meta pills */}
            <LessonMetaPills
              level={lessonCourse?.level}
              wordCount={wordCount}
              duration={lesson.duration}
              accentColor={accentColor}
            />

            {/* Basic audio + transcript — the core listen experience */}
            {audioSource ? (
              <LessonListen
                trackId={lesson.id}
                source={audioSource}
                title={lessonTitle}
                route={`/lesson/${lesson.id}`}
                segments={lesson.transcript ?? []}
                transcriptLabel={(isSong ? t("songs.lyrics") : t("lesson.transcript")).toUpperCase()}
                onFinish={() => trackListen.mutate(lesson.id)}
              />
            ) : null}

            {/* Objectives */}
            {lesson.objectives?.length ? (
              <LessonObjectives
                objectives={lesson.objectives}
                uiLanguage={uiLanguage}
                accentColor={accentColor}
              />
            ) : null}

            {/* New vocabulary */}
            {lesson.vocab?.length ? (
              <LessonWords vocab={lesson.vocab} uiLanguage={uiLanguage} accentColor={accentColor} />
            ) : null}

            {/* Transcript fallback — only for transcript-only lessons with no audio
                (lessons with audio render the synced LessonListen block above). */}
            {!audioSource && lesson.transcript?.length ? (
              <View style={{ paddingTop: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, marginBottom: 12 }}>
                  <View style={{ width: 16, height: 1, backgroundColor: `${accentColor}60` }} />
                  <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, color: M.accent }}>
                    {(isSong ? t("songs.lyrics") : t("lesson.transcript")).toUpperCase()}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
                </View>
                <View style={{ paddingHorizontal: 4 }}>
                  <InteractiveTranscript segments={lesson.transcript} />
                </View>
              </View>
            ) : null}

            {/* Primary CTA */}
            <View style={{ paddingHorizontal: 22, paddingTop: 28 }}>
              {/* Completed badge */}
              {completed && (
                <View
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, paddingVertical: 8, marginBottom: 12, borderRadius: 12,
                    backgroundColor: M.successBg,
                    borderWidth: 1, borderColor: M.successBorder,
                  }}
                >
                  <IconSymbol name="checkmark.circle.fill" size={13} color={M.success} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: M.success, letterSpacing: 0.5 }}>
                    {t("lesson.done").toUpperCase()}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={audioSource ? handlePlayAudio : handleMarkComplete}
                disabled={isResolvingAudio}
                style={{ borderRadius: 16, overflow: "hidden" }}
                className="active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel={t("lesson.startLesson", { defaultValue: "Start lesson" })}
                accessibilityState={{ busy: isResolvingAudio }}
              >
                <LinearGradient
                  colors={["#D89A3A", JOURNEY.bronze]}
                  style={{ paddingVertical: 17, alignItems: "center" }}
                >
                  {isResolvingAudio ? (
                    <ActivityIndicator color={JOURNEY.sheetBg} />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: "800", color: JOURNEY.sheetBg }}>
                      {isCurrentTrack && isPlaying
                        ? t("lesson.pause")
                        : completed
                        ? t("journey.review", { defaultValue: "Review lesson" })
                        : t("lesson.startLesson", { defaultValue: "Start lesson" })} ›
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Secondary: mark complete */}
              {!completed && (
                <Pressable
                  onPress={handleMarkComplete}
                  style={{
                    marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 7, paddingVertical: 12, borderRadius: 14,
                    borderWidth: 1, borderColor: M.successBorder,
                    backgroundColor: M.successBg,
                  }}
                  className="active:opacity-75"
                  accessibilityRole="button"
                >
                  <IconSymbol name="checkmark.circle.fill" size={14} color={M.success} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: M.success }}>
                    {isSong ? t("songs.listened") : t("lesson.markComplete")}
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}

        {/* Lessons with the inline LessonListen player don't need the global
            mini-bar too; show it only for the summary view to avoid a duplicate. */}
        {isCurrentTrack && (!audioSource || showSummary) && <AudioPlayer />}
      </SafeAreaView>

      <LevelUpModal
        visible={!!levelUp}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
        onDismiss={() => setLevelUp(null)}
      />

      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        data={{
          template: "lesson",
          id: lesson.id,
          title: lessonTitle,
          description: lessonDescription || undefined,
          language: getLanguageName(selectedLanguageId),
        }}
      />
    </>
  );
}
