const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
  sound?: "default" | null;
  badge?: number;
}

export interface PushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a batch of push messages via the Expo Push API.
 * Accepts up to 100 messages per call (Expo's limit).
 */
export async function sendPushBatch(messages: PushMessage[]): Promise<PushTicket[]> {
  if (messages.length === 0) return [];

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error("[push] Expo API error:", response.status, await response.text());
    return [];
  }

  const json = await response.json() as { data: PushTicket[] };
  return json.data ?? [];
}

/**
 * Send a single push notification.
 */
export async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string | number | boolean>
): Promise<void> {
  await sendPushBatch([{ to: token, title, body, data, sound: "default" }]);
}

/** Chunk an array into groups of at most `size`. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
