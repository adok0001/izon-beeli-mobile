import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthLink } from "@/components/auth/auth-link";
import { AuthDivider, SocialAuthPanel } from "@/components/auth/social-auth-panel";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { useSocialAuth, useWarmUpBrowser } from "@/components/auth/use-social-auth";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { authErrorMessage } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useGuestStore } from "@/store/guest-store";
import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const M = useMuseumTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { identifier: prefillIdentifier } = useLocalSearchParams<{ identifier?: string }>();
  const [email, setEmail] = useState(prefillIdentifier ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Arriving from the account switcher means the identifier is already known,
  // so the email path is the one they're on — opening collapsed would hide
  // their own prefilled address behind a tap.
  const [emailExpanded, setEmailExpanded] = useState(!!prefillIdentifier);
  const { t } = useTranslation();
  const enterGuest = useGuestStore((s) => s.enterGuest);
  const formStyle = useAuthReveal();
  const passwordRef = useRef<TextInput>(null);

  useWarmUpBrowser();
  const social = useSocialAuth();

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;
  const busy = loading || social.pending !== null;

  const onContinueAsGuest = () => {
    analytics.guestStart();
    enterGuest();
    router.replace("/(tabs)/learn");
  };

  const onShowEmail = () => {
    setError("");
    social.clearError();
    setEmailExpanded(true);
  };

  const onSignIn = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete" && result.createdSessionId) {
        await completeAuth({
          clerk,
          sessionId: result.createdSessionId,
          setActive,
          strategy: "password",
        });
        router.replace("/(tabs)/learn");
      } else {
        // Clerk wants another step this flow doesn't implement (a second
        // factor, a forced reset). Without this the button would just stop
        // spinning and leave the user staring at an unchanged screen.
        setError(t("auth.signInIncomplete"));
      }
    } catch (err) {
      setError(authErrorMessage(err, t("common.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.authBg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title="Beeli" />

          <Animated.View style={formStyle}>
            <AuthErrorBanner message={error || social.error} />

            <SocialAuthPanel onPress={social.authenticate} pending={social.pending} disabled={loading} />

            {emailExpanded ? (
              <Animated.View entering={FadeInDown.duration(240)}>
                <AuthDivider label={t("auth.or")} />

                <SpecimenInput
                  label={t("auth.emailOrUsername")}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!busy}
                  autoFocus={!prefillIdentifier}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <SpecimenInput
                  ref={passwordRef}
                  label={t("auth.password")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!busy}
                  onSubmitEditing={onSignIn}
                  returnKeyType="go"
                />

                <AuthLink
                  label={t("auth.forgotPassword")}
                  href="/(auth)/forgot-password"
                  align="end"
                  disabled={busy}
                  style={{ marginBottom: 16 }}
                />

                <Button
                  label={t("auth.signInButton")}
                  onPress={onSignIn}
                  disabled={!canSubmit || social.pending !== null}
                  loading={loading}
                  style={{ marginBottom: 14 }}
                />

                {/* Only the email path needs this: Google and Apple create the
                    account on first use, so offering "sign up" alongside them
                    would just be a third link competing for the same tap. */}
                <AuthLink
                  prompt={t("auth.noAccount")}
                  label={t("auth.noAccountAction")}
                  href="/(auth)/sign-up"
                  disabled={busy}
                />
              </Animated.View>
            ) : (
              <AuthLink
                label={t("auth.useEmailInstead")}
                onPress={onShowEmail}
                disabled={busy}
                style={{ marginTop: 14 }}
              />
            )}

            <AuthLink
              label={t("auth.continueAsGuest")}
              onPress={onContinueAsGuest}
              tone="quiet"
              disabled={busy}
              style={{ marginTop: 10 }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
