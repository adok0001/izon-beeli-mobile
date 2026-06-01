import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

const LISTENER_LEVEL = 3;
const STREAK_MILESTONE = 7;

async function maybeRequestReview() {
  if (Platform.OS === "web") return;
  if (!(await StoreReview.isAvailableAsync())) return;
  await StoreReview.requestReview();
}

export function useReviewPrompt() {
  async function onLevelUp(level: number) {
    if (level === LISTENER_LEVEL) {
      await maybeRequestReview();
    }
  }

  async function onStreakUpdate(streak: number) {
    if (streak === STREAK_MILESTONE) {
      await maybeRequestReview();
    }
  }

  return { onLevelUp, onStreakUpdate };
}
