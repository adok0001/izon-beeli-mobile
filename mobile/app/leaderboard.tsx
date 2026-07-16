import { QueryErrorState } from "@/components/query-error-state";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLeaderboard, type LeaderboardEntry } from "@/lib/hooks/use-leaderboard";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, avatarUrl, profileAvatarId, color }: Readonly<{ name: string; avatarUrl?: string | null; profileAvatarId?: string | null; color: string }>) {
  const M = useMuseumTheme();
  if (profileAvatarId) {
    return <AvatarCircle avatarId={profileAvatarId} size={36} />;
  }
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />;
  }
  return (
    <View
      style={{
        width: 36, height: 36, borderRadius: 18,
        alignItems: "center", justifyContent: "center",
        backgroundColor: `${color}20`,
        borderWidth: 1, borderColor: `${color}30`,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color }}>{getInitials(name)}</Text>
    </View>
  );
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const M = useMuseumTheme();
  const gold = rank === 1;
  const silver = rank === 2;
  const bronze = rank === 3;

  const color = gold ? "#C4862A" : silver ? "#9CA3AF" : bronze ? "#CD7F32" : M.muted;
  const bg = gold
    ? "rgba(196,134,42,0.15)"
    : silver
    ? "rgba(156,163,175,0.1)"
    : bronze
    ? "rgba(205,127,50,0.12)"
    : "rgba(255,255,255,0.04)";

  return (
    <View
      style={{
        width: 32, height: 32, borderRadius: 16,
        alignItems: "center", justifyContent: "center",
        backgroundColor: bg,
        borderWidth: rank <= 3 ? 1 : 0,
        borderColor: `${color}50`,
      }}
    >
      {rank <= 3 ? (
        <Text style={{ fontSize: 14, color }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
        </Text>
      ) : (
        <Text style={{ fontSize: 11, fontWeight: "700", color: M.muted }}>{rank}</Text>
      )}
    </View>
  );
}

function EntryRow({ entry }: Readonly<{ entry: LeaderboardEntry }>) {
  const M = useMuseumTheme();
  const highlighted = entry.isCurrentUser;
  const avatarColor = highlighted ? M.accent : M.sub;

  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 14, marginBottom: 8,
        backgroundColor: highlighted ? `${M.accent}0D` : M.card,
        borderWidth: 1,
        borderColor: highlighted ? `${M.accent}35` : M.border,
        borderLeftWidth: highlighted ? 4 : 1,
        borderLeftColor: highlighted ? M.accent : M.border,
      }}
    >
      <RankBadge rank={entry.rank} />
      <Avatar name={entry.name} avatarUrl={entry.avatarUrl} profileAvatarId={entry.profileAvatarId} color={avatarColor} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13, fontWeight: "700",
              color: highlighted ? M.accent : M.text,
            }}
          >
            {entry.name}
          </Text>
          {highlighted && (
            <View
              style={{
                borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1.5,
                backgroundColor: `${M.accent}25`,
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: 1, color: M.accent }}>YOU</Text>
            </View>
          )}
        </View>
        {entry.selectedLanguageId ? (
          <Text style={{ fontSize: 10, color: M.muted, textTransform: "capitalize", marginTop: 1 }}>
            {entry.selectedLanguageId}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {entry.streak > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <IconSymbol name="flame.fill" size={12} color="#fb923c" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fb923c" }}>{entry.streak}</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <IconSymbol name="star.fill" size={12} color={M.accent} />
          <Text style={{ fontSize: 13, fontWeight: "800", color: M.accent }}>
            {entry.points.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, isRefetching } = useLeaderboard();

  const topEntries = data?.filter((e) => e.rank >= 1 && e.rank <= 50) ?? [];
  const currentUserEntry = data?.find((e) => e.isCurrentUser);
  const currentUserInTop = topEntries.some((e) => e.isCurrentUser);
  const showCurrentUserBanner = !isLoading && currentUserEntry && !currentUserInTop;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: M.ink, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10, alignSelf: "flex-start" }}
          className="active:opacity-60"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={14} color={M.parchment} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: M.parchment }}>{t("common.back")}</Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: `${M.accent}15`,
              borderWidth: 1, borderColor: `${M.accent}30`,
            }}
          >
            <IconSymbol name="trophy.fill" size={20} color={M.accent} />
          </View>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: M.parchment, letterSpacing: -0.4 }}>
              {t("leaderboard.title")}
            </Text>
            <Text style={{ fontSize: 12, color: M.textDim, marginTop: 2 }}>
              {t("leaderboard.subtitle")}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: M.card }}>
        {isLoading && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={M.accent} />
          </View>
        )}

        {!isLoading && isError && (
          <QueryErrorState onRetry={refetch} />
        )}

        {!isLoading && !isError && topEntries.length === 0 && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <IconSymbol name="trophy.fill" size={44} color={M.muted} />
            <Text style={{ fontSize: 13, color: M.muted, textAlign: "center", marginTop: 14 }}>
              {t("leaderboard.empty")}
            </Text>
          </View>
        )}

        {!isLoading && !isError && topEntries.length > 0 && (
          <FlatList
            data={topEntries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
            refreshing={isRefetching}
            onRefresh={refetch}
            renderItem={({ item }) => <EntryRow entry={item} />}
            ListFooterComponent={
              showCurrentUserBanner ? (
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
                    <View style={{ flex: 1, borderTopWidth: 1, borderStyle: "dashed", borderTopColor: M.border }} />
                    <Text style={{ fontSize: 10, color: M.muted, letterSpacing: 1 }}>
                      {t("leaderboard.yourRank").toUpperCase()}
                    </Text>
                    <View style={{ flex: 1, borderTopWidth: 1, borderStyle: "dashed", borderTopColor: M.border }} />
                  </View>
                  <EntryRow entry={currentUserEntry!} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
