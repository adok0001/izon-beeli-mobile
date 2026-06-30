import i18n from "./i18n";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState, Platform } from "react-native";
import { API_BASE_URL } from "./constants";

// React Query's default focus detection uses browser events, which don't fire in React Native.
// Wire it up to AppState so queries refetch when the app comes back to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });

  // Same story for connectivity detection (default uses `navigator.onLine`,
  // always true in React Native) — wire it to NetInfo so queries pause while
  // offline and mutations/refetches resume the moment connectivity returns.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    })
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Lets previously-fetched content (courses, lessons, dictionary, etc.) survive
// app restarts so a cold launch offline still has something to show.
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "beeli-query-cache",
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

export function isNetworkError(err: unknown): boolean {
  return err instanceof Error && err.message === "Network request failed";
}

export function friendlyError(err: unknown, fallback?: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return i18n.t("common.permissionDenied");
    if (err.status === 404) return i18n.t("common.notFound");
    if (err.status >= 500) return i18n.t("common.serverError");
  }
  if (isNetworkError(err)) {
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

/**
 * apiFetch hardcodes Content-Type: application/json, which breaks multipart
 * uploads (the runtime needs to set its own boundary). Use this for FormData
 * bodies (audio/image uploads) instead — same auth header + ApiError handling
 * as apiFetch, so callers using friendlyError() get correct 401/403/404/500
 * messages instead of the generic fallback.
 */
export async function apiFetchMultipart<T>(
  path: string,
  formData: FormData,
  options?: { method?: string; token?: string | null }
): Promise<T> {
  const { method = "POST", token } = options ?? {};
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
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
