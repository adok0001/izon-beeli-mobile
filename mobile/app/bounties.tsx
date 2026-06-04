import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useBounties, type Bounty } from "@/lib/hooks/use-bounties";
import { canManageBounties, useCurrentUser } from "@/lib/hooks/use-current-user";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function BountyCard({ bounty, isAdmin }: { bounty: Bounty; isAdmin?: boolean }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={{ marginBottom: 12, borderRadius: 16, backgroundColor: M.card, padding: 16, borderWidth: 1, borderColor: M.border, borderLeftWidth: 4, borderLeftColor: M.accent }}>
      <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {isAdmin && (
          <Pressable
            onPress={() => router.push({ pathname: "/bounty-edit", params: { id: bounty.id } } as any)}
            hitSlop={8}
            style={{ position: "absolute", right: 0, top: 0, zIndex: 10, padding: 4 }}
          >
            <IconSymbol name="pencil" size={16} color={M.muted} />
          </Pressable>
        )}
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View style={{ borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: M.accentBorder }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: M.accent }}>
              {getLanguageName(bounty.languageId)}
            </Text>
          </View>
          {bounty.category && (
            <View style={{ borderRadius: 999, backgroundColor: M.bg, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: M.border }}>
              <Text style={{ fontSize: 11, color: M.sub }}>
                {t(`dictionaryPage.categoryLabels.${bounty.category}`, { defaultValue: bounty.category })}
              </Text>
            </View>
          )}
        </View>
        <View style={{ borderRadius: 999, backgroundColor: M.accentGlow, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: M.accentBorder }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: M.accent }}>
            {t("bounties.xpBonus", { xp: bounty.xpReward })}
          </Text>
        </View>
      </View>

      <Text style={{ marginBottom: 4, fontSize: 15, fontWeight: "700", color: M.text }}>{bounty.title}</Text>
      <Text style={{ marginBottom: 12, fontSize: 13, color: M.sub }} numberOfLines={2}>{bounty.description}</Text>

      {bounty.createdByName && (
        <Text style={{ marginBottom: 12, fontSize: 11, color: M.muted }}>
          {t("bounties.createdBy", { name: bounty.createdByName })}
        </Text>
      )}

      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: M.sub }}>{bounty.currentCount} / {bounty.targetCount}</Text>
          <Text style={{ fontSize: 11, fontWeight: "600", color: M.sub }}>{bounty.progressPercent}%</Text>
        </View>
        <View style={{ height: 6, borderRadius: 999, backgroundColor: M.border }}>
          <View style={{ height: 6, borderRadius: 999, backgroundColor: M.accent, width: `${bounty.progressPercent}%` }} />
        </View>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: "/contribute", params: { languageId: bounty.languageId, ...(bounty.category ? { category: bounty.category } : {}) } } as any)}
        style={{ alignItems: "center", borderRadius: 12, backgroundColor: M.accent, paddingVertical: 12 }}
        className="active:opacity-80"
      >
        <Text style={{ fontWeight: "600", color: M.ink }}>{t("bounties.claim")}</Text>
      </Pressable>
    </View>
  );
}

export default function BountiesScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const { data, isLoading, refetch } = useBounties(selectedLanguageId);
  const { data: currentUser } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <>
      <Stack.Screen options={{ title: t("bounties.title"), headerBackTitle: t("common.goBack") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <BountyCard bounty={item} isAdmin={!!(currentUser && canManageBounties(currentUser))} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 80 }}>
              <View style={{ marginBottom: 16, height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
                <IconSymbol name="star.fill" size={28} color={M.accent} />
              </View>
              <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "600", color: M.sub }}>
                {isLoading ? t("bounties.loading") : t("bounties.noActive")}
              </Text>
              {!isLoading && (
                <Text style={{ marginTop: 4, textAlign: "center", fontSize: 13, color: M.muted }}>
                  {t("bounties.noActiveDesc")}
                </Text>
              )}
            </View>
          }
        />

        {currentUser && canManageBounties(currentUser) && (
          <Pressable
            onPress={() => router.push("/bounty-create" as any)}
            style={{ position: "absolute", bottom: 32, right: 20, height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: M.accent, elevation: 8 }}
            className="active:opacity-80"
          >
            <IconSymbol name="plus" size={26} color={M.ink} />
          </Pressable>
        )}
      </SafeAreaView>
    </>
  );
}
