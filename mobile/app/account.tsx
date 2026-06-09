import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUser } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SectionHeader({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <Text style={{ marginBottom: 12, fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", color: M.muted }}>
      {label}
    </Text>
  );
}

function FieldLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <Text style={{ marginBottom: 6, fontSize: 13, fontWeight: "500", color: M.sub }}>
      {label}
    </Text>
  );
}

export default function AccountScreen() {
  const M = useMuseumTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [username, setUsername] = useState(user?.username ?? "");
  const [usernameLoading, setUsernameLoading] = useState(false);

  useEffect(() => {
    if (user?.username != null) {
      setUsername(user.username);
    }
  }, [user?.username]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSaveUsername =
    !!user &&
    username.trim().length > 0 &&
    username.trim() !== (user?.username ?? "") &&
    !usernameLoading;

  const canSavePassword =
    !!user &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !passwordLoading;

  const onSaveUsername = async () => {
    if (!user || !canSaveUsername) return;
    setUsernameLoading(true);
    try {
      await user.update({ username: username.trim() });
      toastSuccess(t("account.saved"), t("account.usernameSaved"));
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : t("common.error"));
      toastError(t("common.error"), message);
    } finally {
      setUsernameLoading(false);
    }
  };

  const onSavePassword = async () => {
    if (!user || !canSavePassword) return;
    setPasswordLoading(true);
    try {
      await user.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toastSuccess(t("account.saved"), t("account.passwordSaved"));
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : t("common.error"));
      toastError(t("common.error"), message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t("account.title") }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader label={t("account.usernameSection")} />
            <FieldLabel label={t("auth.username")} />
            <TextInput
              style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: M.text }}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!usernameLoading}
              returnKeyType="done"
              onSubmitEditing={onSaveUsername}
              placeholderTextColor={M.muted}
            />
            <Pressable
              onPress={onSaveUsername}
              disabled={!canSaveUsername}
              style={{ marginBottom: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, backgroundColor: canSaveUsername ? M.accent : M.border, opacity: canSaveUsername ? 1 : 0.6 }}
              className="active:opacity-80"
            >
              {usernameLoading ? (
                <ActivityIndicator size="small" color={M.ink} />
              ) : (
                <Text style={{ fontWeight: "600", color: canSaveUsername ? M.ink : M.sub }}>
                  {t("account.saveUsername")}
                </Text>
              )}
            </Pressable>

            <SectionHeader label={t("account.passwordSection")} />
            <FieldLabel label={t("account.currentPassword")} />
            <TextInput
              style={{ marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: M.text }}
              placeholder="••••••••"
              placeholderTextColor={M.muted}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!passwordLoading}
            />

            <FieldLabel label={t("auth.newPassword")} />
            <TextInput
              style={{ marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: newPasswordTooShort ? M.warning : M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: M.text }}
              placeholder="••••••••"
              placeholderTextColor={M.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!passwordLoading}
            />
            {newPasswordTooShort ? (
              <Text style={{ marginBottom: 12, marginLeft: 4, fontSize: 12, color: M.warning }}>
                {t("auth.passwordTooShort")}
              </Text>
            ) : (
              <View style={{ marginBottom: 12 }} />
            )}

            <FieldLabel label={t("auth.confirmPassword")} />
            <TextInput
              style={{ marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: passwordsMismatch ? M.error : M.border, backgroundColor: M.card, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: M.text }}
              placeholder="••••••••"
              placeholderTextColor={M.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!passwordLoading}
              returnKeyType="go"
              onSubmitEditing={onSavePassword}
            />
            {passwordsMismatch ? (
              <Text style={{ marginBottom: 20, marginLeft: 4, fontSize: 12, color: M.error }}>
                {t("auth.passwordsMismatch")}
              </Text>
            ) : (
              <View style={{ marginBottom: 20 }} />
            )}

            <Pressable
              onPress={onSavePassword}
              disabled={!canSavePassword}
              style={{ marginBottom: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, backgroundColor: canSavePassword ? M.accent : M.border, opacity: canSavePassword ? 1 : 0.6 }}
              className="active:opacity-80"
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color={M.ink} />
              ) : (
                <Text style={{ fontWeight: "600", color: canSavePassword ? M.ink : M.sub }}>
                  {t("account.savePassword")}
                </Text>
              )}
            </Pressable>

            <View style={{ height: 16 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
