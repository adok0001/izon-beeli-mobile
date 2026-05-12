import { MOBILE_TOUR_REGISTRY } from "@/lib/tours/mobile-tour-registry";
import { useTourStore } from "@/store/tour-store";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function TourOverlay() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!activeTour) return null;

  const config = MOBILE_TOUR_REGISTRY[activeTour];
  if (!config) return null;

  const title = config.titleKey ? t(config.titleKey) : config.title;
  const subtitle = config.subtitleKey ? t(config.subtitleKey) : config.subtitle;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent accessibilityViewIsModal>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={dismissTour}
        accessibilityLabel="Dismiss tour"
        accessibilityHint="Tap to close the tour overlay"
        accessibilityRole="button"
      >
        <Pressable
          style={{
            backgroundColor: "white",
            borderRadius: 24,
            padding: 24,
            margin: 16,
            marginBottom: 16 + insets.bottom,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}
          onPress={(e) => e.stopPropagation()}
          accessible={false}
        >
          <Text
            style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 }}
          >
            {title}
          </Text>
          <Text
            style={{ fontSize: 14, color: "#6b7280", lineHeight: 22, marginBottom: 20 }}
          >
            {subtitle}
          </Text>
          <Pressable
            onPress={dismissTour}
            accessibilityRole="button"
            accessibilityLabel="Got it, close tour"
            accessibilityHint="Closes the welcome tour overlay"
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
              {t("onboarding.gotIt")} →
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
