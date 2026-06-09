import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useSignIn } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mascot = require("../../public/mascot.jpg");


export default function SignInScreen() {
  const M = useMuseumTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const onSignIn = async () => {
    if (!isLoaded || !canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
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
        {/* Brand lockup */}
        <Animated.View
          style={{
            alignItems: "center",
            marginBottom: 36,
            opacity: logoAnim,
            transform: [
              {
                translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              borderRadius: 20,
              padding: 3,
              borderWidth: 1,
              borderColor: M.accentBorder,
              marginBottom: 16,
            }}
          >
            <Image
              source={mascot}
              style={{ width: 80, height: 54, borderRadius: 17 }}
              contentFit="contain"
            />
          </View>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "900",
              color: M.text,
              letterSpacing: -0.5,
            }}
          >
            Beeli
          </Text>
          <Text style={{ fontSize: 13, color: M.sub, marginTop: 4 }}>
            {t("auth.signInSubtitle")}
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={{
            opacity: formAnim,
            transform: [
              {
                translateY: formAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          {error ? (
            <View
              style={{
                marginBottom: 16,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: M.errorBg,
                borderWidth: 1,
                borderColor: M.errorBorder,
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 13, color: M.error }}>
                {error}
              </Text>
            </View>
          ) : null}

          <TextInput
            style={{
              marginBottom: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: M.border,
              backgroundColor: M.card,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: M.text,
            }}
            placeholder={t("auth.emailOrUsername")}
            placeholderTextColor={M.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={{
              marginBottom: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: M.border,
              backgroundColor: M.card,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              color: M.text,
            }}
            placeholder={t("auth.password")}
            placeholderTextColor={M.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
            onSubmitEditing={onSignIn}
            returnKeyType="go"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable disabled={loading} style={{ alignSelf: "flex-end", marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: M.accent }}>
                {t("auth.forgotPassword")}
              </Text>
            </Pressable>
          </Link>

          <Pressable
            onPress={onSignIn}
            disabled={!canSubmit}
            style={{
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              paddingVertical: 15,
              backgroundColor: canSubmit ? M.accent : "rgba(196, 134, 42, 0.25)",
              borderWidth: 1,
              borderColor: canSubmit ? M.accent : "rgba(196, 134, 42, 0.2)",
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={M.ink} />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "800",
                  color: canSubmit ? M.ink : "rgba(196, 134, 42, 0.5)",
                  letterSpacing: 0.3,
                }}
              >
                {t("auth.signInButton")}
              </Text>
            )}
          </Pressable>

          <Link href="/(auth)/sign-up" asChild>
            <Pressable disabled={loading} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: M.sub }}>
                {t("auth.noAccount")}
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
