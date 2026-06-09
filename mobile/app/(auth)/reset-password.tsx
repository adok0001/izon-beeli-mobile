import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    /^\d{6}$/.test(code.trim()) &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const onResetPassword = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/learn");
      } else {
        setError(t("auth.resetIncomplete"));
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : t("common.error"));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          {t("auth.resetPasswordTitle")}
        </Text>
        <Text className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t("auth.resetPasswordSubtitle")}
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950">
            <Text className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </View>
        ) : null}

        <TextInput
          className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-center text-2xl font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="000000"
          placeholderTextColor={M.muted}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
          autoFocus
        />

        <TextInput
          className={`mb-1 rounded-xl border bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white ${
            passwordTooShort
              ? "border-amber-400 dark:border-amber-600"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
          placeholder={t("auth.newPassword")}
          placeholderTextColor={M.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />
        {passwordTooShort ? (
          <Text className="mb-3 ml-1 text-xs text-amber-600 dark:text-amber-400">
            {t("auth.passwordTooShort")}
          </Text>
        ) : (
          <View className="mb-3" />
        )}

        <TextInput
          className={`mb-1 rounded-xl border bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white ${
            passwordsMismatch
              ? "border-red-400 dark:border-red-600"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
          placeholder={t("auth.confirmPassword")}
          placeholderTextColor={M.muted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={onResetPassword}
          returnKeyType="go"
        />
        {passwordsMismatch ? (
          <Text className="mb-5 ml-1 text-xs text-red-500">
            {t("auth.passwordsMismatch")}
          </Text>
        ) : (
          <View className="mb-5" />
        )}

        <Pressable
          onPress={onResetPassword}
          disabled={!canSubmit}
          className={`mb-4 flex-row items-center justify-center rounded-xl py-3.5 ${
            canSubmit ? "bg-blue-600 active:opacity-80" : "bg-blue-300 dark:bg-blue-800"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">
              {t("auth.resetPasswordButton")}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} disabled={loading}>
          <Text className="text-center text-blue-600 dark:text-blue-400">
            {t("auth.backToSignIn")}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
