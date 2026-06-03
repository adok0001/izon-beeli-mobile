/**
 * Push notification helpers.
 *
 * expo-notifications requires a native development build and is NOT available
 * in Expo Go.  All functions silently no-op when the native module is absent,
 * so the rest of the app still works in Expo Go.
 */
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiFetch } from "@/lib/api";

// Lazy-load Notifications so a missing native module doesn't crash the bundle.
function getNotifications() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    return null;
  }
}

export function configurePushNotifications() {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
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
 * Subscribe to foreground push notifications.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 */
export function addNotificationListener(
  onReceive: (title: string, body: string, type: string, icon?: string) => void
): () => void {
  const N = getNotifications();
  if (!N) return () => {};
  try {
    const sub = N.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      if (title) {
        onReceive(
          title,
          body ?? "",
          (data?.type as string) ?? "broadcast",
          data?.icon as string | undefined
        );
      }
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export async function registerPushToken(authToken: string): Promise<void> {
  if (!Device.isDevice) return;
  const N = getNotifications();
  if (!N) return;

  try {
    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("default", {
        name: "Default",
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await N.getExpoPushTokenAsync();
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

export async function unregisterPushToken(authToken: string): Promise<void> {
  if (!Device.isDevice) return;
  const N = getNotifications();
  if (!N) return;
  try {
    const tokenData = await N.getExpoPushTokenAsync();
    await apiFetch("/push-tokens", {
      method: "DELETE",
      token: authToken,
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch {
    // Non-critical
  }
}
