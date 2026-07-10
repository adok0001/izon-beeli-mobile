import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const formStyle = useAuthReveal();

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
        analytics.signUp();
        analytics.identify(email.trim(), { email: email.trim(), username: username.trim() });
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg }}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title={t("auth.createAccount")} subtitle={t("auth.createAccountSubtitle")} size="compact" />

          <Animated.View style={formStyle}>
            <AuthErrorBanner message={error} />

            <SpecimenInput
              label={t("auth.email")}
              placeholder={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <SpecimenInput
              label={t("auth.username")}
              placeholder={t("auth.username")}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              editable={!loading}
            />

            <SpecimenInput
              label={t("auth.password")}
              placeholder={t("auth.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
              error={passwordTooShort}
              hint={passwordTooShort ? t("auth.passwordTooShort") : undefined}
              hintTone="warning"
            />

            <SpecimenInput
              label={t("auth.confirmPassword")}
              placeholder={t("auth.confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={onSignUp}
              returnKeyType="go"
              error={passwordsMismatch}
              hint={passwordsMismatch ? t("auth.passwordsMismatch") : undefined}
            />

            <Button
              label={t("auth.createAccount")}
              onPress={onSignUp}
              disabled={!canSubmit}
              loading={loading}
              style={{ marginTop: 8, marginBottom: 14 }}
            />

            <Link href="/(auth)/sign-in" asChild>
              <Pressable disabled={loading} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: M.sub }}>{t("auth.alreadyHaveAccount")}</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
