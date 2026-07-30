import type { TranslationKey } from "./locales/keys";

/**
 * Friendly copy for the machine-readable `{ error: "..." }` codes our API returns.
 *
 * Shared by the mobile app and the web Studio — both resolve against the same
 * locale files, so the mapping lives here rather than in either app's `api.ts`
 * (mobile's pulls in React Native modules the web build can't touch).
 *
 * Returns a key + params rather than a finished string so each app can call its
 * own typed `t`. That keeps `TranslationKey` enforced: renaming a key here is a
 * compile error instead of a raw dot-path leaking into the UI.
 */
export type ApiErrorCopy = {
  key: TranslationKey;
  params?: Record<string, number>;
};

/** Reads the machine-readable `{ error: "..." }` code out of an API response body. */
export function apiErrorCode(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "error" in body) {
    const { error } = body as { error: unknown };
    if (typeof error === "string") return error;
  }
  return undefined;
}

function numberField(body: unknown, key: string): number | undefined {
  if (typeof body === "object" && body !== null && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

const COPY: Record<string, (body: unknown) => ApiErrorCopy> = {
  // 402 from the classroom join paths — the group owner's org is out of seats.
  // The counts are best-effort: fall back to the plain message if either is absent.
  student_capacity_exceeded: (body) => {
    const used = numberField(body, "studentCount");
    const limit = numberField(body, "studentLimit");
    return used !== undefined && limit !== undefined
      ? { key: "common.classFullDetail", params: { used, limit } }
      : { key: "common.classFull" };
  },
  // 402 from educatorGate — no organization, or no active subscription.
  educator_subscription_required: () => ({ key: "common.educatorSubscriptionRequired" }),
};

/**
 * Copy for a known API error code, or undefined when the code is unrecognised —
 * callers should then fall back to the server's own message, which for validation
 * errors (400/409/422…) is already human-readable.
 */
export function apiErrorCopy(body: unknown): ApiErrorCopy | undefined {
  const code = apiErrorCode(body);
  return code ? COPY[code]?.(body) : undefined;
}
