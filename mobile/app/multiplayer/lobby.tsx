import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import {
    useLeaveMatchmaking,
    useMatchmakingStatus,
} from "@/lib/hooks/use-multiplayer";
import { useToast } from "@/lib/hooks/use-toast";
import { hapticTap } from "@/lib/haptics";
import { useMultiplayerStore } from "@/store/multiplayer-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Share,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Resolve the configured PartyKit host into a clean "host:port" plus the right
// WebSocket scheme. The env var may or may not include a scheme (EAS stores it
// as "https://…", local .env stores a bare "host:port"), so we must strip any
// scheme — otherwise we'd build "wss://https://…", an invalid URL. A local
// `partykit dev` server (localhost / LAN IP) only speaks plain ws; deployed
// hosts (e.g. *.partykit.dev) need wss. Picking the wrong one fails silently
// and leaves both players stuck in the lobby.
function resolvePartyKit(raw: string): { host: string; protocol: "ws" | "wss" } {
  const scheme = raw.match(/^(https?|wss?):\/\//i)?.[1]?.toLowerCase();
  const host = raw.replace(/^(https?|wss?):\/\//i, "");
  const hostname = host.split(":")[0];

  if (scheme === "https" || scheme === "wss") return { host, protocol: "wss" };
  if (scheme === "http" || scheme === "ws") return { host, protocol: "ws" };

  const isLocal =
    hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  return { host, protocol: isLocal ? "ws" : "wss" };
}

const { host: PARTYKIT_HOST, protocol: PARTYKIT_PROTOCOL } = resolvePartyKit(
  process.env.EXPO_PUBLIC_PARTYKIT_HOST ?? "localhost:1999"
);

export default function LobbyScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
  const [copied, setCopied] = useState(false);
  const matchHandled = useRef(false);
  const leaving = useRef(false);
  const { toast, show: toastShow, dismiss: dismissToast } = useToast();

  const playerName = user?.username ?? user?.firstName ?? "Player";

  // Keep the latest getToken in a ref and expose a *stable* provider. Clerk
  // hands back a new getToken identity whenever it refreshes its session, so
  // depending on getToken directly would change connectToRoom every render and
  // re-fire the connect effect in an infinite loop.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const provideToken = useCallback(() => getTokenRef.current(), []);

  const connectToRoom = useCallback(() => {
    if (!params.partyRoomId || !params.sessionId) return;

    const partyName =
      params.type === "paired_lesson" ? "paired_lesson" : "main";
    const roomUrl = `${PARTYKIT_PROTOCOL}://${PARTYKIT_HOST}/parties/${partyName}/${params.partyRoomId}`;

    // Pass the token *provider* so the store mints a fresh Clerk token on every
    // (re)connect — session tokens expire in ~60s and a cached one fails on
    // reconnect.
    connect(roomUrl, provideToken, {
      name: playerName,
      sessionId: params.sessionId,
      languageId: params.languageId ?? "",
      playerId: userId ?? params.sessionId,
    });
  }, [
    params.partyRoomId,
    params.sessionId,
    params.type,
    params.languageId,
    provideToken,
    connect,
    playerName,
    userId,
  ]);

  // Connect to PartyKit room when we have session info
  useEffect(() => {
    connectToRoom();
    return () => {
      // Don't disconnect if navigating to game screen
    };
  }, [connectToRoom]);

  const handleRetryConnect = () => {
    hapticTap();
    connectToRoom();
  };

  // Handle matchmaking result — guard against double navigation.
  // Once we already have session info (or are no longer in matchmaking
  // mode) there is nothing to handle; bailing here prevents the replaced
  // lobby instance from acting on the still-cached "matched" status and
  // re-navigating to itself in an infinite loop.
  useEffect(() => {
    if (matchHandled.current) return;
    if (!isMatchmaking || hasSessionInfo) return;
    if (matchStatus?.status === "matched" && matchStatus.session) {
      matchHandled.current = true;
      const session = matchStatus.session;
      // Drop the stale matchmaking status so the next lobby instance does
      // not re-trigger on cached data.
      queryClient.removeQueries({
        queryKey: ["multiplayer", "matchmaking", "status"],
      });
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
  }, [matchStatus, isMatchmaking, hasSessionInfo]);

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

  const inviteCode = params.inviteCode ?? "";
  // Deep link a friend can tap to open the app straight into the join flow
  // with the code pre-filled.
  const inviteLink = inviteCode
    ? Linking.createURL("/multiplayer", { queryParams: { code: inviteCode } })
    : "";
  const modeLabel =
    params.type === "quiz_battle"
      ? t("multiplayer.quizBattle")
      : t("multiplayer.pairedLesson");
  const shareMessage = t("multiplayer.shareMessage", {
    mode: modeLabel,
    code: inviteCode,
    link: inviteLink,
  });

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy the bare code to the clipboard (web only — native exposes copy via
  // the system share sheet instead).
  const handleCopy = async () => {
    if (!inviteCode) return;
    hapticTap();
    try {
      await navigator.clipboard?.writeText(inviteCode);
      flashCopied();
    } catch {
      toastShow(t("multiplayer.inviteCodeLabel"), inviteCode, "info");
    }
  };

  // Primary action: open the native share sheet (or the Web Share API),
  // falling back to a clipboard copy where neither is available.
  const handleShare = async () => {
    if (!inviteCode) return;
    hapticTap();
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ text: shareMessage });
        } else {
          await handleCopy();
        }
      } else {
        await Share.share({ message: shareMessage });
      }
    } catch {
      // User dismissed the share sheet, or it is unavailable — fall back to
      // surfacing the code so it can still be shared manually.
      toastShow(t("multiplayer.inviteCodeLabel"), inviteCode, "info");
    }
  };

  const handleCancel = () => {
    // Guard against the X and the Cancel button both firing, or a rapid
    // double-tap, which would dispatch navigation twice.
    if (leaving.current) return;
    leaving.current = true;
    hapticTap();

    // Prevent an in-flight matchmaking poll from navigating us into a game
    // we're trying to leave: stop the effect from acting and drop the cached
    // status so a late "matched" result can't re-route after we're gone.
    matchHandled.current = true;
    if (isMatchmaking) {
      queryClient.removeQueries({
        queryKey: ["multiplayer", "matchmaking", "status"],
      });
      leaveMatchmaking.mutate();
    }
    reset();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/multiplayer");
    }
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
          {inviteCode && (
            <View className="mb-8 w-full items-center">
              <View className="w-full items-center rounded-2xl bg-neutral-50 px-8 py-6 dark:bg-neutral-800">
                <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t("multiplayer.inviteCodeLabel")}
                </Text>
                <Text
                  accessibilityLabel={t("multiplayer.inviteCodeLabel")}
                  className="text-4xl font-bold tracking-[0.3em] text-neutral-900 dark:text-white"
                >
                  {inviteCode}
                </Text>
                <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {t("multiplayer.shareHint")}
                </Text>
              </View>

              {/* Share / copy actions */}
              <View className="mt-4 w-full flex-row gap-3">
                <Pressable
                  onPress={handleShare}
                  accessibilityRole="button"
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-blue-500 py-3.5 active:opacity-80"
                >
                  <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
                  <Text className="ml-2 font-semibold text-white">
                    {t("multiplayer.shareInvite")}
                  </Text>
                </Pressable>

                {Platform.OS === "web" && (
                  <Pressable
                    onPress={handleCopy}
                    accessibilityRole="button"
                    className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-neutral-200 py-3.5 active:opacity-80 dark:border-neutral-700"
                  >
                    <IconSymbol
                      name={copied ? "checkmark" : "square.on.square"}
                      size={18}
                      color={copied ? getAccent("green").solid : M.muted}
                    />
                    <Text className="ml-2 font-semibold text-neutral-700 dark:text-neutral-300">
                      {copied ? t("multiplayer.copied") : t("multiplayer.copyCode")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
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
              <ActivityIndicator size="large" color={getAccent("blue").solid} />
              <Text className="mt-3 text-base text-neutral-500 dark:text-neutral-400">
                Looking for an opponent...
              </Text>
            </View>
          )}

          {connectionStatus === "connecting" && (
            <View className="mb-6 items-center">
              <ActivityIndicator size="small" color={getAccent("blue").solid} />
              <Text className="mt-2 text-sm text-neutral-500">
                Connecting...
              </Text>
            </View>
          )}

          {connectionStatus === "reconnecting" && (
            <View className="mb-6 items-center">
              <ActivityIndicator size="small" color={M.warning} />
              <Text className="mt-2 text-sm" style={{ color: M.warning }}>
                Connection lost — reconnecting…
              </Text>
            </View>
          )}

          {connectionStatus === "disconnected" && hasSessionInfo && (
            <View className="mb-6 items-center">
              <IconSymbol name="xmark.circle.fill" size={28} color={M.error} />
              <Text className="mt-2 text-center text-sm" style={{ color: M.error }}>
                Couldn&apos;t reach the game server.
              </Text>
              <Pressable
                onPress={handleRetryConnect}
                className="mt-3 rounded-xl bg-blue-500 px-5 py-2.5 active:opacity-80"
              >
                <Text className="font-semibold text-white">Retry</Text>
              </Pressable>
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
