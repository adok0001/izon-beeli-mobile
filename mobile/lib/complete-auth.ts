import { analytics } from "@/lib/analytics";
import { sessionToSnapshot, upsertKnownAccount } from "@/lib/known-accounts";
import type { SessionResource, SetActive } from "@clerk/types";

/** Structural slice of Clerk we need — avoids depending on the full LoadedClerk shape. */
interface ClerkSessionLookup {
  client: { signedInSessions: SessionResource[] };
}

export interface CompleteAuthParams {
  clerk: ClerkSessionLookup;
  sessionId: string;
  setActive: SetActive;
  strategy: "password" | "google" | "apple";
  isSignUp?: boolean;
}

/**
 * The side-effects every successful authentication owes, whatever the strategy:
 * activate the session, record the account for the `sign-back-in` switcher, and
 * identify the user to analytics. Password and social paths both route through
 * here so a newly-added strategy can't silently skip the known-accounts cache —
 * an account missing from that cache never reappears on the switcher.
 *
 * Identifies by Clerk user id, matching what AuthGate re-asserts on every
 * launch. (The old inline sign-in path keyed off the typed email, which split
 * one user across two analytics identities.)
 */
export async function completeAuth({
  clerk,
  sessionId,
  setActive,
  strategy,
  isSignUp = false,
}: CompleteAuthParams): Promise<void> {
  await setActive({ session: sessionId });

  const session = clerk.client.signedInSessions.find((s) => s.id === sessionId);
  const snapshot = session ? sessionToSnapshot(session) : null;

  if (snapshot) {
    await upsertKnownAccount(snapshot);
    analytics.identify(snapshot.userId, {
      strategy,
      ...(snapshot.email ? { email: snapshot.email } : {}),
    });
  }

  if (isSignUp) analytics.signUp();
  else analytics.signIn();
}
