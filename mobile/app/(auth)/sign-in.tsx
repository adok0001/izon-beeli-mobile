import { AuthErrorBanner } from "@/components/auth/auth-error-banner";
import { AuthHeader } from "@/components/auth/auth-header";
import { SpecimenInput } from "@/components/auth/specimen-input";
import { useAuthReveal } from "@/components/auth/use-auth-reveal";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { sessionToSnapshot, upsertKnownAccount } from "@/lib/known-accounts";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useGuestStore } from "@/store/guest-store";
import { useClerk, useSignIn } from "@clerk/clerk-expo";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, Text } from "react-native";
import Animated from "react-native-reanimated";
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
  const { t } = useTranslation();
  const enterGuest = useGuestStore((s) => s.enterGuest);
  const formStyle = useAuthReveal();

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const onContinueAsGuest = () => {
    analytics.guestStart();
    enterGuest();
    router.replace("/(tabs)/learn");
  };

  const onSignIn = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const session = clerk.client.signedInSessions.find(
          (s) => s.id === result.createdSessionId
        );
        const snapshot = session ? sessionToSnapshot(session) : null;
        if (snapshot) await upsertKnownAccount(snapshot);
        analytics.signIn();
        analytics.identify(email.trim(), { email: email.trim() });
        router.replace("/(tabs)/learn");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      const message =
        clerkErr.errors?.[0]?.message ??
        (err instanceof Error ? err.message : "Something went wrong");
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
        <AuthHeader title="Beeli" subtitle={t("auth.signInSubtitle")} />

        <Animated.View style={formStyle}>
          <AuthErrorBanner message={error} />

          <SpecimenInput
            label={t("auth.emailOrUsername")}
            placeholder={t("auth.emailOrUsername")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <SpecimenInput
            label={t("auth.password")}
            placeholder={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
            onSubmitEditing={onSignIn}
            returnKeyType="go"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable disabled={loading} style={{ alignSelf: "flex-end", marginBottom: 24 }}>
              <Text style={{ fontSize: 12, color: M.accent }}>{t("auth.forgotPassword")}</Text>
            </Pressable>
          </Link>

          <Button
            label={t("auth.signInButton")}
            onPress={onSignIn}
            disabled={!canSubmit}
            loading={loading}
            style={{ marginBottom: 14 }}
          />

          <Link href="/(auth)/sign-up" asChild>
            <Pressable disabled={loading} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: M.sub }}>{t("auth.noAccount")}</Text>
            </Pressable>
          </Link>

          <Pressable onPress={onContinueAsGuest} disabled={loading} style={{ alignItems: "center", marginTop: 18 }}>
            <Text style={{ fontSize: 13, color: M.muted, textDecorationLine: "underline" }}>
              {t("auth.continueAsGuest")}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
