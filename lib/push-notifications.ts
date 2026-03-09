import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiFetch } from "@/lib/api";

/**
 * Configure how incoming notifications are handled when the app is in the foreground.
 */
export function configurePushNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request permission and register the Expo push token with our backend.
 * Safe to call on every sign-in — the server upserts the token.
 */
export async function registerPushToken(authToken: string): Promise<void> {
  // Push tokens only work on physical devices
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const platform = Platform.OS === "ios" ? "ios" : "android";

    await apiFetch("/push-tokens", {
      method: "POST",
      token: authToken,
      body: JSON.stringify({ token: tokenData.data, platform }),
    });
  } catch {
    // Non-critical — silently ignore registration failures
  }
}

/**
 * Unregister the current device's push token on sign-out.
 */
export async function unregisterPushToken(authToken: string): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await apiFetch("/push-tokens", {
      method: "DELETE",
      token: authToken,
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch {
    // Non-critical
  }
}
