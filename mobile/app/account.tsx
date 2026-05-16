import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useToast } from "@/lib/hooks/use-toast";
import { useUser } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { useState } from "react";
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
  return (
    <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
      {label}
    </Text>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label}
    </Text>
  );
}

export default function AccountScreen() {
  const { user } = useUser();
  const { t } = useTranslation();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [username, setUsername] = useState(user?.username ?? "");
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSaveUsername =
    username.trim().length > 0 &&
    username.trim() !== (user?.username ?? "") &&
    !usernameLoading;

  const canSavePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !passwordLoading;

  const onSaveUsername = async () => {
    if (!canSaveUsername) return;
    setUsernameLoading(true);
    try {
      await user?.update({ username: username.trim() });
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
    if (!canSavePassword) return;
    setPasswordLoading(true);
    try {
      await user?.updatePassword({ currentPassword, newPassword });
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
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-5 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Username */}
            <SectionHeader label={t("account.usernameSection")} />
            <FieldLabel label={t("auth.username")} />
            <TextInput
              className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!usernameLoading}
              returnKeyType="done"
              onSubmitEditing={onSaveUsername}
            />
            <Pressable
              onPress={onSaveUsername}
              disabled={!canSaveUsername}
              className={`mb-8 flex-row items-center justify-center rounded-xl py-3.5 ${
                canSaveUsername
                  ? "bg-blue-600 active:opacity-80"
                  : "bg-blue-300 dark:bg-blue-800"
              }`}
            >
              {usernameLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  {t("account.saveUsername")}
                </Text>
              )}
            </Pressable>

            {/* Password */}
            <SectionHeader label={t("account.passwordSection")} />
            <FieldLabel label={t("account.currentPassword")} />
            <TextInput
              className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!passwordLoading}
            />

            <FieldLabel label={t("auth.newPassword")} />
            <TextInput
              className={`mb-1 rounded-xl border bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white ${
                newPasswordTooShort
                  ? "border-amber-400 dark:border-amber-600"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!passwordLoading}
            />
            {newPasswordTooShort ? (
              <Text className="mb-3 ml-1 text-xs text-amber-600 dark:text-amber-400">
                {t("auth.passwordTooShort")}
              </Text>
            ) : (
              <View className="mb-3" />
            )}

            <FieldLabel label={t("auth.confirmPassword")} />
            <TextInput
              className={`mb-1 rounded-xl border bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white ${
                passwordsMismatch
                  ? "border-red-400 dark:border-red-600"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!passwordLoading}
              returnKeyType="go"
              onSubmitEditing={onSavePassword}
            />
            {passwordsMismatch ? (
              <Text className="mb-5 ml-1 text-xs text-red-500">
                {t("auth.passwordsMismatch")}
              </Text>
            ) : (
              <View className="mb-5" />
            )}

            <Pressable
              onPress={onSavePassword}
              disabled={!canSavePassword}
              className={`mb-8 flex-row items-center justify-center rounded-xl py-3.5 ${
                canSavePassword
                  ? "bg-blue-600 active:opacity-80"
                  : "bg-blue-300 dark:bg-blue-800"
              }`}
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  {t("account.savePassword")}
                </Text>
              )}
            </Pressable>

            <View className="h-4" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
