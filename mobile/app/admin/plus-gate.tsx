import { StudioCard } from "@/components/studio/studio-card";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { ApiError, apiFetch, friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlusGateScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const router = useRouter();
  const amber = getAccent("amber").solid;

  const { data: config } = useQuery<{ plusEnabled: boolean }>({
    queryKey: ["admin", "billing", "plus-config"],
    queryFn: async () => apiFetch("/config/public"),
  });

  const togglePlusEnabled = useMutation({
    mutationFn: async (plusEnabled: boolean) => {
      const token = await getToken();
      return apiFetch("/admin/config", {
        method: "PATCH",
        body: JSON.stringify({ key: "plus_enabled", value: plusEnabled ? "true" : "false" }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "billing", "plus-config"] });
    },
    onError: (err) => {
      console.error("[plus-gate] global toggle failed:", err instanceof ApiError ? `${err.status} ${err.message}` : err);
      Alert.alert(t("admin.organizations.plusSectionTitle"), friendlyError(err));
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.billing") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("admin.nav.billing")}
          subtitle={t("admin.organizations.plusSectionDesc")}
        />

        <ScrollView
          style={{ flex: 1, backgroundColor: M.card }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Global toggle */}
          <StudioCard
            style={{
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40, height: 40, borderRadius: 10,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${amber}15`,
              }}
            >
              <IconSymbol name="crown.fill" size={18} color={amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>
                {t("admin.organizations.plusEnabledLabel")}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>
                {t("admin.organizations.plusSectionTitle")}
              </Text>
            </View>
            <Pressable
              onPress={() => togglePlusEnabled.mutate(!(config?.plusEnabled ?? false))}
              disabled={togglePlusEnabled.isPending || config === undefined}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                backgroundColor: config?.plusEnabled ? `${M.success}18` : M.border,
                opacity: togglePlusEnabled.isPending || config === undefined ? 0.5 : 1,
              }}
              className="active:opacity-70"
            >
              {togglePlusEnabled.isPending ? (
                <ActivityIndicator size="small" color={config?.plusEnabled ? M.success : M.sub} />
              ) : (
                <Text style={{ fontSize: 12, fontWeight: "700", color: config?.plusEnabled ? M.success : M.sub }}>
                  {config?.plusEnabled ? t("admin.organizations.plusToggleOn") : t("admin.organizations.plusToggleOff")}
                </Text>
              )}
            </Pressable>
          </StudioCard>

          {/* Per-user Plus grant/revoke lives in the comprehensive Users screen */}
          <Pressable onPress={() => router.push("/admin/users")} className="active:opacity-70">
            <StudioCard style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>
                  {t("admin.overview.manageUsers")}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }}>
                  {t("admin.overview.manageUsersDesc")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={M.muted} />
            </StudioCard>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
