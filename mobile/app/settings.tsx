import { useMuseumTheme } from "@/lib/use-museum-theme";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { analytics } from "@/lib/analytics";
import { apiFetch } from "@/lib/api";
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/lib/hooks/use-notification-prefs";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { useToast } from "@/lib/hooks/use-toast";
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


function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 8 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: M.muted }}>
        {label}
      </Text>
    </View>
  );
}

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
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: M.border,
      }}
      className="active:opacity-70"
    >
      <IconSymbol name={icon as any} size={17} color={M.muted} />
      <Text style={{ marginLeft: 14, flex: 1, fontSize: 14, color: M.text }}>{label}</Text>
      {value && <Text style={{ marginRight: 8, fontSize: 12, color: M.muted }}>{value}</Text>}
      {onPress && <IconSymbol name="chevron.right" size={13} color={M.muted} />}
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
  const M = useMuseumTheme();
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: M.border,
      }}
    >
      <IconSymbol name={icon as any} size={17} color={M.muted} />
      <View style={{ marginLeft: 14, flex: 1 }}>
        <Text style={{ fontSize: 14, color: M.text }}>{label}</Text>
        {detail && <Text style={{ fontSize: 11, color: M.muted, marginTop: 2 }}>{detail}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: M.border, true: M.accent }}
        thumbColor={M.text}
        accessibilityLabel={label}
        accessibilityHint={detail}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

const THEME_OPTIONS = ["system", "light", "dark"] as const;
const LANG_OPTIONS: UiLanguage[] = ["en", "fr", "pcm", "ar", "pt"];
const LANG_LABELS: Record<UiLanguage, string> = {
  en: "English",
  fr: "Français",
  pcm: "Naija",
  ar: "العربية",
  pt: "Português",
};

export default function SettingsScreen() {
  const M = useMuseumTheme();
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
              await apiFetch("/progress", { method: "DELETE", token: token ?? undefined });
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
              await apiFetch("/users/me", { method: "DELETE", token: token ?? undefined });
              analytics.reset();
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
      <Stack.Screen options={{ title: t("settings.title"), headerStyle: { backgroundColor: M.ink }, headerTintColor: M.parchment, headerShadowVisible: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.card }} edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        >
          {/* Learning */}
          <SectionLabel label={t("settings.learning")} />
          <SettingsRow icon="book.fill" label={t("settings.currentLanguage")} value={getLanguageName(selectedLanguageId)} />
          <SettingsRow icon="flame.fill" label={t("settings.dailyStreak")} value={t("settings.daysCount", { count: summary?.streak ?? 0 })} />
          <SettingsRow icon="star.fill" label={t("settings.pointsEarned")} value={String(summary?.points ?? 0)} />

          {/* Push Notifications */}
          <SectionLabel label={t("settings.notifications")} />
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

          {/* Email Notifications */}
          <SectionLabel label={t("settings.emailNotifications")} />
          <ToggleRow icon="paperplane.fill" label={t("settings.emailWordOfDay")} detail={t("settings.emailWordOfDayDetail")} value={prefs?.emailWotdEnabled ?? true} onToggle={(v) => updatePrefs.mutate({ emailWotdEnabled: v })} disabled={prefsLoading} />
          <ToggleRow icon="arrow.up.circle.fill" label={t("settings.emailStreakReminder")} detail={t("settings.emailStreakReminderDetail")} value={prefs?.emailStreakReminderEnabled ?? true} onToggle={(v) => updatePrefs.mutate({ emailStreakReminderEnabled: v })} disabled={prefsLoading} />
          <ToggleRow icon="calendar" label={t("settings.emailAssignmentDue")} detail={t("settings.emailAssignmentDueDetail")} value={prefs?.emailAssignmentDueEnabled ?? true} onToggle={(v) => updatePrefs.mutate({ emailAssignmentDueEnabled: v })} disabled={prefsLoading} />
          <ToggleRow icon="checkmark.seal.fill" label={t("settings.emailContributionStatus")} detail={t("settings.emailContributionStatusDetail")} value={prefs?.emailContributionStatusEnabled ?? true} onToggle={(v) => updatePrefs.mutate({ emailContributionStatusEnabled: v })} disabled={prefsLoading} />
          <ToggleRow icon="person.badge.shield.checkmark.fill" label={t("settings.emailReviewerStatus")} detail={t("settings.emailReviewerStatusDetail")} value={prefs?.emailReviewerStatusEnabled ?? true} onToggle={(v) => updatePrefs.mutate({ emailReviewerStatusEnabled: v })} disabled={prefsLoading} />

          {/* App */}
          <SectionLabel label={t("settings.app")} />
          <Text style={{ fontSize: 11, color: M.muted, marginBottom: 8, letterSpacing: 0.5 }}>
            {t("settings.appearance")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setPreference(opt)}
                style={{
                  flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 10,
                  backgroundColor: preference === opt ? M.accent : M.ink,
                  borderWidth: 1,
                  borderColor: preference === opt ? M.accent : M.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12, fontWeight: "700",
                    color: preference === opt ? M.ink : M.sub,
                  }}
                >
                  {t(`settings.theme${opt.charAt(0).toUpperCase() + opt.slice(1)}` as any)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 11, color: M.muted, marginBottom: 8, letterSpacing: 0.5 }}>
            {t("settings.uiLanguage")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {LANG_OPTIONS.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setUiLanguage(lang)}
                style={{
                  flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 10,
                  backgroundColor: uiLanguage === lang ? M.accent : M.ink,
                  borderWidth: 1,
                  borderColor: uiLanguage === lang ? M.accent : M.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: uiLanguage === lang ? M.ink : M.sub }}>
                  {LANG_LABELS[lang]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Danger */}
          <SectionLabel label={t("settings.data")} />
          <Pressable
            onPress={handleResetProgress}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: M.border }}
            className="active:opacity-70"
          >
            <IconSymbol name="xmark" size={17} color={M.error} />
            <Text style={{ marginLeft: 14, fontSize: 14, fontWeight: "700", color: M.error }}>
              {t("settings.resetProgress")}
            </Text>
          </Pressable>

          {/* Account */}
          <SectionLabel label={t("settings.account")} />
          <SettingsRow icon="person.fill" label={t("settings.accountSettings")} onPress={() => router.push("/account")} />
          <Pressable
            onPress={handleDeleteAccount}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: M.border }}
            className="active:opacity-70"
          >
            <IconSymbol name="trash" size={17} color={M.error} />
            <Text style={{ marginLeft: 14, fontSize: 14, fontWeight: "700", color: M.error }}>
              {t("settings.deleteAccount")}
            </Text>
          </Pressable>

          {/* App info */}
          <View style={{ marginTop: 36, alignItems: "center" }}>
            <View
              style={{
                paddingHorizontal: 16, paddingVertical: 6,
                borderRadius: 999, borderWidth: 1, borderColor: M.border,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "900", color: M.accent, letterSpacing: 1 }}>BEELI</Text>
            </View>
            <Text style={{ fontSize: 11, color: M.muted }}>
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
