import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { SessionResource, UserResource } from "@clerk/types";

export interface KnownAccountSnapshot {
  userId: string;
  firstName: string | null;
  email: string | null;
  imageUrl: string | null;
  hasImage: boolean;
  lastActiveAt: number;
}

export interface MergedAccountRow extends KnownAccountSnapshot {
  kind: "live" | "cached";
  sessionId: string | null;
}

const KEY = "beeli.known-accounts.v1";
const MAX_ACCOUNTS = 5;
const IS_WEB = Platform.OS === "web";

// In-memory mirror of the SecureStore blob, so a screen (AuthGate, then
// sign-back-in, then manage-accounts) doesn't re-read/re-parse it on every
// mount within the same app session. Invalidated by upsert/remove.
let cache: KnownAccountSnapshot[] | null = null;

async function readAll(): Promise<KnownAccountSnapshot[]> {
  if (cache) return cache;
  if (IS_WEB) return (cache = []);
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return (cache = Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("known-accounts readAll error:", error);
    return (cache = []);
  }
}

async function writeAll(accounts: KnownAccountSnapshot[]): Promise<void> {
  cache = accounts;
  if (IS_WEB) return;
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("known-accounts writeAll error:", error);
  }
}

export async function getKnownAccounts(): Promise<KnownAccountSnapshot[]> {
  return readAll();
}

/**
 * Synchronous read of the in-memory mirror — `null` until the first
 * `getKnownAccounts()` call hydrates it from SecureStore. Upsert/remove
 * update `cache` synchronously (before their SecureStore write resolves),
 * so a caller that awaits one of those and then reads this immediately
 * afterwards (e.g. AuthGate reacting to a same-session sign-out) always
 * sees the fresh list — no stale React state to race against.
 */
export function getCachedKnownAccountIds(): string[] | null {
  return cache ? cache.map((a) => a.userId) : null;
}

export async function upsertKnownAccount(snapshot: KnownAccountSnapshot): Promise<void> {
  const accounts = await readAll();
  const next = [snapshot, ...accounts.filter((a) => a.userId !== snapshot.userId)]
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, MAX_ACCOUNTS);
  await writeAll(next);
}

export async function removeKnownAccount(userId: string): Promise<void> {
  const accounts = await readAll();
  await writeAll(accounts.filter((a) => a.userId !== userId));
}

export function sessionToSnapshot(session: SessionResource): KnownAccountSnapshot | null {
  const user = session.user;
  if (!user) return null;
  return {
    userId: user.id,
    firstName: session.publicUserData?.firstName ?? user.firstName,
    email: session.publicUserData?.identifier ?? user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: session.publicUserData?.imageUrl ?? user.imageUrl,
    hasImage: session.publicUserData?.hasImage ?? user.hasImage,
    lastActiveAt: session.lastActiveAt.getTime(),
  };
}

export function userToSnapshot(user: UserResource): KnownAccountSnapshot {
  return {
    userId: user.id,
    firstName: user.firstName,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl,
    hasImage: user.hasImage,
    lastActiveAt: Date.now(),
  };
}

export function mergeAccountRows(
  sessions: SessionResource[] | undefined,
  known: KnownAccountSnapshot[]
): MergedAccountRow[] {
  const liveRows: MergedAccountRow[] = (sessions ?? [])
    .filter((s) => s.status === "active" && s.user)
    .map((s) => ({ kind: "live", sessionId: s.id, ...sessionToSnapshot(s)! }));

  const liveUserIds = new Set(liveRows.map((r) => r.userId));
  const cachedRows: MergedAccountRow[] = known
    .filter((a) => !liveUserIds.has(a.userId))
    .map((a) => ({ kind: "cached", sessionId: null, ...a }));

  return [...liveRows, ...cachedRows].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/**
 * Ends only the current session (Clerk's bare `signOut()` ends every cached
 * session on the device), keeping this account discoverable on the
 * "Sign back in" switcher for next time.
 */
export async function signOutPreservingOtherAccounts(params: {
  user: UserResource;
  sessionId: string | null | undefined;
  signOut: (opts?: { sessionId?: string }) => Promise<void>;
}): Promise<void> {
  await upsertKnownAccount(userToSnapshot(params.user));
  await params.signOut({ sessionId: params.sessionId ?? undefined });
}

/** Account is being deleted — it must never resurface on the switcher. */
export async function signOutForgettingAccount(params: {
  userId: string | null | undefined;
  signOut: () => Promise<void>;
}): Promise<void> {
  if (params.userId) await removeKnownAccount(params.userId);
  await params.signOut();
}
