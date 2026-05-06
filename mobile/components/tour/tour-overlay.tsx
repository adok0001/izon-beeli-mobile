import { useTourStore, type TourId } from "@/store/tour-store";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOUR_KEYS: Record<TourId, { titleKey: string; descriptionKey: string }> = {
  learn: {
    titleKey: "onboarding.learnTourTitle",
    descriptionKey: "onboarding.learnTourSubtitle",
  },
  practice: {
    titleKey: "onboarding.practiceTourTitle",
    descriptionKey: "onboarding.practiceTourSubtitle",
  },
  journal: {
    titleKey: "onboarding.journalTourTitle",
    descriptionKey: "onboarding.journalTourSubtitle",
  },
  feed: {
    titleKey: "onboarding.feedTourTitle",
    descriptionKey: "onboarding.feedTourSubtitle",
  },
  profile: {
    titleKey: "onboarding.profileTourTitle",
    descriptionKey: "onboarding.profileTourSubtitle",
  },
};

export function TourOverlay() {
  const { activeTour, dismissTour } = useTourStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!activeTour) return null;

  const keys = TOUR_KEYS[activeTour];

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
            {t(keys.titleKey)}
          </Text>
          <Text
            style={{ fontSize: 14, color: "#6b7280", lineHeight: 22, marginBottom: 20 }}
          >
            {t(keys.descriptionKey)}
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
