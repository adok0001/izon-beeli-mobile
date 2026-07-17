import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthLink } from "@/components/auth/auth-link";
import { ResendCodeRow } from "@/components/auth/resend-code-row";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { useResendCode } from "@/components/auth/use-resend-code";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, TextInput } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formStyle = useAuthReveal();

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Re-issuing the reset code means re-creating the sign-in attempt with the
  // same identifier, exactly as the forgot-password screen did.
  const resend = useResendCode({
    send: useCallback(async () => {
      if (!isLoaded || !identifier) throw new Error(t("common.error"));
      await signIn.create({ strategy: "reset_password_email_code", identifier });
    }, [isLoaded, identifier, signIn, t]),
    fallbackError: t("common.error"),
  });

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
      if (result.status === "complete" && result.createdSessionId) {
        await completeAuth({
          clerk,
          sessionId: result.createdSessionId,
          setActive,
          strategy: "password",
        });
        router.replace("/(tabs)/learn");
      } else {
        setError(t("auth.resetIncomplete"));
      }
    } catch (err) {
      setError(authErrorMessage(err, t("common.error")));
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
          subtitle={
            identifier
              ? t("auth.resetPasswordSentTo", { email: identifier })
              : t("auth.resetPasswordSubtitle")
          }
          size="compact"
        />

        <Animated.View style={formStyle}>
          <AuthErrorBanner message={error || resend.error} />

          <SpecimenInput
            label={t("auth.verificationCode")}
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            editable={!loading}
            autoFocus
            textAlign="center"
            large
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <SpecimenInput
            ref={passwordRef}
            label={t("auth.newPassword")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!loading}
            error={passwordTooShort}
            hint={passwordTooShort ? t("auth.passwordTooShort") : undefined}
            hintTone="warning"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <SpecimenInput
            ref={confirmRef}
            label={t("auth.confirmPassword")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
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

          {identifier ? <ResendCodeRow state={resend} disabled={loading} /> : null}

          <AuthLink
            label={t("auth.backToSignIn")}
            onPress={() => router.back()}
            disabled={loading}
            style={{ marginTop: 10 }}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
