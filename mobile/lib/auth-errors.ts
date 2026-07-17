/**
 * Clerk surfaces errors as an `errors[]` array rather than a plain Error, and
 * every auth screen was re-implementing the same extraction inline. `message`
 * is terse and developer-facing ("Password is incorrect."); `longMessage` is
 * the fuller, user-facing sentence, so it wins when present.
 */
interface ClerkApiError {
  code?: string;
  message?: string;
  longMessage?: string;
}

function clerkErrors(err: unknown): ClerkApiError[] {
  const maybe = err as { errors?: unknown };
  return Array.isArray(maybe?.errors) ? (maybe.errors as ClerkApiError[]) : [];
}

/** First Clerk error code, for callers that need to branch on a specific case. */
export function authErrorCode(err: unknown): string | undefined {
  return clerkErrors(err)[0]?.code;
}

export function authErrorMessage(err: unknown, fallback: string): string {
  const first = clerkErrors(err)[0];
  if (first?.longMessage) return first.longMessage;
  if (first?.message) return first.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Dismissing the Apple sheet or closing the OAuth browser is a deliberate
 * choice, not a failure — showing a red banner for it reads as a bug. Apple's
 * native sheet raises ERR_REQUEST_CANCELED; the web flow resolves to a
 * `cancel`/`dismiss` result that `use-social-auth` maps onto this too.
 */
export function isUserCancelled(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "ERR_REQUEST_CANCELED" || code === "ERR_CANCELED") return true;
  return clerkErrors(err).some((e) => e.code === "oauth_access_denied");
}
