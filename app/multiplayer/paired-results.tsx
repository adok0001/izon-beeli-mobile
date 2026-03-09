import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { hapticHeavy } from "@/lib/haptics";

export default function PairedResultsScreen() {
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
  // which resets phase to "lobby" — navigate back to paired lesson
  useEffect(() => {
    if (phase === "lobby" && !gameResults) {
      router.replace("/multiplayer/paired-lesson");
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
            className="mt-4 rounded-xl bg-purple-500 px-6 py-3"
          >
            <Text className="font-semibold text-white">Back</Text>
          </Pressable>
        </SafeAreaView>
      </>
    );
  }

  const me = gameResults.players.find((p) => p.id === myPlayerId);
  const partner = gameResults.players.find((p) => p.id !== myPlayerId);

  const totalCorrect =
    (me?.correctAnswers ?? 0) + (partner?.correctAnswers ?? 0);
  const totalAnswers =
    (me?.totalAnswers ?? 0) + (partner?.totalAnswers ?? 0);
  const combinedAccuracy =
    totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  const scoreColor =
    combinedAccuracy >= 80
      ? "text-green-600 dark:text-green-400"
      : combinedAccuracy >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const bgColor =
    combinedAccuracy >= 80
      ? "bg-green-100 dark:bg-green-900/40"
      : combinedAccuracy >= 50
        ? "bg-amber-100 dark:bg-amber-900/40"
        : "bg-red-100 dark:bg-red-900/40";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Lesson Complete",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Success icon */}
          <View
            className={`mb-4 h-24 w-24 items-center justify-center rounded-full ${bgColor}`}
          >
            <IconSymbol
              name="person.2.fill"
              size={40}
              color={combinedAccuracy >= 80 ? "#22c55e" : combinedAccuracy >= 50 ? "#f59e0b" : "#ef4444"}
            />
          </View>

          <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-white">
            Lesson Complete!
          </Text>
          <Text className="mb-2 text-base text-neutral-500 dark:text-neutral-400">
            You both completed the lesson together
          </Text>
          <Text className="mb-6 text-sm text-purple-500">+75 XP each (co-op bonus)</Text>

          {/* Combined score */}
          <View
            className={`mb-6 h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
          >
            <Text className={`text-2xl font-bold ${scoreColor}`}>
              {combinedAccuracy}%
            </Text>
          </View>

          {/* Individual stats */}
          <View className="mb-8 w-full rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-800">
            <Text className="mb-3 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Individual Results
            </Text>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {me?.name ?? "You"}
                </Text>
                <Text className="mt-1 text-lg font-bold text-purple-500">
                  {me?.correctAnswers ?? 0}/{me?.totalAnswers ?? 0}
                </Text>
                <Text className="text-xs text-neutral-400">correct</Text>
              </View>

              <View className="mx-3 w-px bg-neutral-200 dark:bg-neutral-700" />

              <View className="flex-1 items-center">
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {partner?.name ?? "Partner"}
                </Text>
                <Text className="mt-1 text-lg font-bold text-purple-500">
                  {partner?.correctAnswers ?? 0}/{partner?.totalAnswers ?? 0}
                </Text>
                <Text className="text-xs text-neutral-400">correct</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="w-full gap-3">
            {/* Rematch with same partner */}
            <Pressable
              onPress={sendRematch}
              disabled={rematchRequested}
              className={`flex-row items-center justify-center rounded-xl py-4 active:opacity-80 ${
                rematchRequested ? "bg-purple-300" : "bg-purple-500"
              }`}
            >
              {rematchRequested ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    {partnerWantsRematch ? "Starting rematch..." : "Waiting for partner..."}
                  </Text>
                </>
              ) : (
                <>
                  <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    Rematch{partnerWantsRematch ? " (Partner ready!)" : ""}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                reset();
                router.replace("/multiplayer");
              }}
              className="items-center rounded-xl border-2 border-purple-200 py-4 active:opacity-80 dark:border-purple-800"
            >
              <Text className="text-base font-semibold text-purple-600 dark:text-purple-400">
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
