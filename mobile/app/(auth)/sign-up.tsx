import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthLink } from "@/components/auth/auth-link";
import { AuthDivider, SocialAuthPanel } from "@/components/auth/social-auth-panel";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { useSocialAuth, useWarmUpBrowser } from "@/components/auth/use-social-auth";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useClerk, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const M = useMuseumTheme();
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const { t } = useTranslation();
  const formStyle = useAuthReveal();

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useWarmUpBrowser();
  const social = useSocialAuth();

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading;
  const busy = loading || social.pending !== null;

  const onShowEmail = () => {
    setError("");
    social.clearError();
    setEmailExpanded(true);
  };

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
      if (result.status === "complete" && result.createdSessionId) {
        await completeAuth({
          clerk,
          sessionId: result.createdSessionId,
          setActive,
          strategy: "password",
          isSignUp: true,
        });
        router.replace("/(tabs)/learn");
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        router.push("/(auth)/verify-email");
      } else {
        setError(t("auth.signUpIncomplete"));
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
          <AuthHeader title={t("auth.createAccount")} size="compact" />

          <Animated.View style={formStyle}>
            <AuthErrorBanner message={error || social.error} />

            <SocialAuthPanel onPress={social.authenticate} pending={social.pending} disabled={loading} />

            {emailExpanded ? (
              <Animated.View entering={FadeInDown.duration(240)}>
                <AuthDivider label={t("auth.or")} />

                <SpecimenInput
                  label={t("auth.email")}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!busy}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                />

                <SpecimenInput
                  ref={usernameRef}
                  label={t("auth.username")}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!busy}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <SpecimenInput
                  ref={passwordRef}
                  label={t("auth.password")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!busy}
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
                  editable={!busy}
                  onSubmitEditing={onSignUp}
                  returnKeyType="go"
                  error={passwordsMismatch}
                  hint={passwordsMismatch ? t("auth.passwordsMismatch") : undefined}
                />

                <Button
                  label={t("auth.createAccount")}
                  onPress={onSignUp}
                  disabled={!canSubmit || social.pending !== null}
                  loading={loading}
                  style={{ marginTop: 8, marginBottom: 14 }}
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
              prompt={t("auth.alreadyHaveAccount")}
              label={t("auth.alreadyHaveAccountAction")}
              href="/(auth)/sign-in"
              disabled={busy}
              style={{ marginTop: emailExpanded ? 0 : 10 }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
