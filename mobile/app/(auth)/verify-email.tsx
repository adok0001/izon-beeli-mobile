import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { Button } from "@/components/ui/button";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, Text } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formStyle = useAuthReveal();

  const canSubmit = code.trim().length === 6 && !loading;

  const onVerify = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive?.({ session: result.createdSessionId });
        router.replace("/(tabs)/learn");
      } else {
        setError(t("auth.verifyIncomplete"));
      }
    } catch (err: unknown) {
      console.error("Verify error:", err);
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
        <AuthHeader title={t("auth.verifyEmailTitle")} subtitle={t("auth.verifyEmailSubtitle")} size="compact" />

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

          <Button
            label={t("auth.verifyButton")}
            onPress={onVerify}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 14 }}
          />

          <Pressable onPress={() => router.back()} disabled={loading} style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: M.sub }}>{t("auth.backToSignUp")}</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
