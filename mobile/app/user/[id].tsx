import type { IconSymbolName } from "@/components/ui/icon-symbol-mapping";
import { LoadingScreen } from "@/components/loading-screen";
import { QueryErrorState } from "@/components/query-error-state";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUserFeed } from "@/lib/hooks/use-feed";
import { usePublicUser } from "@/lib/hooks/use-public-user";
import { localize } from "@/lib/localize";
import { timeAgo } from "@/lib/time-ago";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StatTile({ icon, value, label, color }: Readonly<{
  icon: IconSymbolName;
  value: number;
  label: string;
  color: string;
}>) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 4,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
      }}
    >
      <IconSymbol name={icon} size={16} color={color} />
      <Text style={{ fontSize: 17, fontWeight: "800", color: M.text }}>{value}</Text>
      <Text style={{ fontSize: 10, color: M.muted, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();

  const { data: user, isLoading, isError, refetch } = usePublicUser(id);
  const {
    data: feed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserFeed(id);

  const posts = feed?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <LoadingScreen />
      </>
    );
  }

  if (isError || !user) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
          <QueryErrorState onRetry={refetch} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: user.name, headerBackTitle: "Back" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              {/* Identity */}
              <View style={{ alignItems: "center", gap: 8, marginBottom: 20 }}>
                {user.profileAvatarId ? (
                  <AvatarCircle avatarId={user.profileAvatarId} size={72} />
                ) : user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 72, height: 72, borderRadius: 36 }}
                    accessibilityLabel={user.name}
                  />
                ) : (
                  <View
                    style={{
                      width: 72, height: 72, borderRadius: 36,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: `${M.accent}15`,
                      borderWidth: 1, borderColor: `${M.accent}30`,
                    }}
                  >
                    <Text style={{ fontSize: 26, fontWeight: "800", color: M.accent }}>
                      {user.name.charAt(0)}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 20, fontWeight: "800", color: M.text }}>{user.name}</Text>
                <Text style={{ fontSize: 12, color: M.muted }}>
                  {t("userProfile.joined", {
                    date: new Date(user.joinedAt).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    }),
                  })}
                </Text>
              </View>

              {/* Stats */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                <StatTile
                  icon="star.fill"
                  value={user.points}
                  label={t("userProfile.points")}
                  color={M.accent}
                />
                <StatTile
                  icon="flame.fill"
                  value={user.streak}
                  label={t("userProfile.streak")}
                  color={M.warning}
                />
                <StatTile
                  icon="trophy.fill"
                  value={user.rank}
                  label={t("userProfile.rank")}
                  color={M.info}
                />
                <StatTile
                  icon="checkmark.seal.fill"
                  value={user.approvedCount}
                  label={t("userProfile.contributions")}
                  color={M.success}
                />
              </View>

              <Text
                style={{
                  fontSize: 11, fontWeight: "700", letterSpacing: 1,
                  color: M.muted, textTransform: "uppercase",
                }}
              >
                {t("userProfile.posts")}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 13, color: M.muted, textAlign: "center" }}>
                {t("userProfile.noPosts")}
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ marginTop: 16 }} color={M.muted} />
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 8,
                padding: 14,
                borderRadius: 12,
                backgroundColor: M.card,
                borderWidth: 1,
                borderColor: M.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text, marginBottom: 4 }}>
                {localize(item.title, uiLanguage)}
              </Text>
              <Text style={{ fontSize: 13, color: M.sub, lineHeight: 18 }}>
                {localize(item.description, uiLanguage)}
              </Text>
              <Text style={{ marginTop: 8, fontSize: 10, color: M.muted }}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}
