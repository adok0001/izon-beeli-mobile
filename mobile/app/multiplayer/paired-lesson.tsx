import { getAccent } from "@/constants/accent-colors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { OptionCard } from "@/components/quiz/option-card";
import { ProgressBar } from "@/components/quiz/progress-bar";
import {
  playCorrectSound,
  playIncorrectSound,
  playFinishSound,
} from "@/lib/sounds";
import { hapticSuccess, hapticError, hapticHeavy } from "@/lib/haptics";

const REACTIONS = ["👍", "👏", "🔥", "❤️", "😄"];

function ChatBubble({
  text,
  playerName,
  isMe,
  isExercise,
  correct,
}: {
  text: string;
  playerName: string;
  isMe: boolean;
  isExercise?: boolean;
  correct?: boolean;
}) {
  const bgColor = isMe
    ? isExercise
      ? correct
        ? "bg-green-500"
        : correct === false
          ? "bg-red-500"
          : "bg-blue-500"
      : "bg-blue-500"
    : isExercise
      ? correct
        ? "bg-green-400 dark:bg-green-600"
        : correct === false
          ? "bg-red-400 dark:bg-red-600"
          : "bg-neutral-300 dark:bg-neutral-600"
      : "bg-neutral-200 dark:bg-neutral-700";

  const textColor =
    isMe || isExercise
      ? "text-white"
      : "text-neutral-900 dark:text-white";

  return (
    <View
      className={`mb-2 max-w-[80%] ${isMe ? "self-end" : "self-start"}`}
    >
      <Text className="mb-0.5 text-[10px] text-neutral-400">
        {playerName}
      </Text>
      <View className={`rounded-2xl px-4 py-2.5 ${bgColor}`}>
        <Text className={`text-sm ${textColor}`}>{text}</Text>
      </View>
    </View>
  );
}

export default function PairedLessonScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [chatInput, setChatInput] = useState("");
  const [messageLog, setMessageLog] = useState<
    {
      id: string;
      text: string;
      playerName: string;
      isMe: boolean;
      isExercise?: boolean;
      correct?: boolean;
    }[]
  >([]);

  const {
    phase,
    currentExercise,
    exerciseIndex,
    totalExercises,
    currentTurn,
    myPlayerId,
    players,
    chatMessages,
    lastAnswerCorrect,
    lastCorrectAnswer,
    connectionStatus,
    sendAnswer,
    sendReaction,
    sendChat,
    gameResults,
  } = useMultiplayerStore();

  const isMyTurn = currentTurn === myPlayerId;
  const [locked, setLocked] = useState(false);

  // Reset lock when exercise changes
  useEffect(() => {
    setLocked(false);
  }, [exerciseIndex]);

  // Add chat messages to log
  useEffect(() => {
    const newMsgs = chatMessages.map((m) => ({
      id: m.id,
      text: m.text,
      playerName: m.playerName,
      isMe: m.playerId === myPlayerId,
    }));
    setMessageLog((prev) => {
      const existingIds = new Set(prev.filter((p) => !p.isExercise).map((p) => p.id));
      const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));
      return [...prev, ...toAdd];
    });
  }, [chatMessages]);

  // Sound feedback on answer result
  useEffect(() => {
    if (lastAnswerCorrect === null) return;
    if (lastAnswerCorrect) {
      playCorrectSound();
      hapticSuccess();
    } else {
      playIncorrectSound();
      hapticError();
    }

    // Add exercise result to message log
    const partner = players.find((p) => p.id !== myPlayerId);
    const answerer = currentTurn === myPlayerId ? partner : players.find((p) => p.id === myPlayerId);
    setMessageLog((prev) => [
      ...prev,
      {
        id: `ex-${exerciseIndex}-${Date.now()}`,
        text: `${lastCorrectAnswer ? `Answer: ${lastCorrectAnswer}` : ""}`,
        playerName: answerer?.name ?? "Player",
        isMe: currentTurn !== myPlayerId,
        isExercise: true,
        correct: lastAnswerCorrect,
      },
    ]);
  }, [lastAnswerCorrect]);

  // Navigate to results
  useEffect(() => {
    if (phase === "results" && gameResults) {
      playFinishSound();
      hapticHeavy();
      router.replace("/multiplayer/paired-results");
    }
  }, [phase, gameResults]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messageLog.length, currentExercise]);

  const handleSelect = useCallback(
    (answer: string) => {
      if (locked || !currentExercise || !isMyTurn) return;
      setLocked(true);
      sendAnswer(currentExercise.id, answer);
    },
    [locked, currentExercise, isMyTurn, sendAnswer]
  );

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim());
    setChatInput("");
  };

  const me = players.find((p) => p.id === myPlayerId);
  const partner = players.find((p) => p.id !== myPlayerId);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Paired Lesson",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={["top"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Reconnecting banner */}
          {connectionStatus === "reconnecting" && (
            <View className="flex-row items-center justify-center bg-amber-500 px-5 py-2">
              <Text className="text-xs font-semibold text-white">
                Reconnecting...
              </Text>
            </View>
          )}

          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
            <View className="flex-row items-center">
              <IconSymbol
                name="person.2.fill"
                size={20}
                color={getAccent("purple").solid}
              />
              <Text className="ml-2 text-base font-bold text-neutral-900 dark:text-white">
                {me?.name ?? "You"} & {partner?.name ?? "Partner"}
              </Text>
            </View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {exerciseIndex + 1}/{totalExercises}
            </Text>
          </View>

          <ProgressBar current={exerciseIndex} total={totalExercises} />

          {/* Message area */}
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-5 pt-3"
            showsVerticalScrollIndicator={false}
          >
            {messageLog.map((msg) => (
              <ChatBubble
                key={msg.id}
                text={msg.text}
                playerName={msg.playerName}
                isMe={msg.isMe}
                isExercise={msg.isExercise}
                correct={msg.correct}
              />
            ))}

            {/* Current exercise */}
            {currentExercise && (
              <View className="my-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <Text className="mb-1 text-xs font-semibold text-purple-500">
                  {isMyTurn ? "Your Turn" : `${partner?.name ?? "Partner"}'s Turn`}
                </Text>
                <Text className="mb-4 text-base font-bold text-neutral-900 dark:text-white">
                  {currentExercise.prompt}
                </Text>

                {isMyTurn ? (
                  currentExercise.options.map((option, idx) => (
                    <OptionCard
                      key={`${currentExercise.id}-${idx}`}
                      label={option}
                      state={locked ? "dimmed" : "default"}
                      onPress={() => handleSelect(option)}
                    />
                  ))
                ) : (
                  <View className="items-center py-4">
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      Waiting for {partner?.name ?? "partner"} to answer...
                    </Text>
                  </View>
                )}
              </View>
            )}
            <View className="h-4" />
          </ScrollView>

          {/* Reactions */}
          <View className="flex-row justify-center gap-2 border-t border-neutral-100 px-5 py-2 dark:border-neutral-800">
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => sendReaction(emoji)}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 active:opacity-70 dark:bg-neutral-800"
              >
                <Text className="text-lg">{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Chat input */}
          <View className="flex-row items-center gap-2 border-t border-neutral-100 px-5 py-2 dark:border-neutral-800">
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Send a message..."
              placeholderTextColor=M.muted
              maxLength={200}
              onSubmitEditing={handleSendChat}
              returnKeyType="send"
              className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-white"
            />
            <Pressable
              onPress={handleSendChat}
              disabled={!chatInput.trim()}
              className="h-10 w-10 items-center justify-center rounded-full bg-purple-500 active:opacity-80 disabled:opacity-40"
            >
              <IconSymbol
                name="arrow.up"
                size={18}
                color="#fff"
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
