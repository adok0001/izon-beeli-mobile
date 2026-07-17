import { SocialButton, type SocialProvider } from "@/components/auth/social-button";
import { APPLE_AVAILABLE } from "@/components/auth/use-social-auth";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export interface SocialAuthPanelProps {
  onPress: (provider: SocialProvider) => void;
  /** Which provider is mid-flight — the other button greys out rather than queueing a second sheet. */
  pending: SocialProvider | null;
  disabled?: boolean;
}

export function SocialAuthPanel({ onPress, pending, disabled = false }: SocialAuthPanelProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      <SocialButton
        provider="google"
        label={t("auth.continueWithGoogle")}
        onPress={() => onPress("google")}
        loading={pending === "google"}
        disabled={disabled || (pending !== null && pending !== "google")}
      />
      {APPLE_AVAILABLE ? (
        <SocialButton
          provider="apple"
          label={t("auth.continueWithApple")}
          onPress={() => onPress("apple")}
          loading={pending === "apple"}
          disabled={disabled || (pending !== null && pending !== "apple")}
        />
      ) : null}
    </View>
  );
}

export function AuthDivider({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <Text style={{ fontSize: 11, letterSpacing: 1.5, color: M.muted }}>{label.toUpperCase()}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}
