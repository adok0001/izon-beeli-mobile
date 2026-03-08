import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { ProgressBar } from "@/components/quiz/progress-bar";
import { OptionCard, type OptionState } from "@/components/quiz/option-card";
import { QuestionTypeLabel } from "@/components/quiz/question-type-label";
import {
  playCorrectSound,
  playIncorrectSound,
  playFinishSound,
} from "@/lib/sounds";
import { hapticSuccess, hapticError, hapticHeavy } from "@/lib/haptics";

function ScoreBar() {
  const { myScore, opponentScore, players, myPlayerId } =
    useMultiplayerStore();

  const me = players.find((p) => p.id === myPlayerId);
  const opponent = players.find((p) => p.id !== myPlayerId);

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <View className="items-center">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {me?.name ?? "You"}
        </Text>
        <Text className="text-2xl font-bold text-blue-500">{myScore}</Text>
      </View>
      <View className="items-center">
        <Text className="text-xs font-semibold text-neutral-400">VS</Text>
      </View>
      <View className="items-center">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {opponent?.name ?? "Opponent"}
        </Text>
        <Text className="text-2xl font-bold text-red-500">
          {opponentScore}
        </Text>
      </View>
    </View>
  );
}

function CountdownView() {
  const { timeRemaining } = useMultiplayerStore();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-8xl font-bold text-blue-500">{timeRemaining}</Text>
      <Text className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
        Get ready!
      </Text>
    </View>
  );
}

function QuestionView() {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeRemaining,
    opponentAnswered,
    lastAnswerCorrect,
    lastCorrectAnswer,
    sendAnswer,
    phase,
  } = useMultiplayerStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Reset local state on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setLocked(false);
  }, [questionIndex]);

  const handleSelect = useCallback(
    (answer: string) => {
      if (locked || !currentQuestion) return;
      setLocked(true);
      setSelectedAnswer(answer);
      sendAnswer(currentQuestion.id, answer);
    },
    [locked, currentQuestion, sendAnswer]
  );

  // Sound/haptic feedback when result arrives
  useEffect(() => {
    if (lastAnswerCorrect === null) return;
    if (lastAnswerCorrect) {
      playCorrectSound();
      hapticSuccess();
    } else {
      playIncorrectSound();
      hapticError();
    }
  }, [lastAnswerCorrect]);

  if (!currentQuestion) return null;

  const getOptionState = (option: string): OptionState => {
    if (lastAnswerCorrect === null && !locked) return "default";
    if (lastCorrectAnswer && option === lastCorrectAnswer) return "correct";
    if (
      selectedAnswer &&
      option === selectedAnswer &&
      option !== lastCorrectAnswer
    )
      return "incorrect";
    if (lastAnswerCorrect !== null) return "dimmed";
    return "default";
  };

  // Timer ring color
  const timerColor =
    timeRemaining <= 5
      ? "text-red-500"
      : timeRemaining <= 10
        ? "text-amber-500"
        : "text-blue-500";

  return (
    <View className="flex-1">
      <ScoreBar />
      <ProgressBar
        current={questionIndex + (locked ? 1 : 0)}
        total={totalQuestions}
      />

      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <View className="flex-row items-center gap-3">
            {opponentAnswered && !lastCorrectAnswer && (
              <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900">
                <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Opponent answered
                </Text>
              </View>
            )}
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Text className={`text-lg font-bold ${timerColor}`}>
                {timeRemaining}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-2">
          <QuestionTypeLabel type={currentQuestion.type} />
        </View>

        <Text className="mb-6 text-xl font-bold text-neutral-900 dark:text-white">
          {currentQuestion.prompt}
        </Text>

        {currentQuestion.options.map((option, idx) => (
          <OptionCard
            key={`${currentQuestion.id}-${idx}`}
            label={option}
            state={getOptionState(option)}
            onPress={() => handleSelect(option)}
          />
        ))}

        {lastAnswerCorrect !== null && (
          <View className="mt-2 items-center">
            <View
              className={`rounded-full px-4 py-1.5 ${
                lastAnswerCorrect
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-900"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  lastAnswerCorrect
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {lastAnswerCorrect ? "Correct!" : "Incorrect"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function QuizBattleScreen() {
  const router = useRouter();
  const { phase, reset, gameResults } = useMultiplayerStore();

  // Navigate to results when game ends
  useEffect(() => {
    if (phase === "results" && gameResults) {
      playFinishSound();
      hapticHeavy();
      router.replace("/multiplayer/quiz-results");
    }
  }, [phase, gameResults]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Quiz Battle",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={["top"]}
      >
        {phase === "countdown" ? <CountdownView /> : <QuestionView />}
      </SafeAreaView>
    </>
  );
}
