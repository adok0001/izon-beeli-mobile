import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { apiFetch, friendlyError } from "@/lib/api";
import { type CurrentUser, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useToast } from "@/lib/hooks/use-toast";
import { LANGUAGES } from "@/lib/mock-data";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function RouterBack() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={12} className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
      <IconSymbol name="xmark" size={16} color="#6b7280" />
    </Pressable>
  );
}

const REVIEWER_ROLES = [
  { id: "teacher" },
  { id: "professor" },
  { id: "elder" },
] as const;

interface ReviewerApp {
  id: string;
  role: string;
  languages: string[];
  status: "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function ReviewerProfileCard({
  existing,
  currentUser,
  onWithdraw,
  withdrawing,
}: Readonly<{ existing: ReviewerApp; currentUser: CurrentUser | null; onWithdraw: () => void; withdrawing: boolean }>) {
  const { t } = useTranslation();
  const roleKey = currentUser?.reviewerRole ?? existing.role;

  const roleColors: Record<string, { bg: string; text: string }> = {
    teacher: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-100" },
    professor: { bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-800 dark:text-indigo-100" },
    elder: { bg: "bg-teal-100 dark:bg-teal-900", text: "text-teal-800 dark:text-teal-100" },
  };
  const colors = roleColors[roleKey] ?? roleColors.teacher;
  const roleLabelKey = `reviewerApplication.role${roleKey.charAt(0).toUpperCase()}${roleKey.slice(1)}` as never;

  return (
    <View className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <IconSymbol name="checkmark.seal.fill" size={22} color="#22c55e" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-green-700 dark:text-green-300">
            {t("reviewerApplication.profileStatus")}
          </Text>
          <View className={`mt-1 self-start rounded-full px-2.5 py-0.5 ${colors.bg}`}>
            <Text className={`text-xs font-bold ${colors.text}`}>
              {t(roleLabelKey)}
            </Text>
          </View>
        </View>
      </View>

      {existing.languages && existing.languages.length > 0 && (
        <>
          <Text className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">
            {t("reviewerApplication.profileLanguagesLabel")}
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {existing.languages.map((langId) => {
              const lang = LANGUAGES.find((l) => l.id === langId);
              return (
                <View key={langId} className="rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900">
                  <Text className="text-xs font-medium text-green-800 dark:text-green-100">
                    {lang?.name ?? langId}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      <Pressable
        onPress={onWithdraw}
        disabled={withdrawing}
        className="mt-4 flex-row items-center justify-center gap-1.5 rounded-xl border border-green-300 py-2.5 active:opacity-70 dark:border-green-700"
      >
        {withdrawing ? (
          <ActivityIndicator size="small" color="#16a34a" />
        ) : (
          <>
            <IconSymbol name="xmark.circle" size={15} color="#15803d" />
            <Text className="text-sm font-semibold text-green-700 dark:text-green-300">
              {t("reviewerApplication.withdrawApplication")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function PendingCard({
  createdAt, role, onCancel, cancelling,
}: Readonly<{ createdAt: string; role: string; onCancel: () => void; cancelling: boolean }>) {
  const { t } = useTranslation();
  return (
    <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <View className="mb-2 flex-row items-center gap-2">
        <IconSymbol name="clock.fill" size={18} color="#f59e0b" />
        <Text className="font-semibold text-amber-700 dark:text-amber-300">
          {t("reviewerApplication.pendingTitle")}
        </Text>
      </View>
      <Text className="text-sm text-neutral-700 dark:text-neutral-300">
        {t("reviewerApplication.pendingBody", { role })}
      </Text>
      <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {t("reviewerApplication.pendingDate", { date: new Date(createdAt).toLocaleDateString() })}
      </Text>
      <Pressable
        onPress={onCancel}
        disabled={cancelling}
        className="mt-4 flex-row items-center justify-center gap-1.5 rounded-xl border border-amber-300 py-2.5 active:opacity-70 dark:border-amber-700"
      >
        {cancelling ? (
          <ActivityIndicator size="small" color="#f59e0b" />
        ) : (
          <>
            <IconSymbol name="xmark.circle" size={15} color="#d97706" />
            <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {t("reviewerApplication.cancelApplication")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function RejectedBanner({ note }: Readonly<{ note: string | null }>) {
  const { t } = useTranslation();
  return (
    <View className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
      <View className="mb-1 flex-row items-center gap-2">
        <IconSymbol name="xmark.circle.fill" size={18} color="#ef4444" />
        <Text className="font-semibold text-red-700 dark:text-red-300">{t("reviewerApplication.rejectedTitle")}</Text>
      </View>
      {!!note && (
        <Text className="mt-1 text-sm text-red-600 dark:text-red-400">{note}</Text>
      )}
      <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t("reviewerApplication.rejectedHint")}</Text>
    </View>
  );
}

function AppContent({
  existing,
  currentUser,
  role, setRole,
  background, setBackground,
  reason, setReason,
  selectedLangs, toggleLang,
  canSubmit, pending, onSubmit,
  onCancel, cancelling,
}: Readonly<{
  existing: ReviewerApp | null | undefined;
  currentUser: CurrentUser | null;
  role: string; setRole: (v: string) => void;
  background: string; setBackground: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  selectedLangs: string[]; toggleLang: (id: string) => void;
  canSubmit: boolean; pending: boolean; onSubmit: () => void;
  onCancel: () => void; cancelling: boolean;
}>) {
  const { t } = useTranslation();

  if (existing?.status === "approved") {
    return (
      <>
        <ReviewerProfileCard existing={existing} currentUser={currentUser} onWithdraw={onCancel} withdrawing={cancelling} />
        <View className="my-5 border-b border-neutral-100 dark:border-neutral-800" />
        <Text className="mb-1 text-base font-bold text-neutral-900 dark:text-white">
          {t("reviewerApplication.updateSectionTitle")}
        </Text>
        <Text className="mb-5 text-sm text-neutral-600 dark:text-neutral-300">
          {t("reviewerApplication.updateSubtitle")}
        </Text>
        <ApplicationForm
          role={role} setRole={setRole}
          background={background} setBackground={setBackground}
          reason={reason} setReason={setReason}
          selectedLangs={selectedLangs} toggleLang={toggleLang}
          canSubmit={canSubmit} pending={pending} onSubmit={onSubmit}
          isUpdate
        />
      </>
    );
  }

  if (existing?.status === "pending") {
    return <PendingCard createdAt={existing.createdAt} role={existing.role} onCancel={onCancel} cancelling={cancelling} />;
  }

  return (
    <>
      {existing?.status === "rejected" && (
        <RejectedBanner note={existing.reviewerNote} />
      )}
      <ApplicationForm
        role={role} setRole={setRole}
        background={background} setBackground={setBackground}
        reason={reason} setReason={setReason}
        selectedLangs={selectedLangs} toggleLang={toggleLang}
        canSubmit={canSubmit} pending={pending} onSubmit={onSubmit}
        isUpdate={false}
      />
    </>
  );
}

export default function ReviewerApplicationScreen() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [role, setRole] = useState("teacher");
  const [background, setBackground] = useState("");
  const [reason, setReason] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: existing, isLoading } = useQuery<ReviewerApp | null>({
    queryKey: ["reviewer-application-me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ReviewerApp | null>("/reviewer-applications/me", {
        token: token ?? undefined,
      });
    },
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 8000 : false,
  });

  useEffect(() => {
    if (existing?.status === "approved" && !initialized) {
      setRole(existing.role);
      setSelectedLangs(existing.languages ?? []);
      setInitialized(true);
    }
  }, [existing, initialized]);

  const isUpdate = existing?.status === "approved";

  const cancel = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/reviewer-applications/me", {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviewer-application-me"] });
      void qc.invalidateQueries({ queryKey: ["current-user"] });
      toastSuccess(t("reviewerApplication.cancelSuccessTitle"), t("reviewerApplication.cancelSuccessMessage"));
    },
    onError: (err: Error) => {
      toastError(t("reviewerApplication.failedTitle"), friendlyError(err));
    },
  });

  function confirmCancel() {
    const isWithdraw = existing?.status === "approved";
    Alert.alert(
      t(isWithdraw ? "reviewerApplication.withdrawApplication" : "reviewerApplication.cancelConfirmTitle"),
      t(isWithdraw ? "reviewerApplication.withdrawConfirmMessage" : "reviewerApplication.cancelConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: "Yes, cancel", style: "destructive", onPress: () => cancel.mutate() },
      ]
    );
  }

  const submit = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/reviewer-applications", {
        method: "POST",
        body: JSON.stringify({
          role,
          background: background.trim(),
          reason: reason.trim(),
          languages: selectedLangs,
        }),
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviewer-application-me"] });
      void qc.invalidateQueries({ queryKey: ["current-user"] });
      const title = isUpdate ? t("reviewerApplication.updateSuccessTitle") : t("reviewerApplication.successTitle");
      const message = isUpdate ? t("reviewerApplication.updateSuccessMessage") : t("reviewerApplication.successMessage");
      toastSuccess(title, message);
    },
    onError: (err: Error) => {
      toastError(t("reviewerApplication.failedTitle"), friendlyError(err));
    },
  });

  function toggleLang(id: string) {
    setSelectedLangs((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  const canSubmit = isUpdate
    ? selectedLangs.length > 0 && !submit.isPending
    : background.trim().length >= 20 &&
      reason.trim().length >= 20 &&
      selectedLangs.length > 0 &&
      !submit.isPending;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={["top"]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white">
            {existing?.status === "approved"
              ? t("reviewerApplication.profileTitle")
              : t("reviewerApplication.screenTitle")}
          </Text>
          <RouterBack />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator />
              </View>
            ) : (
              <AppContent
                existing={existing}
                currentUser={currentUser ?? null}
                role={role}
                setRole={setRole}
                background={background}
                setBackground={setBackground}
                reason={reason}
                setReason={setReason}
                selectedLangs={selectedLangs}
                toggleLang={toggleLang}
                canSubmit={canSubmit}
                pending={submit.isPending}
                onSubmit={() => submit.mutate()}
                onCancel={confirmCancel}
                cancelling={cancel.isPending}
              />
            )}
            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function ApplicationForm({
  role, setRole,
  background, setBackground,
  reason, setReason,
  selectedLangs, toggleLang,
  canSubmit, pending, onSubmit,
  isUpdate,
}: Readonly<{
  role: string; setRole: (v: string) => void;
  background: string; setBackground: (v: string) => void;
  reason: string; setReason: (v: string) => void;
  selectedLangs: string[]; toggleLang: (id: string) => void;
  canSubmit: boolean; pending: boolean; onSubmit: () => void;
  isUpdate: boolean;
}>) {
  const isDark = useColorScheme() === "dark";
  const chipIconColor = isDark ? "#c7d2fe" : "#4338ca";
  const [langSearch, setLangSearch] = useState("");
  const { t } = useTranslation();
  const [showAllLangs, setShowAllLangs] = useState(false);
  const PAGE = 8;
  const customLangName = langSearch.trim();
  const filteredLangs = LANGUAGES.filter((lang) => {
    const q = langSearch.toLowerCase();
    const matchesSearch = !q || lang.name.toLowerCase().includes(q) || lang.nativeName.toLowerCase().includes(q) || lang.region.toLowerCase().includes(q);
    return matchesSearch && !selectedLangs.includes(lang.id);
  });
  const isSearching = langSearch.length > 0;
  const visibleLangs = isSearching || showAllLangs ? filteredLangs : filteredLangs.slice(0, PAGE);
  const hiddenCount = filteredLangs.length - PAGE;
  const isExactMatch = LANGUAGES.some((l) => l.name.toLowerCase() === customLangName.toLowerCase() || l.id.toLowerCase() === customLangName.toLowerCase());

  return (
    <View>
      {!isUpdate && (
        <Text className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
          {t("reviewerApplication.formSubtitle")}
        </Text>
      )}

      {/* Role */}
      <Text className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {t("reviewerApplication.roleLabel")}
      </Text>
      <View className="mb-5 gap-2">
        {REVIEWER_ROLES.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setRole(r.id)}
            className={`rounded-2xl border-2 p-4 ${
              role === r.id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
            }`}
          >
            <Text className={`text-sm font-bold ${
              role === r.id ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-900 dark:text-white"
            }`}>
              {t(`reviewerApplication.role${r.id.charAt(0).toUpperCase()}${r.id.slice(1)}` as never)}
            </Text>
            <Text className={`mt-0.5 text-xs ${
              role === r.id ? "text-indigo-600 dark:text-indigo-300" : "text-neutral-600 dark:text-neutral-300"
            }`}>
              {t(`reviewerApplication.role${r.id.charAt(0).toUpperCase()}${r.id.slice(1)}Desc` as never)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Languages */}
      <Text className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {t("reviewerApplication.languagesLabel")}
      </Text>

      <View className="mb-2 flex-row items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
        <IconSymbol name="magnifyingglass" size={16} color="#9ca3af" />
        <TextInput
          value={langSearch}
          onChangeText={setLangSearch}
          placeholder={t("reviewerApplication.langSearchPlaceholder")}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          className="ml-2 flex-1 py-3 text-sm text-neutral-900 dark:text-white"
        />
        {langSearch.length > 0 && (
          <Pressable onPress={() => setLangSearch("")} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={16} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {customLangName.length > 0 && !isExactMatch && (
        <Pressable
          onPress={() => { toggleLang(customLangName); setLangSearch(""); }}
          className="mb-2 flex-row items-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 p-3 active:opacity-70 dark:border-indigo-700"
        >
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
            <IconSymbol name="plus.circle" size={18} color="#6366f1" />
          </View>
          <Text className="flex-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {t("reviewerApplication.langAddCustom", { name: customLangName })}
          </Text>
        </Pressable>
      )}

      {selectedLangs.length > 0 && (
        <View className="mb-3 flex-row flex-wrap gap-1.5">
          {selectedLangs.map((id) => {
            const lang = LANGUAGES.find((l) => l.id === id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleLang(id)}
                className="flex-row items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 dark:bg-indigo-700"
              >
                <Text className="text-xs font-semibold text-indigo-800 dark:text-white">
                  {lang?.name ?? id}
                </Text>
                <IconSymbol name="xmark" size={10} color={chipIconColor} />
              </Pressable>
            );
          })}
        </View>
      )}
      {selectedLangs.length === 0 && (
        <Text className="mb-3 text-xs text-neutral-500 dark:text-neutral-300">{t("reviewerApplication.langSelectHint")}</Text>
      )}

      <View className="mb-5">
        {visibleLangs.map((lang) => (
          <Pressable
            key={lang.id}
            onPress={() => toggleLang(lang.id)}
            className="mb-1 flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
          >
            <View className="flex-1">
              <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                {lang.name}
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-300">{lang.nativeName} · {lang.region}</Text>
            </View>
            <IconSymbol name="plus.circle" size={18} color={isDark ? "#818cf8" : "#6366f1"} />
          </Pressable>
        ))}
        {!isSearching && hiddenCount > 0 && (
          <Pressable
            onPress={() => setShowAllLangs((v) => !v)}
            className="mt-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-3 active:bg-neutral-50 dark:border-neutral-700 dark:active:bg-neutral-800"
          >
            <Text className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {showAllLangs ? t("reviewerApplication.langShowLess") : t("reviewerApplication.langShowMore", { count: hiddenCount })}
            </Text>
            <IconSymbol
              name={showAllLangs ? "chevron.up" : "chevron.down"}
              size={14}
              color={isDark ? "#818cf8" : "#4f46e5"}
            />
          </Pressable>
        )}
      </View>

      {/* Background */}
      <Text className="mb-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {t("reviewerApplication.backgroundLabel")}
        {isUpdate && <Text className="font-normal text-neutral-400 dark:text-neutral-500"> ({t("reviewerApplication.backgroundOptionalHint")})</Text>}
      </Text>
      <TextInput
        value={background}
        onChangeText={setBackground}
        placeholder={isUpdate ? t("reviewerApplication.backgroundOptionalHint") : t("reviewerApplication.backgroundPlaceholder")}
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="mb-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        style={{ minHeight: 96 }}
      />
      <Text className="mb-4 text-right text-xs text-neutral-500 dark:text-neutral-400">{t("reviewerApplication.backgroundCounter", { count: background.trim().length })}</Text>

      {/* Reason */}
      <Text className="mb-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {t("reviewerApplication.reasonLabel")}
        {isUpdate && <Text className="font-normal text-neutral-400 dark:text-neutral-500"> ({t("reviewerApplication.reasonOptionalHint")})</Text>}
      </Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder={isUpdate ? t("reviewerApplication.reasonOptionalHint") : t("reviewerApplication.reasonPlaceholder")}
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="mb-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        style={{ minHeight: 96 }}
      />
      <Text className="mb-6 text-right text-xs text-neutral-500 dark:text-neutral-400">{t("reviewerApplication.reasonCounter", { count: reason.trim().length })}</Text>

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        className="items-center rounded-xl bg-indigo-600 py-4"
        style={{ opacity: canSubmit ? 1 : 0.45 }}
      >
        {pending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-semibold text-white">
            {isUpdate ? t("reviewerApplication.updateSubmit") : t("reviewerApplication.submit")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
