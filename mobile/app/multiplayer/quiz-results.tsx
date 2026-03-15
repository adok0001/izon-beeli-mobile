import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { hapticHeavy } from "@/lib/haptics";

export default function QuizResultsScreen() {
  const router = useRouter();
  const {
    gameResults,
    myPlayerId,
    reset,
    sendRematch,
    rematchRequested,
    partnerWantsRematch,
    phase,
  } = useMultiplayerStore();

  useEffect(() => {
    hapticHeavy();
  }, []);

  // When rematch accepted by both sides, server sends rematch_starting
  // which resets phase to "lobby" — navigate back to quiz battle lobby
  useEffect(() => {
    if (phase === "lobby" && !gameResults) {
      router.replace("/multiplayer/quiz-battle");
    }
  }, [phase, gameResults]);

  if (!gameResults) {
    return (
      <>
        <Stack.Screen options={{ title: "Results" }} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-white dark:bg-neutral-900"
          edges={[]}
        >
          <Text className="text-neutral-500">No results available</Text>
          <Pressable
            onPress={() => {
              reset();
              router.replace("/multiplayer");
            }}
            className="mt-4 rounded-xl bg-blue-500 px-6 py-3"
          >
            <Text className="font-semibold text-white">Back</Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }

  const me = gameResults.players.find((p) => p.id === myPlayerId);
  const opponent = gameResults.players.find((p) => p.id !== myPlayerId);
  const iWon = gameResults.winner === myPlayerId;
  const isTie = gameResults.winner === null;

  const myAccuracy =
    me && me.totalAnswers > 0
      ? Math.round((me.correctAnswers / me.totalAnswers) * 100)
      : 0;
  const opponentAccuracy =
    opponent && opponent.totalAnswers > 0
      ? Math.round((opponent.correctAnswers / opponent.totalAnswers) * 100)
      : 0;

  const resultColor = iWon
    ? "text-green-600 dark:text-green-400"
    : isTie
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const resultBg = iWon
    ? "bg-green-100 dark:bg-green-900/40"
    : isTie
      ? "bg-amber-100 dark:bg-amber-900/40"
      : "bg-red-100 dark:bg-red-900/40";

  const resultText = iWon ? "You Won!" : isTie ? "It's a Tie!" : "You Lost";
  const xpEarned = iWon ? 100 : 30;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Battle Results",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Result badge */}
          <View
            className={`mb-4 h-24 w-24 items-center justify-center rounded-full ${resultBg}`}
          >
            <IconSymbol
              name={iWon ? "trophy.fill" : isTie ? "equal" : ("xmark" as any)}
              size={40}
              color={iWon ? "#22c55e" : isTie ? "#f59e0b" : "#ef4444"}
            />
          </View>

          <Text className={`mb-1 text-3xl font-bold ${resultColor}`}>
            {resultText}
          </Text>
          <Text className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
            +{xpEarned} XP earned
          </Text>

          {/* Score comparison */}
          <View className="mb-8 w-full rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-800">
            <View className="flex-row items-center justify-between">
              {/* My score */}
              <View className="flex-1 items-center">
                <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {me?.name ?? "You"}
                </Text>
                <Text className="text-3xl font-bold text-blue-500">
                  {me?.score ?? 0}
                </Text>
                <Text className="mt-1 text-xs text-neutral-400">
                  {me?.correctAnswers ?? 0}/{me?.totalAnswers ?? 0} correct
                </Text>
                <Text className="text-xs text-neutral-400">
                  {myAccuracy}% accuracy
                </Text>
              </View>

              <View className="mx-4 h-16 w-px bg-neutral-200 dark:bg-neutral-700" />

              {/* Opponent score */}
              <View className="flex-1 items-center">
                <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {opponent?.name ?? "Opponent"}
                </Text>
                <Text className="text-3xl font-bold text-red-500">
                  {opponent?.score ?? 0}
                </Text>
                <Text className="mt-1 text-xs text-neutral-400">
                  {opponent?.correctAnswers ?? 0}/{opponent?.totalAnswers ?? 0}{" "}
                  correct
                </Text>
                <Text className="text-xs text-neutral-400">
                  {opponentAccuracy}% accuracy
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="w-full gap-3">
            {/* Rematch with same opponent */}
            <Pressable
              onPress={sendRematch}
              disabled={rematchRequested}
              className={`flex-row items-center justify-center rounded-xl py-4 active:opacity-80 ${
                rematchRequested ? "bg-blue-300" : "bg-blue-500"
              }`}
            >
              {rematchRequested ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    {partnerWantsRematch ? "Starting rematch..." : "Waiting for opponent..."}
                  </Text>
                </>
              ) : (
                <>
                  <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    Rematch{partnerWantsRematch ? " (Opponent ready!)" : ""}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                router.replace("/multiplayer");
              }}
              className="items-center rounded-xl border-2 border-blue-200 py-4 active:opacity-80 dark:border-blue-800"
            >
              <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
                New Match
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                router.replace("/(tabs)/learn");
              }}
              className="items-center rounded-xl border-2 border-neutral-200 py-3 active:opacity-80 dark:border-neutral-700"
            >
              <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                Back to Learn
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
