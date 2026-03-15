import { useEffect } from "react";
import AsyncStorage from "@/lib/storage";
import { useNotificationStore } from "@/store/notification-store";
import { useWordOfTheDay } from "./use-word-of-the-day";

const LAST_REMINDER_KEY = "izon-beeli-last-daily-reminder";
const SCHEDULED_NOTIF_ID_KEY = "izon-beeli-scheduled-notif-id";

/** Reminder hour in 24h local time (8 PM) */
const REMINDER_HOUR = 20;

function getNotifications() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    return null;
  }
}

async function cancelScheduledReminder() {
  const N = getNotifications();
  if (!N) return;
  try {
    const id = await AsyncStorage.getItem(SCHEDULED_NOTIF_ID_KEY);
    if (id) {
      await N.cancelScheduledNotificationAsync(id).catch(() => {});
      await AsyncStorage.removeItem(SCHEDULED_NOTIF_ID_KEY);
    }
  } catch {
    // Non-critical
  }
}

async function scheduleEveningReminder(streak: number) {
  const N = getNotifications();
  if (!N) return;

  try {
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return;

    // Cancel any previous scheduled reminder first
    await cancelScheduledReminder();

    // Schedule for tonight at REMINDER_HOUR if it hasn't passed yet
    const now = new Date();
    const trigger = new Date();
    trigger.setHours(REMINDER_HOUR, 0, 0, 0);

    if (trigger <= now) return; // Already past 8 PM — skip

    const id = await N.scheduleNotificationAsync({
      content: {
        title: "Keep your streak alive! 🔥",
        body:
          streak > 0
            ? `You have a ${streak}-day streak. Complete a lesson today to keep it going.`
            : "Complete a lesson today to start your streak!",
        data: { type: "streak_reminder" },
        sound: "default",
      },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: trigger },
    });

    await AsyncStorage.setItem(SCHEDULED_NOTIF_ID_KEY, id);
  } catch {
    // Non-critical — expo-notifications may not be available in Expo Go
  }
}

export function useDailyReminder(languageId: string, streak = 0) {
  const { addNotification } = useNotificationStore();
  const word = useWordOfTheDay(languageId);

  useEffect(() => {
    checkAndNotify();
  }, [languageId]);

  async function checkAndNotify() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = await AsyncStorage.getItem(LAST_REMINDER_KEY);

      if (lastDate === today) return; // Already handled today

      await AsyncStorage.setItem(LAST_REMINDER_KEY, today);

      // In-app notification (works in Expo Go)
      if (word) {
        addNotification(
          "word_of_day",
          "Word of the Day",
          `${word.word} — ${word.english}`
        );
      }

      // Schedule a local push for the evening (streak reminder)
      await scheduleEveningReminder(streak);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Call this when the user completes any learning activity today
 * so the evening reminder is no longer needed.
 */
export async function cancelDailyStreakReminder() {
  await cancelScheduledReminder();
}
