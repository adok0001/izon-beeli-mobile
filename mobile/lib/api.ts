import i18n from "./i18n";
import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { API_BASE_URL } from "./constants";

// React Query's default focus detection uses browser events, which don't fire in React Native.
// Wire it up to AppState so queries refetch when the app comes back to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

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

export function friendlyError(err: unknown, fallback?: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return i18n.t("common.permissionDenied");
    if (err.status === 404) return i18n.t("common.notFound");
    if (err.status >= 500) return i18n.t("common.serverError");
  }
  if (err instanceof Error && err.message === "Network request failed") {
    return i18n.t("common.networkError");
  }
  return fallback ?? i18n.t("common.unknownError");
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options ?? {};
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
      (body as any)?.error ?? `API error ${res.status}: ${res.statusText}`;
    throw new ApiError(res.status, message, body);
  }

  return res.json() as Promise<T>;
}
