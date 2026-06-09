import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignUp } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useToast } from "@/lib/hooks/use-toast";

const mascot = require("../../public/mascot.jpg");


export default function SignUpScreen() {
  const M = useMuseumTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { toast, error: toastError, dismiss: dismissToast } = useToast();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
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
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        router.push("/(auth)/verify-email");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : "Something went wrong");
      setError(message);
      toastError(t("common.error"), message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError = false) => ({
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hasError ? "rgba(239, 68, 68, 0.5)" : M.border,
    backgroundColor: M.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: M.text,
    marginBottom: 4,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg }}>
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <Animated.View
            style={{
              alignItems: "center",
              marginBottom: 32,
              opacity: logoAnim,
              transform: [
                {
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                borderRadius: 20,
                padding: 3,
                borderWidth: 1,
                borderColor: M.accentBorder,
                marginBottom: 14,
              }}
            >
              <Image
                source={mascot}
                style={{ width: 72, height: 48, borderRadius: 17 }}
                contentFit="contain"
              />
            </View>
            <Text style={{ fontSize: 30, fontWeight: "900", color: M.text, letterSpacing: -0.4 }}>
              {t("auth.createAccount")}
            </Text>
            <Text style={{ fontSize: 13, color: M.sub, marginTop: 4 }}>
              {t("auth.createAccountSubtitle")}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={{
              opacity: formAnim,
              transform: [
                {
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            }}
          >
            {error ? (
              <View
                style={{
                  marginBottom: 16,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: M.errorBg,
                  borderWidth: 1,
                  borderColor: M.errorBorder,
                }}
              >
                <Text style={{ textAlign: "center", fontSize: 13, color: M.error }}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              style={[inputStyle(), { marginBottom: 12 }]}
              placeholder={t("auth.email")}
              placeholderTextColor={M.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TextInput
              style={[inputStyle(), { marginBottom: 12 }]}
              placeholder={t("auth.username")}
              placeholderTextColor={M.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!loading}
            />

            <TextInput
              style={inputStyle(passwordTooShort)}
              placeholder={t("auth.password")}
              placeholderTextColor={M.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />
            {passwordTooShort ? (
              <Text style={{ fontSize: 11, color: M.warning, marginBottom: 10, marginLeft: 4 }}>
                {t("auth.passwordTooShort")}
              </Text>
            ) : (
              <View style={{ height: 10 }} />
            )}

            <TextInput
              style={inputStyle(passwordsMismatch)}
              placeholder={t("auth.confirmPassword")}
              placeholderTextColor={M.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={onSignUp}
              returnKeyType="go"
            />
            {passwordsMismatch ? (
              <Text style={{ fontSize: 11, color: M.error, marginBottom: 16, marginLeft: 4 }}>
                {t("auth.passwordsMismatch")}
              </Text>
            ) : (
              <View style={{ height: 18 }} />
            )}

            <Pressable
              onPress={onSignUp}
              disabled={!canSubmit}
              style={{
                marginBottom: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                paddingVertical: 15,
                backgroundColor: canSubmit ? M.accent : "rgba(196, 134, 42, 0.25)",
                borderWidth: 1,
                borderColor: canSubmit ? M.accent : "rgba(196, 134, 42, 0.2)",
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={M.ink} />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: canSubmit ? M.ink : "rgba(196, 134, 42, 0.5)",
                    letterSpacing: 0.3,
                  }}
                >
                  {t("auth.createAccount")}
                </Text>
              )}
            </Pressable>

            <Link href="/(auth)/sign-in" asChild>
              <Pressable disabled={loading} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: M.sub }}>
                  {t("auth.alreadyHaveAccount")}
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
