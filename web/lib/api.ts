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
