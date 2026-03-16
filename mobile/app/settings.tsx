import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/lib/hooks/use-notification-prefs";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLanguageName } from "@/lib/mock-data";
import { useLanguageStore } from "@/store/language-store";
import { useThemeStore } from "@/store/theme-store";
import { useUiLanguageStore, type UiLanguage } from "@/store/ui-language-store";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Switch, Text, View } from "react-native";
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
}: {
  icon: string;
  label: string;
  detail?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
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
        trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const THEME_OPTIONS = ["system", "light", "dark"] as const;
const LANG_OPTIONS: UiLanguage[] = ["en", "fr"];
const LANG_LABELS: Record<UiLanguage, string> = { en: "English", fr: "Français" };

export default function SettingsScreen() {
  const { selectedLanguageId } = useLanguageStore();
  const { data: summary } = useProgressSummary();
  const { preference, setPreference } = useThemeStore();
  const { uiLanguage, setUiLanguage } = useUiLanguageStore();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: prefs } = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();
  const { t } = useTranslation();

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
              Alert.alert(t("settings.resetSuccess"), t("settings.resetSuccessMessage"));
            } catch {
              Alert.alert(t("common.error"), t("settings.resetError"));
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
        <View className="px-5 pt-4">
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
          />
          <ToggleRow
            icon="flame.fill"
            label={t("settings.streakReminder")}
            detail={t("settings.streakReminderDetail")}
            value={prefs?.pushStreakReminderEnabled ?? true}
            onToggle={(v) => updatePrefs.mutate({ pushStreakReminderEnabled: v })}
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

          {/* App info */}
          <View className="mt-8 items-center">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              Beeli
            </Text>
            <Text className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
