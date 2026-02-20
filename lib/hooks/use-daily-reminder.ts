import { useEffect } from "react";
import AsyncStorage from "@/lib/storage";
import { useNotificationStore } from "@/store/notification-store";
import { useWordOfTheDay } from "./use-word-of-the-day";

const LAST_REMINDER_KEY = "izon-beeli-last-daily-reminder";

export function useDailyReminder(languageId: string) {
  const { addNotification } = useNotificationStore();
  const word = useWordOfTheDay(languageId);

  useEffect(() => {
    checkAndNotify();
  }, [languageId]);

  async function checkAndNotify() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = await AsyncStorage.getItem(LAST_REMINDER_KEY);

      if (lastDate === today) return; // Already notified today

      await AsyncStorage.setItem(LAST_REMINDER_KEY, today);

      // Word of the day notification
      if (word) {
        addNotification(
          "word_of_day",
          "Word of the Day",
          `${word.word} — ${word.english}`
        );
      }

      // Streak reminder
      addNotification(
        "streak_reminder",
        "Keep your streak going!",
        "Complete a lesson today to maintain your learning streak."
      );
    } catch {
      // Silently fail
    }
  }
}
