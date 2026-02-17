import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function VerifyEmailScreen() {
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = code.trim().length === 6 && !loading;

  const onVerify = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/learn");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Verify error:", err);
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : "Invalid code");
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
          Verify Email
        </Text>
        <Text className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Enter the 6-digit code sent to your email
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950">
            <Text className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </View>
        ) : null}

        <TextInput
          className="mb-6 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-center text-2xl font-bold text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="000000"
          placeholderTextColor="#9ca3af"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
          autoFocus
        />

        <Pressable
          onPress={onVerify}
          disabled={!canSubmit}
          className={`mb-4 flex-row items-center justify-center rounded-xl py-3.5 ${
            canSubmit ? "bg-blue-600 active:opacity-80" : "bg-blue-300 dark:bg-blue-800"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Verify</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-center text-blue-600 dark:text-blue-400">
            Back to Sign Up
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
