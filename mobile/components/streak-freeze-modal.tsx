import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUseFreeze } from "@/lib/hooks/use-progress";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface StreakFreezeModalProps {
  visible: boolean;
  streak: number;
  freezeCount: number;
  onDismiss: () => void;
}

export function StreakFreezeModal({
  visible,
  streak,
  freezeCount,
  onDismiss,
}: StreakFreezeModalProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const useFreeze = useUseFreeze();

  const handleUseFreeze = async () => {
    useFreeze.mutate(undefined, { onSuccess: onDismiss });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 24 }}>
        <View style={{ width: "100%", borderRadius: 24, backgroundColor: M.card, padding: 24, borderWidth: 1, borderColor: M.border }}>
          <View style={{ marginBottom: 16, alignItems: "center" }}>
            <View style={{ height: 80, width: 80, alignItems: "center", justifyContent: "center", borderRadius: 40, backgroundColor: `${M.accent}20`, borderWidth: 1, borderColor: `${M.accent}40` }}>
              <IconSymbol name="flame.fill" size={40} color={M.accent} />
            </View>
          </View>

          <Text style={{ textAlign: "center", fontSize: 24, fontWeight: "700", color: M.text }}>
            {t("streak.brokenTitle")}
          </Text>
          <Text style={{ marginTop: 8, textAlign: "center", fontSize: 13, color: M.sub }}>
            {t("streak.brokenMessage", { streak })}
          </Text>

          {freezeCount > 0 ? (
            <>
              <View style={{ marginTop: 20, borderRadius: 16, backgroundColor: M.accentGlow, padding: 16, borderWidth: 1, borderColor: M.accentBorder }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: M.accent }}>
                    <IconSymbol name="snowflake" size={20} color={M.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: M.text }}>{t("streak.useFreezeTitle")}</Text>
                    <Text style={{ fontSize: 11, color: M.sub }}>{t("streak.useFreezeDescription", { count: freezeCount })}</Text>
                  </View>
                </View>
              </View>

              <Pressable onPress={handleUseFreeze} disabled={useFreeze.isPending} style={{ marginTop: 16, alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }} className="active:opacity-80">
                {useFreeze.isPending ? (
                  <ActivityIndicator color={M.ink} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "700", color: M.ink }}>{t("streak.restoreButton")}</Text>
                )}
              </Pressable>

              <Pressable onPress={onDismiss} style={{ marginTop: 12, alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: M.muted }}>{t("streak.startFreshLink")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: M.sub }}>{t("streak.noFreezesMessage")}</Text>
              <Pressable onPress={onDismiss} style={{ marginTop: 20, alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }} className="active:opacity-80">
                <Text style={{ fontSize: 16, fontWeight: "700", color: M.ink }}>{t("streak.startFreshButton")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
