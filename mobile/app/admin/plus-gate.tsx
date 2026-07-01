import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { ApiError, apiFetch, friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  planTier: "free" | "plus";
}

const MAX_RESULTS = 20;

export default function PlusGateScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
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

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminUser[]>("/admin/users?limit=100", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
    : [];

  const togglePlan = useMutation({
    mutationFn: async ({ id, planTier }: { id: string; planTier: "free" | "plus" }) => {
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ planTier }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      console.error("[plus-gate] grant/revoke failed:", err instanceof ApiError ? `${err.status} ${err.message}` : err);
      Alert.alert(t("admin.users.title"), friendlyError(err));
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.billing") }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {t("admin.nav.billing")}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            {t("admin.organizations.plusSectionDesc")}
          </Text>

          {/* Global toggle */}
          <View
            style={{
              backgroundColor: M.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: M.border,
              padding: 16,
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
          </View>

          {/* Per-user grant/revoke */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
            {t("admin.users.title")}
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("admin.users.searchPlaceholder")}
            placeholderTextColor={M.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: M.border,
              backgroundColor: M.card,
              color: M.text,
              fontSize: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 12,
            }}
          />

          {q.length > 0 && usersLoading && (
            <ActivityIndicator size="small" color={M.muted} style={{ marginTop: 8 }} />
          )}

          {q.length > 0 && !usersLoading && filtered.length === 0 && (
            <Text style={{ fontSize: 13, color: M.muted, marginTop: 4 }}>
              {t("admin.users.noResults")}
            </Text>
          )}

          <View style={{ gap: 10 }}>
            {filtered.map((user) => {
              const isPlus = user.planTier === "plus";
              const busy = togglePlan.isPending && togglePlan.variables?.id === user.id;
              return (
                <View
                  key={user.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                    backgroundColor: M.card, borderWidth: 1, borderColor: M.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => togglePlan.mutate({ id: user.id, planTier: isPlus ? "free" : "plus" })}
                    disabled={togglePlan.isPending}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                      backgroundColor: isPlus ? `${M.error}18` : `${amber}18`,
                      opacity: togglePlan.isPending && !busy ? 0.5 : 1,
                    }}
                    className="active:opacity-70"
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={isPlus ? M.error : amber} />
                    ) : (
                      <>
                        <IconSymbol name="crown.fill" size={12} color={isPlus ? M.error : amber} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: isPlus ? M.error : amber }}>
                          {isPlus ? t("admin.users.revokePlus") : t("admin.users.grantPlus")}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
