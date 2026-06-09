import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import {
    useLeaveMatchmaking,
    useMatchmakingStatus,
} from "@/lib/hooks/use-multiplayer";
import { useToast } from "@/lib/hooks/use-toast";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Share,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PARTYKIT_HOST =
  process.env.EXPO_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

export default function LobbyScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { user } = useUser();
  const { getToken, userId } = useAuth();
  const params = useLocalSearchParams<{
    sessionId?: string;
    inviteCode?: string;
    type?: string;
    partyRoomId?: string;
    languageId?: string;
    matchmaking?: string;
  }>();

  const {
    connectionStatus,
    players,
    phase,
    connect,
    sendReady,
    reset,
  } = useMultiplayerStore();

  const isMatchmaking = params.matchmaking === "true";
  const hasSessionInfo = !!params.sessionId && !!params.partyRoomId;
  const leaveMatchmaking = useLeaveMatchmaking();
  // Only poll while still in matchmaking mode (no session yet)
  const { data: matchStatus } = useMatchmakingStatus(isMatchmaking && !hasSessionInfo);
  const [ready, setReady] = useState(false);
  const matchHandled = useRef(false);
  const { toast, show: toastShow, dismiss: dismissToast } = useToast();

  // Connect to PartyKit room when we have session info
  useEffect(() => {
    if (!params.partyRoomId || !params.sessionId) return;

    const connectToRoom = async () => {
      const token = await getToken();
      if (!token) return;

      const partyName =
        params.type === "paired_lesson" ? "paired_lesson" : "main";
      const protocol = PARTYKIT_HOST.includes("localhost") ? "ws" : "wss";
      const roomUrl = `${protocol}://${PARTYKIT_HOST}/parties/${partyName}/${params.partyRoomId}`;

      connect(roomUrl, token, {
        name: user?.username ?? user?.firstName ?? "Player",
        sessionId: params.sessionId!,
        languageId: params.languageId ?? "",
        playerId: userId ?? params.sessionId!,
      });
    };

    connectToRoom();

    return () => {
      // Don't disconnect if navigating to game screen
    };
  }, [params.partyRoomId, params.sessionId]);

  // Handle matchmaking result — guard against double navigation
  useEffect(() => {
    if (matchHandled.current) return;
    if (matchStatus?.status === "matched" && matchStatus.session) {
      matchHandled.current = true;
      const session = matchStatus.session;
      router.replace({
        pathname: "/multiplayer/lobby",
        params: {
          sessionId: session.id,
          inviteCode: session.inviteCode ?? "",
          type: session.type,
          partyRoomId: session.partyRoomId,
          languageId: session.languageId,
        },
      });
    }
  }, [matchStatus]);

  // Navigate to game when phase changes
  useEffect(() => {
    if (phase === "countdown" || phase === "playing") {
      const gameType = params.type ?? "quiz_battle";
      if (gameType === "quiz_battle") {
        router.replace({
          pathname: "/multiplayer/quiz-battle",
          params: { sessionId: params.sessionId ?? "" },
        });
      } else {
        router.replace({
          pathname: "/multiplayer/paired-lesson",
          params: { sessionId: params.sessionId ?? "" },
        });
      }
    }
  }, [phase]);

  const handleReady = () => {
    sendReady();
    setReady(true);
  };

  const handleShare = async () => {
    const code = params.inviteCode ?? "";
    if (!code) return;

    try {
      if (Platform.OS === "web") {
        // Try clipboard on web
        await navigator.clipboard?.writeText(code);
        toastShow("Copied!", `Invite code ${code} copied to clipboard`, "success");
      } else {
        await Share.share({
          message: `Join my ${
            params.type === "quiz_battle" ? "Quiz Battle" : "Paired Lesson"
          } on Beeli! Use invite code: ${code}`,
        });
      }
    } catch {
      toastShow("Invite Code", code, "info");
    }
  };

  const handleCancel = () => {
    if (isMatchmaking) {
      leaveMatchmaking.mutate();
    }
    reset();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Lobby",
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8}>
              <IconSymbol name="xmark" size={22} color={M.muted} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-neutral-900"
        edges={[]}
      >
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <View className="flex-1 items-center justify-center px-8">
          {/* Invite Code */}
          {params.inviteCode && (
            <Pressable
              onPress={handleShare}
              className="mb-8 items-center rounded-2xl bg-neutral-50 px-8 py-6 active:opacity-80 dark:bg-neutral-800"
            >
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Invite Code
              </Text>
              <Text className="text-4xl font-bold tracking-[0.3em] text-neutral-900 dark:text-white">
                {params.inviteCode}
              </Text>
              <View className="mt-2 flex-row items-center">
                <IconSymbol name="square.on.square" size={14} color="#3b82f6" />
                <Text className="ml-1 text-sm text-blue-500">
                  Tap to share
                </Text>
              </View>
            </Pressable>
          )}

          {/* Players */}
          <View className="mb-8 w-full">
            <Text className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Players
            </Text>
            <View className="flex-row justify-center gap-6">
              {players.length > 0 ? (
                players.map((p) => (
                  <View key={p.id} className="items-center">
                    <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {p.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                      {p.name}
                    </Text>
                    {p.ready && (
                      <Text className="text-xs text-green-500">Ready</Text>
                    )}
                  </View>
                ))
              ) : (
                <View className="items-center">
                  <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <IconSymbol
                      name="person.fill"
                      size={28}
                      color={M.muted}
                    />
                  </View>
                  <Text className="text-sm text-neutral-500">You</Text>
                </View>
              )}

              {players.length < 2 && (
                <View className="items-center">
                  <View className="mb-2 h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                    <ActivityIndicator size="small" color={M.muted} />
                  </View>
                  <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                    Waiting...
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status */}
          {isMatchmaking && !params.sessionId && (
            <View className="mb-6 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-3 text-base text-neutral-500 dark:text-neutral-400">
                Looking for an opponent...
              </Text>
            </View>
          )}

          {connectionStatus === "connecting" && (
            <View className="mb-6 items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="mt-2 text-sm text-neutral-500">
                Connecting...
              </Text>
            </View>
          )}

          {/* Ready button */}
          {players.length >= 2 && !ready && connectionStatus === "connected" && (
            <Pressable
              onPress={handleReady}
              className="w-full items-center rounded-xl bg-green-500 py-4 active:opacity-80"
            >
              <Text className="text-lg font-bold text-white">Ready!</Text>
            </Pressable>
          )}

          {ready && (
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              Waiting for opponent to be ready...
            </Text>
          )}

          {/* Cancel */}
          <Pressable
            onPress={handleCancel}
            className="mt-6 items-center py-3"
          >
            <Text className="text-sm text-red-500">Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
