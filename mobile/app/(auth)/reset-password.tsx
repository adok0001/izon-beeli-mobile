import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { Button } from "@/components/ui/button";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, Text } from "react-native";
import Animated from "react-native-reanimated";
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
  const formStyle = useAuthReveal();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}
      >
        <AuthHeader
          title={t("auth.resetPasswordTitle")}
          subtitle={t("auth.resetPasswordSubtitle")}
          size="compact"
        />

        <Animated.View style={formStyle}>
          <AuthErrorBanner message={error} />

          <SpecimenInput
            label={t("auth.verificationCode")}
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            autoFocus
            textAlign="center"
            large
          />

          <SpecimenInput
            label={t("auth.newPassword")}
            placeholder={t("auth.newPassword")}
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
            onSubmitEditing={onResetPassword}
            returnKeyType="go"
            error={passwordsMismatch}
            hint={passwordsMismatch ? t("auth.passwordsMismatch") : undefined}
          />

          <Button
            label={t("auth.resetPasswordButton")}
            onPress={onResetPassword}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 14 }}
          />

          <Pressable onPress={() => router.back()} disabled={loading} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: M.sub }}>{t("auth.backToSignIn")}</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
