import { apiErrorCopy } from "@mobile/lib/api-error-copy";
import type { TranslationKey } from "@mobile/lib/locales/keys";
import { API_BASE_URL } from "./constants";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Message to show for a failed request. Machine-readable API codes
 * (`student_capacity_exceeded`, …) get real copy; anything else falls back to
 * the server's own message, which for validation errors is already readable.
 *
 * Takes `t` rather than importing the i18n instance, so this module stays free
 * of react-i18next and safe to import from server components.
 */
export function apiErrorMessage(
  err: unknown,
  t: (key: TranslationKey, params?: Record<string, number>) => string
): string {
  if (err instanceof ApiError) {
    const copy = apiErrorCopy(err.body);
    if (copy) return t(copy.key, copy.params);
  }
  return err instanceof Error ? err.message : String(err);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options ?? {};
  // For FormData bodies the browser must set Content-Type (with boundary) itself,
  // so only set it explicitly for non-FormData requests.
  const contentTypeHeader: Record<string, string> = init.body instanceof FormData
    ? {}
    : { "Content-Type": "application/json" };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...contentTypeHeader,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    const message =
      (body as Record<string, string>)?.error ??
      `API error ${res.status}: ${res.statusText}`;
    throw new ApiError(res.status, message, body);
  }

  return res.json() as Promise<T>;
}
