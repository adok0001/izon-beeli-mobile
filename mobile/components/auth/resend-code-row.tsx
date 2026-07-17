import type { UseResendCodeResult } from "@/components/auth/use-resend-code";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

/**
 * The escape hatch for a code that never arrived. Without it the code screens
 * are a dead end: the only way out is back to the start of the flow.
 */
export function ResendCodeRow({ state, disabled = false }: { state: UseResendCodeResult; disabled?: boolean }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { secondsLeft, sending, justSent } = state;
  const waiting = secondsLeft > 0;

  if (justSent) {
    return (
      <View style={{ alignItems: "center", marginTop: 18, paddingVertical: 6 }}>
        <Text
          style={{ fontSize: 13, color: M.success }}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {t("auth.codeSent")}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={state.resend}
      disabled={disabled || waiting || sending}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || waiting || sending, busy: sending }}
      style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18, paddingVertical: 6 }}
    >
      {sending ? <ActivityIndicator size="small" color={M.muted} /> : null}
      <Text style={{ fontSize: 13, color: waiting || sending ? M.muted : M.accent }}>
        {sending
          ? t("auth.sendingCode")
          : waiting
            ? t("auth.resendIn", { seconds: String(secondsLeft) })
            : t("auth.resendCode")}
      </Text>
    </Pressable>
  );
}
