import { useSignIn } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

const mascot = require("../../public/mascot.jpg");

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && !loading;

  const onRequestReset = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      router.push("/(auth)/reset-password");
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
        <View className="mb-4 items-center">
          <Image
            source={mascot}
            style={{ width: 100, height: 68 }}
            contentFit="contain"
          />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-900 dark:text-white">
          {t("auth.forgotPasswordTitle")}
        </Text>
        <Text className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t("auth.forgotPasswordSubtitle")}
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950">
            <Text className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </View>
        ) : null}

        <TextInput
          className="mb-6 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder={t("auth.email")}
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
          onSubmitEditing={onRequestReset}
          returnKeyType="send"
          autoFocus
        />

        <Pressable
          onPress={onRequestReset}
          disabled={!canSubmit}
          className={`mb-4 flex-row items-center justify-center rounded-xl py-3.5 ${
            canSubmit ? "bg-blue-600 active:opacity-80" : "bg-blue-300 dark:bg-blue-800"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">
              {t("auth.sendResetCode")}
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
