import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthLink } from "@/components/auth/auth-link";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formStyle = useAuthReveal();

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
      // Carried through so the next screen can name the address it mailed and
      // re-issue a code without asking for it again.
      router.push({
        pathname: "/(auth)/reset-password",
        params: { identifier: email.trim() },
      });
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
          title={t("auth.forgotPasswordTitle")}
          subtitle={t("auth.forgotPasswordSubtitle")}
          size="compact"
        />

        <Animated.View style={formStyle}>
          <AuthErrorBanner message={error} />

          <SpecimenInput
            label={t("auth.email")}
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

          <Button
            label={t("auth.sendResetCode")}
            onPress={onRequestReset}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 14 }}
          />

          <AuthLink label={t("auth.backToSignIn")} onPress={() => router.back()} disabled={loading} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
