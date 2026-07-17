import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { SocialProvider } from "@/components/auth/social-button";
import { useClerk, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Google and Apple hand back an email and a name but never a username. When the
 * Clerk instance requires one, the OAuth sign-up stops at
 * `missing_requirements` with no session, and this screen supplies the last
 * field. Password sign-ups never reach it — they collect the username up front.
 */
export default function CompleteProfileScreen() {
  const M = useMuseumTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const { provider } = useLocalSearchParams<{ provider?: SocialProvider }>();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formStyle = useAuthReveal();

  // The in-flight sign-up lives on the Clerk client, not in route params, so a
  // cold start or a killed app drops it. Without this the screen would sit
  // there accepting input it could never submit.
  useEffect(() => {
    if (isLoaded && !signUp?.status) router.replace("/(auth)/sign-in");
  }, [isLoaded, signUp?.status, router]);

  const canSubmit = username.trim().length > 0 && !loading;

  const onSubmit = async () => {
    if (!isLoaded || !canSubmit || !signUp) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.update({ username: username.trim() });
      if (result.status === "complete" && result.createdSessionId) {
        await completeAuth({
          clerk,
          sessionId: result.createdSessionId,
          setActive,
          strategy: provider === "apple" ? "apple" : "google",
          isSignUp: true,
        });
        router.replace("/(tabs)/learn");
      } else {
        setError(t("auth.socialIncomplete"));
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
          title={t("auth.completeProfileTitle")}
          subtitle={t("auth.completeProfileSubtitle")}
          size="compact"
        />

        <Animated.View style={formStyle}>
          <AuthErrorBanner message={error} />

          <SpecimenInput
            label={t("auth.username")}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            editable={!loading}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
            autoFocus
          />

          <Button
            label={t("auth.completeProfileButton")}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
