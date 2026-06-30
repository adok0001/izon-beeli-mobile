import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useGuestStore } from "@/store/guest-store";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";

/**
 * Gates an action behind sign-in for guests. Signed-in users (and anyone not
 * in guest mode) run the action immediately; guests see a prompt instead.
 * Render `<SignInPrompt {...gate} />` once per screen alongside this hook.
 */
export function useRequireAuth() {
  const isGuest = useGuestStore((s) => s.isGuest);
  const [descriptionKey, setDescriptionKey] = useState<string | null>(null);

  const requireAuth = useCallback(
    (action: () => void, descriptionKey?: string) => {
      if (isGuest) {
        setDescriptionKey(descriptionKey ?? "common.signInFeedDesc");
        return;
      }
      action();
    },
    [isGuest]
  );

  const closePrompt = useCallback(() => setDescriptionKey(null), []);

  return { requireAuth, descriptionKey, closePrompt };
}

export function SignInPrompt({
  descriptionKey,
  onClose,
}: Readonly<{ descriptionKey: string | null; onClose: () => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSignIn = () => {
    onClose();
    router.push("/(auth)/sign-in");
  };

  return (
    <Modal visible={!!descriptionKey} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("common.cancel")}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: M.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 36,
            borderWidth: 1,
            borderColor: M.border,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${M.accent}20`,
              }}
            >
              <IconSymbol name="lock.fill" size={20} color={M.accent} />
            </View>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: M.text, textAlign: "center" }}>
            {t("common.signInToInteract")}
          </Text>
          {descriptionKey ? (
            <Text style={{ fontSize: 13, color: M.sub, textAlign: "center", marginTop: 8, lineHeight: 18 }}>
              {t(descriptionKey)}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSignIn}
            style={{
              marginTop: 20,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
              backgroundColor: M.accent,
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: M.ink }}>
              {t("common.signIn")}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: M.muted }}>{t("common.cancel")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
