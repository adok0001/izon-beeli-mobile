import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourStore, type TourId } from "@/store/tour-store";

interface TourContent {
  title: string;
  description: string;
}

const TOUR_CONTENT: Record<TourId, TourContent> = {
  learn: {
    title: "Welcome to Lessons",
    description: "Browse and complete bite-sized lessons to build your vocabulary and grammar.",
  },
  practice: {
    title: "Listen & Practice",
    description: "Listen to audio lessons and daily challenges to sharpen your listening skills.",
  },
  journal: {
    title: "Your Journal",
    description: "Write journal entries in the language you're learning and track your progress.",
  },
  feed: {
    title: "Community Feed",
    description: "See what other learners are contributing and stay motivated together.",
  },
  profile: {
    title: "Welcome to Beeli!",
    description: "Track your streak, points, and lessons here. You can also contribute words, join groups, and more.",
  },
};

export function TourOverlay() {
  const { activeTour, dismissTour } = useTourStore();
  const insets = useSafeAreaInsets();

  if (!activeTour) return null;

  const content = TOUR_CONTENT[activeTour];

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
            {content.title}
          </Text>
          <Text
            style={{ fontSize: 14, color: "#6b7280", lineHeight: 22, marginBottom: 20 }}
          >
            {content.description}
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
              Got it →
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
