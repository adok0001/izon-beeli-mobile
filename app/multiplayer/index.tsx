import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguageStore } from "@/store/language-store";
import {
  useCreateSession,
  useJoinSession,
  useJoinMatchmaking,
  useRecentSessions,
} from "@/lib/hooks/use-multiplayer";
import type { GameSessionType } from "@/types";

function ModeCard({
  title,
  subtitle,
  color,
  icon,
  onQuickPlay,
  onInvite,
  loading,
}: {
  title: string;
  subtitle: string;
  color: "blue" | "purple";
  icon: string;
  onQuickPlay: () => void;
  onInvite: () => void;
  loading: boolean;
}) {
  const bg = color === "blue" ? "bg-blue-500" : "bg-purple-500";
  const bgLight =
    color === "blue"
      ? "bg-blue-50 dark:bg-blue-950"
      : "bg-purple-50 dark:bg-purple-950";
  const textColor =
    color === "blue"
      ? "text-blue-700 dark:text-blue-300"
      : "text-purple-700 dark:text-purple-300";

  return (
    <View className={`mb-4 rounded-2xl ${bgLight} p-5`}>
      <View className="mb-3 flex-row items-center">
        <View
          className={`mr-3 h-12 w-12 items-center justify-center rounded-xl ${bg}`}
        >
          <IconSymbol name={icon as any} size={24} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            {title}
          </Text>
          <Text className={`text-sm ${textColor}`}>{subtitle}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onQuickPlay}
          disabled={loading}
          className={`flex-1 items-center rounded-xl ${bg} py-3.5 active:opacity-80`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="font-semibold text-white">Quick Play</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onInvite}
          disabled={loading}
          className="flex-1 items-center rounded-xl border-2 border-neutral-200 py-3.5 active:opacity-80 dark:border-neutral-700"
        >
          <Text className="font-semibold text-neutral-700 dark:text-neutral-300">
            Invite Friend
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MultiplayerHubScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const createSession = useCreateSession();
  const joinSession = useJoinSession();
  const joinMatchmaking = useJoinMatchmaking();
  const { data: recentSessions = [] } = useRecentSessions();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleInvite = async (type: GameSessionType) => {
    try {
      const session = await createSession.mutateAsync({
        type,
        languageId: selectedLanguageId,
      });
      router.push({
        pathname: "/multiplayer/lobby",
        params: {
          sessionId: session.id,
          inviteCode: session.inviteCode ?? "",
          type: session.type,
          partyRoomId: session.partyRoomId,
          languageId: selectedLanguageId,
        },
      });
    } catch (err: any) {
      Alert.alert("Session Error", err?.message ?? "Failed to create session. Please try again.");
    }
  };

  const handleQuickPlay = async (type: GameSessionType) => {
    try {
      const result = await joinMatchmaking.mutateAsync({
        type,
        languageId: selectedLanguageId,
      });
      if (result.matched && result.session) {
        router.push({
          pathname: "/multiplayer/lobby",
          params: {
            sessionId: result.session.id,
            inviteCode: result.session.inviteCode ?? "",
            type: result.session.type,
            partyRoomId: result.session.partyRoomId,
            languageId: selectedLanguageId,
          },
        });
      } else {
        // Queued — go to lobby in matchmaking mode
        router.push({
          pathname: "/multiplayer/lobby",
          params: {
            matchmaking: "true",
            type,
            languageId: selectedLanguageId,
          },
        });
      }
    } catch (err: any) {
      Alert.alert("Matchmaking Error", err?.message ?? "Failed to join matchmaking. Please try again.");
    }
  };

  const handleJoinWithCode = async () => {
    if (joinCode.length < 4) return;
    setJoining(true);
    try {
      const session = await joinSession.mutateAsync(joinCode);
      router.push({
        pathname: "/multiplayer/lobby",
        params: {
          sessionId: session.id,
          inviteCode: session.inviteCode ?? "",
          type: session.type,
          partyRoomId: session.partyRoomId,
          languageId: session.languageId,
        },
      });
    } catch {
      Alert.alert("Invalid Code", "Could not find a game with that invite code.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Multiplayer" }} />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        <ScrollView
          contentContainerClassName="px-5 pb-8 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <ModeCard
            title="Quiz Battle"
            subtitle="Race to answer questions fastest"
            color="blue"
            icon="trophy.fill"
            onQuickPlay={() => handleQuickPlay("quiz_battle")}
            onInvite={() => handleInvite("quiz_battle")}
            loading={
              joinMatchmaking.isPending && joinMatchmaking.variables?.type === "quiz_battle"
            }
          />

          <ModeCard
            title="Paired Lesson"
            subtitle="Learn together, take turns on exercises"
            color="purple"
            icon="person.2.fill"
            onQuickPlay={() => handleQuickPlay("paired_lesson")}
            onInvite={() => handleInvite("paired_lesson")}
            loading={
              joinMatchmaking.isPending && joinMatchmaking.variables?.type === "paired_lesson"
            }
          />

          {/* Join with code */}
          <View className="mb-6 rounded-2xl bg-neutral-50 p-5 dark:bg-neutral-800">
            <Text className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
              Have an invite code?
            </Text>
            <View className="flex-row gap-3">
              <TextInput
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                placeholder="Enter code"
                placeholderTextColor="#9ca3af"
                maxLength={6}
                autoCapitalize="characters"
                className="flex-1 rounded-xl border-2 border-neutral-200 px-4 py-3 text-center text-lg font-bold tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              />
              <Pressable
                onPress={handleJoinWithCode}
                disabled={joinCode.length < 4 || joining}
                className="items-center justify-center rounded-xl bg-blue-500 px-6 active:opacity-80 disabled:opacity-50"
              >
                {joining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="font-semibold text-white">Join</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Recent matches */}
          {recentSessions.length > 0 && (
            <View>
              <Text className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
                Recent Matches
              </Text>
              {recentSessions.slice(0, 5).map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() =>
                    router.push({
                      pathname:
                        session.type === "quiz_battle"
                          ? "/multiplayer/quiz-results"
                          : "/multiplayer/paired-results",
                      params: { sessionId: session.id },
                    })
                  }
                  className="mb-2 flex-row items-center rounded-xl bg-neutral-50 p-4 active:opacity-70 dark:bg-neutral-800"
                >
                  <IconSymbol
                    name={
                      session.type === "quiz_battle"
                        ? "trophy.fill"
                        : ("person.2.fill" as any)
                    }
                    size={20}
                    color={
                      session.type === "quiz_battle" ? "#3b82f6" : "#a855f7"
                    }
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                      {session.type === "quiz_battle"
                        ? "Quiz Battle"
                        : "Paired Lesson"}
                    </Text>
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                      {session.status} &middot;{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
