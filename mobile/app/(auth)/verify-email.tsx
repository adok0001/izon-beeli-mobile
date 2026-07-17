import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResendCodeRow } from "@/components/auth/resend-code-row";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { useResendCode } from "@/components/auth/use-resend-code";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useClerk, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, Text } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formStyle = useAuthReveal();

  const resend = useResendCode({
    send: useCallback(async () => {
      await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
    }, [signUp]),
    fallbackError: t("common.error"),
  });

  const canSubmit = code.trim().length === 6 && !loading;

  const onVerify = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      // Email sign-up actually completes here, not on the sign-up screen, so
      // this is the path that owes the known-accounts write — without it a
      // brand-new account never appears on the "sign back in" switcher.
      if (result.status === "complete" && result.createdSessionId) {
        await completeAuth({
          clerk,
          sessionId: result.createdSessionId,
          setActive,
          strategy: "password",
          isSignUp: true,
        });
        router.replace("/(tabs)/learn");
      } else {
        setError(t("auth.verifyIncomplete"));
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
        <AuthHeader title={t("auth.verifyEmailTitle")} subtitle={t("auth.verifyEmailSubtitle")} size="compact" />

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
          />

          <Button
            label={t("auth.verifyButton")}
            onPress={onVerify}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 14 }}
          />

          <ResendCodeRow state={resend} disabled={loading} />

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            style={{ alignItems: "center", marginTop: 18 }}
          >
            <Text style={{ fontSize: 13, color: M.sub }}>{t("auth.backToSignUp")}</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
