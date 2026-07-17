import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { FormInput } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { StudioSearchInput } from "@/components/studio/studio-search-input";
import { AccountAvatar } from "@/components/ui/account-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { ApiError, apiFetch, friendlyError } from "@/lib/api";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReviewerRole = "teacher" | "professor" | "elder";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  points: number;
  streak: number;
  isAdmin: boolean;
  isReviewer: boolean;
  reviewerLanguages: string[];
  reviewerRole: ReviewerRole | null;
  selectedLanguageId?: string | null;
  planTier: "free" | "plus";
  createdAt: string;
}

const REVIEWER_ROLES: ReviewerRole[] = ["teacher", "professor", "elder"];

function ActionPill({
  icon,
  label,
  color,
  busy,
  disabled,
  onPress,
}: Readonly<{ icon: string; label: string; color: string; busy?: boolean; disabled?: boolean; onPress: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: `${color}18`,
        opacity: disabled && !busy ? 0.5 : 1,
      }}
      className="active:opacity-70"
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <IconSymbol name={icon as never} size={12} color={color} />
          <Text style={{ fontSize: 11, fontWeight: "700", color }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export default function AdminUsersScreen() {
  const M = useMuseumTheme();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState<ReviewerRole>("teacher");
  const [langInput, setLangInput] = useState("");

  const purple = getAccent("purple").solid;
  const amber = getAccent("amber").solid;

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<AdminUser[]>("/admin/users?limit=100", { token: token ?? undefined });
    },
    staleTime: 30_000,
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : users;

  function onMutationError(action: string) {
    return (err: unknown) => {
      console.error(`[admin-users] ${action} failed:`, err instanceof ApiError ? `${err.status} ${err.message}` : err);
      Alert.alert(t("admin.users.title"), friendlyError(err));
    };
  }

  function invalidateUsers() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin }),
        token: token ?? undefined,
      });
    },
    onSuccess: invalidateUsers,
    onError: onMutationError("toggleAdmin"),
  });

  const togglePlan = useMutation({
    mutationFn: async ({ id, planTier }: { id: string; planTier: "free" | "plus" }) => {
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ planTier }),
        token: token ?? undefined,
      });
    },
    onSuccess: invalidateUsers,
    onError: onMutationError("togglePlan"),
  });

  const toggleReviewer = useMutation({
    mutationFn: async (vars: { id: string; isReviewer: boolean; reviewerLanguages?: string[]; reviewerRole?: ReviewerRole | null }) => {
      const { id, ...body } = vars;
      const token = await getToken();
      return apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        token: token ?? undefined,
      });
    },
    onSuccess: invalidateUsers,
    onError: onMutationError("toggleReviewer"),
  });

  const roleLabels: Record<ReviewerRole, string> = {
    teacher: t("admin.users.roleTeacher"),
    professor: t("admin.users.roleProfessor"),
    elder: t("admin.users.roleElder"),
  };

  function startEditingRole(user: AdminUser) {
    setRoleInput(user.reviewerRole ?? "teacher");
    setLangInput(user.reviewerLanguages.join(", "));
    setEditingId(user.id);
  }

  function saveRole(id: string) {
    const languages = langInput.split(",").map((l) => l.trim()).filter(Boolean);
    toggleReviewer.mutate({ id, isReviewer: true, reviewerRole: roleInput, reviewerLanguages: languages });
    setEditingId(null);
  }

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.users") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
        <StudioScreenHeader
          title={t("admin.users.title")}
          subtitle={t("admin.users.registeredCount", { count: users.length })}
        />

        <ScrollView
          style={{ flex: 1, backgroundColor: M.card }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 16 }}>
            <StudioSearchInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("admin.users.searchPlaceholder")}
            />
          </View>

          {isLoading && <ActivityIndicator size="small" color={M.muted} style={{ marginTop: 8 }} />}

          {!isLoading && filtered.length === 0 && (
            <Text style={{ fontSize: 13, color: M.muted, marginTop: 4 }}>{t("admin.users.noResults")}</Text>
          )}

          <View style={{ gap: 12 }}>
            {filtered.map((user) => {
              const isPlus = user.planTier === "plus";
              const adminBusy = toggleAdmin.isPending && toggleAdmin.variables?.id === user.id;
              const planBusy = togglePlan.isPending && togglePlan.variables?.id === user.id;
              const reviewerBusy = toggleReviewer.isPending && toggleReviewer.variables?.id === user.id;

              return (
                <StudioCard key={user.id} style={{ gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <AccountAvatar name={user.name} imageUrl={user.avatarUrl} hasImage={!!user.avatarUrl} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: M.sub }} numberOfLines={1}>
                        {user.email}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: M.muted }}>
                      {user.points.toLocaleString()} {t("admin.users.pointsUnit")}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {user.isAdmin && <Badge label={t("admin.users.colAdmin")} color={purple} bg={`${purple}18`} border={`${purple}30`} />}
                    <Badge
                      label={isPlus ? t("admin.users.planPlus") : t("admin.users.planFree")}
                      color={isPlus ? amber : M.sub}
                      bg={isPlus ? `${amber}18` : M.pillBg}
                      border={isPlus ? `${amber}30` : M.border}
                    />
                    {user.isReviewer && user.reviewerRole && (
                      <Badge label={roleLabels[user.reviewerRole]} color={M.info} bg={M.infoBg} border={M.infoBorder} />
                    )}
                    {user.isReviewer &&
                      user.reviewerLanguages.map((lang) => (
                        <Badge key={lang} label={lang} tone="neutral" />
                      ))}
                  </View>

                  {editingId === user.id ? (
                    <View style={{ gap: 8, marginTop: 2 }}>
                      <StudioFilterPills
                        options={REVIEWER_ROLES.map((role) => ({ id: role, label: roleLabels[role] }))}
                        value={roleInput}
                        onChange={setRoleInput}
                      />
                      <FormInput
                        value={langInput}
                        onChangeText={setLangInput}
                        placeholder={t("admin.users.languagesPlaceholder")}
                        autoCapitalize="none"
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Button
                          label={t("admin.users.save")}
                          onPress={() => saveRole(user.id)}
                          size="sm"
                          fullWidth={false}
                        />
                        <Button
                          label={t("admin.users.cancel")}
                          onPress={() => setEditingId(null)}
                          variant="secondary"
                          size="sm"
                          fullWidth={false}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {user.isReviewer ? (
                        <ActionPill
                          icon="xmark"
                          label={t("admin.users.removeRole")}
                          color={M.error}
                          busy={reviewerBusy}
                          disabled={toggleReviewer.isPending}
                          onPress={() => toggleReviewer.mutate({ id: user.id, isReviewer: false, reviewerRole: null })}
                        />
                      ) : (
                        <ActionPill
                          icon="person.badge.shield.checkmark.fill"
                          label={t("admin.users.grantRole")}
                          color={M.info}
                          disabled={toggleReviewer.isPending}
                          onPress={() => startEditingRole(user)}
                        />
                      )}
                      <ActionPill
                        icon={user.isAdmin ? "shield.slash.fill" : "shield.fill"}
                        label={user.isAdmin ? t("admin.users.demote") : t("admin.users.promote")}
                        color={user.isAdmin ? M.error : purple}
                        busy={adminBusy}
                        disabled={toggleAdmin.isPending}
                        onPress={() => toggleAdmin.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                      />
                      <ActionPill
                        icon="crown.fill"
                        label={isPlus ? t("admin.users.revokePlus") : t("admin.users.grantPlus")}
                        color={isPlus ? M.error : amber}
                        busy={planBusy}
                        disabled={togglePlan.isPending}
                        onPress={() => togglePlan.mutate({ id: user.id, planTier: isPlus ? "free" : "plus" })}
                      />
                    </View>
                  )}
                </StudioCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
