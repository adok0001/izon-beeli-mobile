import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/lib/hooks/use-notification-prefs";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { useThemeStore } from "@/store/theme-store";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center border-b border-neutral-100 py-4 active:opacity-70 dark:border-neutral-800"
    >
      <IconSymbol name={icon as any} size={20} color="#6b7280" />
      <Text className="ml-3 flex-1 text-base text-neutral-900 dark:text-white">
        {label}
      </Text>
      {value && (
        <Text className="mr-2 text-sm text-neutral-500 dark:text-neutral-400">
          {value}
        </Text>
      )}
      {onPress && (
        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
      )}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  detail,
  value,
  onToggle,
  disabled,
}: {
  icon: string;
  label: string;
  detail?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center border-b border-neutral-100 py-3.5 dark:border-neutral-800">
      <IconSymbol name={icon as any} size={20} color="#6b7280" />
      <View className="ml-3 flex-1">
        <Text className="text-base text-neutral-900 dark:text-white">{label}</Text>
        {detail && (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">{detail}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
        thumbColor="#ffffff"
        accessibilityLabel={label}
        accessibilityHint={detail}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

const THEME_OPTIONS = ["system", "light", "dark"] as const;
const LANG_OPTIONS: UiLanguage[] = ["en", "fr", "pcm"];
const LANG_LABELS: Record<UiLanguage, string> = { en: "English", fr: "Français", pcm: "Naija" };

export default function SettingsScreen() {
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { preference, setPreference } = useThemeStore();
  const { uiLanguage, setUiLanguage } = useUiLanguageStore();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { data: prefs, isLoading: prefsLoading } = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const handleResetProgress = () => {
    Alert.alert(
      t("settings.resetProgressTitle"),
      t("settings.resetProgressMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.resetButton"),
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await apiFetch("/progress", {
                method: "DELETE",
                token: token ?? undefined,
              });
              queryClient.invalidateQueries({ queryKey: ["progress"] });
              toastSuccess(t("settings.resetSuccess"), t("settings.resetSuccessMessage"));
            } catch {
              toastError(t("common.error"), t("settings.resetError"));
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccountTitle"),
      t("settings.deleteAccountMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.deleteAccountButton"),
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await apiFetch("/users/me", {
                method: "DELETE",
                token: token ?? undefined,
              });
              await signOut();
              router.replace("/(auth)/sign-in");
            } catch {
              toastError(t("common.error"), t("settings.deleteAccountError"));
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t("settings.title") }} />
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
        <ScrollView className="px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Learning section */}
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.learning")}
          </Text>
          <SettingsRow
            icon="book.fill"
            label={t("settings.currentLanguage")}
            value={getLanguageName(selectedLanguageId)}
          />
          <SettingsRow
            icon="flame.fill"
            label={t("settings.dailyStreak")}
            value={t("settings.daysCount", { count: summary?.streak ?? 0 })}
          />
          <SettingsRow
            icon="star.fill"
            label={t("settings.pointsEarned")}
            value={String(summary?.points ?? 0)}
          />

          {/* Notifications section */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.notifications")}
          </Text>
          <ToggleRow
            icon="star.fill"
            label={t("settings.wordOfDay")}
            detail={t("settings.wordOfDayDetail")}
            value={prefs?.pushWotdEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ pushWotdEnabled: v })}
            disabled={prefsLoading}
          />
          <ToggleRow
            icon="flame.fill"
            label={t("settings.streakReminder")}
            detail={t("settings.streakReminderDetail")}
            value={prefs?.pushStreakReminderEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ pushStreakReminderEnabled: v })}
            disabled={prefsLoading}
          />

          {/* Email Notifications section */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.emailNotifications")}
          </Text>
          <ToggleRow
            icon="paperplane.fill"
            label={t("settings.emailWordOfDay")}
            detail={t("settings.emailWordOfDayDetail")}
            value={prefs?.emailWotdEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ emailWotdEnabled: v })}
            disabled={prefsLoading}
          />
          <ToggleRow
            icon="arrow.up.circle.fill"
            label={t("settings.emailStreakReminder")}
            detail={t("settings.emailStreakReminderDetail")}
            value={prefs?.emailStreakReminderEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ emailStreakReminderEnabled: v })}
            disabled={prefsLoading}
          />
          <ToggleRow
            icon="calendar"
            label={t("settings.emailAssignmentDue")}
            detail={t("settings.emailAssignmentDueDetail")}
            value={prefs?.emailAssignmentDueEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ emailAssignmentDueEnabled: v })}
            disabled={prefsLoading}
          />
          <ToggleRow
            icon="checkmark.seal.fill"
            label={t("settings.emailContributionStatus")}
            detail={t("settings.emailContributionStatusDetail")}
            value={prefs?.emailContributionStatusEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ emailContributionStatusEnabled: v })}
            disabled={prefsLoading}
          />
          <ToggleRow
            icon="person.badge.shield.checkmark.fill"
            label={t("settings.emailReviewerStatus")}
            detail={t("settings.emailReviewerStatusDetail")}
            value={prefs?.emailReviewerStatusEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ emailReviewerStatusEnabled: v })}
            disabled={prefsLoading}
          />

          {/* App section */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.app")}
          </Text>
          <Text className="mb-1 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t("settings.appearance")}
          </Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setPreference(opt)}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  preference === opt
                    ? "bg-blue-500"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    preference === opt
                      ? "text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {t(`settings.theme${opt.charAt(0).toUpperCase() + opt.slice(1)}` as any)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Interface language */}
          <Text className="mb-1 mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            {t("settings.uiLanguage")}
          </Text>
          <View className="flex-row gap-2">
            {LANG_OPTIONS.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setUiLanguage(lang)}
                className={`flex-1 items-center rounded-lg py-2.5 ${
                  uiLanguage === lang
                    ? "bg-blue-500"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    uiLanguage === lang
                      ? "text-white"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {LANG_LABELS[lang]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Danger zone */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.data")}
          </Text>
          <Pressable
            onPress={handleResetProgress}
            className="flex-row items-center border-b border-neutral-100 py-4 active:opacity-70 dark:border-neutral-800"
          >
            <IconSymbol name="xmark" size={20} color="#ef4444" />
            <Text className="ml-3 text-base font-semibold text-red-500">
              {t("settings.resetProgress")}
            </Text>
          </Pressable>

          {/* Account */}
          <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t("settings.account")}
          </Text>
          <SettingsRow
            icon="person.fill"
            label={t("settings.accountSettings")}
            onPress={() => router.push("/account")}
          />
          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center border-b border-neutral-100 py-4 active:opacity-70 dark:border-neutral-800"
          >
            <IconSymbol name="trash" size={20} color="#ef4444" />
            <Text className="ml-3 text-base font-semibold text-red-500">
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>

          {/* App info */}
          <View className="mt-8 items-center">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              Beeli
            </Text>
            <Text className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
