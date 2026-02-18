import { useSignUp } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mascot = require("../../public/mascot.jpg");

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;

  const onSignUp = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        username: username.trim(),
        password,
      });
      
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/learn");
      } else if (result.status === "missing_requirements") {
        // Email needs to be verified
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        router.push("/(auth)/verify-email");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : "Something went wrong");
      setError(message);
      Alert.alert("Error", message);
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
          Create Account
        </Text>
        <Text className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Start your language learning journey
        </Text>

        {error ? (
          <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950">
            <Text className="text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </View>
        ) : null}

        <TextInput
          className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />

        <TextInput
          className="mb-4 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          placeholder="Username"
          placeholderTextColor="#9ca3af"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          editable={!loading}
        />

        <TextInput
          className={`mb-1 rounded-xl border bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white ${
            passwordTooShort
              ? "border-amber-400 dark:border-amber-600"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />
        {passwordTooShort ? (
          <Text className="mb-3 ml-1 text-xs text-amber-600 dark:text-amber-400">
            Password must be at least 8 characters
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
          placeholder="Confirm Password"
          placeholderTextColor="#9ca3af"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          onSubmitEditing={onSignUp}
          returnKeyType="go"
        />
        {passwordsMismatch ? (
          <Text className="mb-5 ml-1 text-xs text-red-500">
            Passwords do not match
          </Text>
        ) : (
          <View className="mb-5" />
        )}

        <Pressable
          onPress={onSignUp}
          disabled={!canSubmit}
          className={`mb-4 flex-row items-center justify-center rounded-xl py-3.5 ${
            canSubmit ? "bg-blue-600 active:opacity-80" : "bg-blue-300 dark:bg-blue-800"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Create Account</Text>
          )}
        </Pressable>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable disabled={loading}>
            <Text className="text-center text-blue-600 dark:text-blue-400">
              Already have an account? Sign In
            </Text>
          </Pressable>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
