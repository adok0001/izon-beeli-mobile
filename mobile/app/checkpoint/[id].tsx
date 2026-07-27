import { CheckpointQuestionView } from "@/components/games/checkpoint-question-view";
import { GameProgress, GameResultView, GameStatChip } from "@/components/games/game-kit";
import { LoadingScreen } from "@/components/loading-screen";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import type { DictionaryEntry } from "@/lib/dictionary";
import { buildCheckpointRound, isCorrectAnswer, type CheckpointQuestion } from "@/lib/checkpoint-rounds";
import { anchorLessonIdFrom, findCheckpoint, isPassingScore, isScored, lessonAfterCheckpoint } from "@/lib/checkpoints";
import { hapticError, hapticHeavy, hapticSuccess } from "@/lib/haptics";
import { useCheckpointLessons, useCheckpoints, usePassCheckpoint } from "@/lib/hooks/use-checkpoints";
import { useDictionary } from "@/lib/hooks/use-dictionary";
import { useStreakCelebration } from "@/lib/hooks/use-progress";
import { tWithVars } from "@/lib/i18n-dynamic";
import { playCorrectSound, playFinishSound, playIncorrectSound } from "@/lib/sounds";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Stable empty default — a fresh `[]` each render would rebuild the round. */
const EMPTY_DICTIONARY: DictionaryEntry[] = [];

/** Per-format identity hue, so each checkpoint reads as its own kind of round. */
const FORMAT_ACCENT = {
  recall: getAccent("amber"),
  listen: getAccent("sky"),
  build: getAccent("orange"),
  match: getAccent("purple"),
} as const;

/**
 * The required mini-game gate between every run of five lessons.
 *
 * Owns scoring, the pass/fail decision, and recording the clear;
 * `CheckpointQuestionView` owns how a single question looks. A failed attempt
 * doesn't strand the learner — it offers a retry with a freshly built round, so
 * a miss means practising again rather than memorising the same eight answers.
 */
export default function CheckpointScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedLanguageId } = useLanguageStore();

  const { checkpoints, orderedLessons, isLoading: checkpointsLoading } = useCheckpoints(selectedLanguageId);
  const checkpoint = findCheckpoint(id ?? "", checkpoints);

  // Fall back to the anchor lesson alone when the checkpoint isn't in the list
  // yet (deep link before the course/lesson queries settle) so the round still
  // has something to build from rather than rendering an empty gate.
  // The game row rides along with the covered lessons: it carries the block's
  // authored word list, which is deliberately absent from every transcript.
  const coveredIds = useMemo(() => {
    if (!checkpoint) return id ? [anchorLessonIdFrom(id)] : [];
    return checkpoint.gameLessonId
      ? [...checkpoint.lessonIds, checkpoint.gameLessonId]
      : checkpoint.lessonIds;
  }, [checkpoint, id]);
  const { lessons, isLoading: lessonsLoading, allLoaded } = useCheckpointLessons(coveredIds);
  // The word formats intersect this with the covered lessons' transcripts — the
  // API doesn't serve lesson-authored vocab, so without it half the round dies.
  const { data: dictionary = EMPTY_DICTIONARY, isLoading: dictLoading } =
    useDictionary(selectedLanguageId);

  const passCheckpoint = usePassCheckpoint();
  const { onStreakUpdate, toast, dismissToast } = useStreakCelebration();

  const [attempt, setAttempt] = useState(1);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answer, setAnswer] = useState<string | string[] | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);

  const format = checkpoint?.format ?? "recall";
  const accent = FORMAT_ACCENT[format];

  // Rebuilt per attempt so a retry asks fresh questions, not the same eight.
  const questions = useMemo(
    () => buildCheckpointRound(lessons, format, dictionary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessons, format, dictionary, attempt]
  );

  const total = questions.length;
  const question: CheckpointQuestion | undefined = questions[index];
  const kind = checkpoint?.kind ?? "checkpoint";
  const passed = isPassingScore(correctCount, total, kind);
  const nextLesson = checkpoint ? lessonAfterCheckpoint(checkpoint, orderedLessons) : undefined;

  // Whether the clear reached the server. Until it does, the gate is still shut
  // — so the result screen must not offer to walk on to the next lesson.
  const savePending = passCheckpoint.isPending;
  const saveFailed = passCheckpoint.isError;

  const recordClear = useCallback(() => {
    if (!checkpoint) return;
    passCheckpoint.mutate(
      {
        checkpointId: checkpoint.id,
        languageId: selectedLanguageId,
        correct: correctCount,
        total,
        attempts: attempt,
      },
      {
        onSuccess: (res) => {
          if (res.streakIncremented && res.streak) {
            onStreakUpdate(res.streak, !!res.streakMilestone);
          }
        },
      }
    );
    // `passCheckpoint` and `onStreakUpdate` are recreated each render; including
    // them would make this callback unstable and re-run the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint, selectedLanguageId, correctCount, total, attempt]);

  // Record the clear once per passing round. Guarded by a ref rather than the
  // mutation's own state so a re-render can't fire a second POST.
  useEffect(() => {
    if (!finished || !passed || recorded.current || !checkpoint) return;
    recorded.current = true;
    playFinishSound();
    hapticHeavy();
    recordClear();
  }, [finished, passed, checkpoint, recordClear]);

  const handleRetrySave = useCallback(() => recordClear(), [recordClear]);

  /** Lock in an answer: score it, and give the matching haptic + sound. */
  const lockIn = useCallback((q: CheckpointQuestion, given: string | string[]) => {
    const right = isCorrectAnswer(q, given);
    setAnswered(true);
    setCorrectCount((c) => c + (right ? 1 : 0));
    if (right) {
      hapticSuccess();
      playCorrectSound();
    } else {
      hapticError();
      playIncorrectSound();
    }
  }, []);

  const handleAnswer = useCallback(
    (given: string | string[]) => {
      if (answered) return;
      setAnswer(given);
      // A choice locks in immediately; building a sentence needs a Check press.
      if (question?.kind === "choice") lockIn(question, given);
    },
    [answered, question, lockIn]
  );

  const handleCheckOrder = useCallback(() => {
    if (!question || answered) return;
    lockIn(question, answer ?? []);
  }, [question, answered, answer, lockIn]);

  const handleNext = useCallback(() => {
    setAnswer(null);
    setAnswered(false);
    if (index + 1 >= total) setFinished(true);
    else setIndex((i) => i + 1);
  }, [index, total]);

  const handleRetry = useCallback(() => {
    setAttempt((a) => a + 1);
    setIndex(0);
    setCorrectCount(0);
    setAnswer(null);
    setAnswered(false);
    setFinished(false);
  }, []);

  const handleContinue = useCallback(() => {
    if (nextLesson) router.replace({ pathname: "/lesson/[id]", params: { id: nextLesson.id } });
    else router.replace("/(tabs)/learn");
  }, [nextLesson, router]);

  const handleWaive = useCallback(() => {
    // Only record the waiver when every covered lesson actually loaded. A
    // partial fetch produces a thin round indistinguishable from a real content
    // gap, and waiving on that would unlock the gate forever over bad network.
    if (checkpoint && allLoaded && !recorded.current) {
      recorded.current = true;
      passCheckpoint.mutate({
        checkpointId: checkpoint.id,
        languageId: selectedLanguageId,
        correct: 0,
        total: 0,
        attempts: 1,
        waived: true,
      });
    }
    handleContinue();
    // `passCheckpoint` is recreated each render; the ref guard is what makes
    // this fire once, so it stays out of the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint, allLoaded, selectedLanguageId, handleContinue]);

  // Leaving mid-round abandons the attempt but never clears the gate — the
  // lesson beyond stays locked, so this is an exit, not a skip. Without it the
  // modal has no controls at all and the learner is simply trapped.
  const handleClose = useCallback(() => router.replace("/(tabs)/learn"), [router]);

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={handleClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("checkpoint.backToPath")}
      >
        <IconSymbol name="xmark" size={20} color={MUSEUM.parchment} />
      </Pressable>
    ),
    [handleClose, t]
  );

  // Memoized, and not optional: `<Stack.Screen options>` is applied via
  // `navigation.setOptions` in an effect keyed on the object's identity. A
  // fresh literal each render sets options every render, which updates
  // navigator state, which re-renders — the passive-update loop that crashed
  // this screen. `matching-game.tsx` memoizes for the same reason.
  //
  // Chrome (ink background, parchment tint, bold title) is inherited from the
  // root Stack's screenOptions — only what's specific to this screen is set.
  const screenOptions = useMemo(
    () => ({
      title:
        kind === "intro"
          ? t("checkpoint.introNodeLabel")
          : tWithVars(t, "checkpoint.nodeLabel", { n: checkpoint?.ordinal ?? 1 }),
      headerShown: true,
      presentation: "fullScreenModal" as const,
      headerLeft,
      // The gate is required, so it can't be dismissed by a back swipe or a
      // back button — leaving is a deliberate tap on the close control.
      headerBackVisible: false,
      gestureEnabled: false,
    }),
    [kind, checkpoint?.ordinal, t, headerLeft]
  );

  if (checkpointsLoading || lessonsLoading || dictLoading) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <LoadingScreen />
      </>
    );
  }

  // The path loaded but this id isn't on it — a stale deep link, or a language
  // switch since the link was made. Say so and offer a way out. Falling through
  // to the round below would render a gate with nothing behind it: every action
  // needs `checkpoint`, so the screen would look interactive and do nothing.
  if (!checkpoint) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="flag.fill" size={52} color={M.border} />
            <Text style={{ marginTop: 16, fontSize: 17, fontWeight: "700", color: M.sub, textAlign: "center" }}>
              {t("checkpoint.missingTitle")}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: M.muted, textAlign: "center" }}>
              {t("checkpoint.missingBody")}
            </Text>
            <Pressable
              onPress={() => router.replace("/(tabs)/learn")}
              style={{
                marginTop: 24, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28,
                backgroundColor: accent.solid,
              }}
              className="active:opacity-80"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.ink }}>{t("checkpoint.backToPath")}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Not enough material to ask fair questions. Rather than trap the learner
  // behind a gate that can't be cleared, waive it — a checkpoint with no
  // content is a content gap, not a failed attempt. The waiver has to be
  // *recorded*, or the gate stays active and the lessons past it stay locked.
  if (total === 0) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="flag.fill" size={52} color={M.border} />
            <Text style={{ marginTop: 16, fontSize: 17, fontWeight: "700", color: M.sub, textAlign: "center" }}>
              {t("checkpoint.emptyTitle")}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: M.muted, textAlign: "center" }}>
              {allLoaded ? t("checkpoint.emptyBody") : t("checkpoint.emptyOfflineBody")}
            </Text>
            <Pressable
              onPress={handleWaive}
              style={{
                marginTop: 24, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28,
                backgroundColor: accent.solid,
              }}
              className="active:opacity-80"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.ink }}>{t("checkpoint.continue")}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (finished) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
          {/* Both kinds show correct-of-total. A bare count read as a score
              against nothing ("8 · WARM-UP"); the headline and subtitle are what
              say whether this was a test, and for an intro, seeing how many you
              already recognised is the interesting part. */}
          <GameResultView
            accent={accent}
            stat={`${correctCount}/${total}`}
            statLabel={t("checkpoint.scoreLabel").toUpperCase()}
            headline={
              !isScored({ kind })
                ? t("checkpoint.introPassedTitle")
                : passed
                  ? t("checkpoint.passedTitle")
                  : t("checkpoint.failedTitle")
            }
            subtitle={
              saveFailed
                ? t("checkpoint.saveFailedBody")
                : !isScored({ kind })
                  ? t("checkpoint.introPassedBody")
                  : passed
                    ? t("checkpoint.passedBody")
                    : t("checkpoint.failedBody")
            }
            actions={
              !passed
                ? [{ label: t("checkpoint.tryAgain"), onPress: handleRetry, kind: "primary" as const }]
                : saveFailed
                  ? [
                      // The clear never reached the server, so the gate is still
                      // shut. Offering "continue" here would walk the learner
                      // into a lesson that is still locked.
                      { label: t("checkpoint.retrySave"), onPress: handleRetrySave, kind: "primary" as const },
                      { label: t("checkpoint.backToPath"), onPress: () => router.replace("/(tabs)/learn"), kind: "ghost" as const },
                    ]
                  : [
                      {
                        label: savePending
                          ? t("checkpoint.saving")
                          : nextLesson
                            ? t("checkpoint.continue")
                            : t("checkpoint.backToPath"),
                        onPress: savePending ? () => {} : handleContinue,
                        kind: "primary" as const,
                      },
                    ]
            }
          />
          <NotificationBanner
            visible={toast.visible}
            title={toast.title}
            body={toast.body}
            type={toast.type}
            onDismiss={dismissToast}
          />
        </SafeAreaView>
      </>
    );
  }

  const canCheckOrder = question?.kind === "order" && Array.isArray(answer) && answer.length > 0;

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.muted, letterSpacing: 0.5 }}>
            {tWithVars(t, "checkpoint.questionOf", { current: index + 1, total })}
          </Text>
          <GameStatChip value={correctCount} label={t("checkpoint.scoreLabel").toUpperCase()} accent={accent} />
        </View>

        <GameProgress current={index} total={total} accent={accent} variant="segments" />

        <View style={{ flex: 1, justifyContent: "center" }}>
          {question ? (
            <CheckpointQuestionView
              question={question}
              accent={accent}
              answer={answer}
              answered={answered}
              onAnswer={handleAnswer}
            />
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          {answered ? (
            <Pressable
              onPress={handleNext}
              style={{ borderRadius: 14, paddingVertical: 16, backgroundColor: accent.solid, alignItems: "center" }}
              className="active:opacity-80"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.ink }}>
                {index + 1 >= total ? t("checkpoint.seeResult") : t("checkpoint.next")}
              </Text>
            </Pressable>
          ) : question?.kind === "order" ? (
            <Pressable
              onPress={handleCheckOrder}
              disabled={!canCheckOrder}
              style={{
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                backgroundColor: canCheckOrder ? accent.solid : M.card,
                borderWidth: canCheckOrder ? 0 : 1,
                borderColor: M.border,
              }}
              className="active:opacity-80"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canCheckOrder }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: canCheckOrder ? M.ink : M.muted }}>
                {t("checkpoint.check")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
      </SafeAreaView>
    </>
  );
}
