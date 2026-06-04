import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { MOBILE_TOUR_REGISTRY } from "@/lib/tours/mobile-tour-registry";
import { useTourStore } from "@/store/tour-store";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FeatureItem {
  icon: string;
  color: string;
  bgColor: string;
  titleKey: string;
  detailKey: string;
}

const resolveText = (
  t: (key: string) => string,
  key: string
) => {
  return t(key);
};

function FeatureCard({ item, t }: Readonly<{ item: FeatureItem; t: (key: string) => string }>) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 16 }}>
      <View
        style={{ marginRight: 16, height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: item.bgColor }}
      >
        <IconSymbol name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: M.text }}>
          {resolveText(t, item.titleKey)}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 20, color: M.sub }}>
          {resolveText(t, item.detailKey)}
        </Text>
      </View>
    </View>
  );
}

export function FeatureTourModal() {
  const M = useMuseumTheme();
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any) as string;

  if (!activeTour) return null;

  const config = MOBILE_TOUR_REGISTRY[activeTour];
  if (!config) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismissTour}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingTop: 12 }}>
          <Pressable
            onPress={dismissTour}
            hitSlop={8}
            style={{ height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: M.border }}
          >
            <IconSymbol name="xmark" size={16} color={M.muted} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
            <View
              style={{ marginBottom: 20, height: 80, width: 80, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: config.heroBg }}
            >
              <IconSymbol name={config.heroIcon as any} size={36} color={config.heroColor} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: M.text, textAlign: "center" }}>
              {resolveText(tr, config.titleKey)}
            </Text>
            <Text style={{ marginTop: 8, fontSize: 15, color: M.sub, textAlign: "center" }}>
              {resolveText(tr, config.subtitleKey)}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, gap: 12 }}>
            {config.features.map((f, index) => (
              <FeatureCard key={`${f.titleKey}-${index}`} item={f} t={tr} />
            ))}
          </View>

          <View style={{ marginHorizontal: 24, marginTop: 16, borderRadius: 16, borderWidth: 1, borderColor: M.accentBorder, backgroundColor: M.accentGlow, padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: M.accent }}>
              {t("onboarding.floatingChecklistTitle")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 20, color: M.sub }}>
              {t("onboarding.floatingChecklistDetail")}
            </Text>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 }}>
          <Pressable
            onPress={dismissTour}
            style={{ alignItems: "center", borderRadius: 16, backgroundColor: M.accent, paddingVertical: 16 }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.gotIt")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
