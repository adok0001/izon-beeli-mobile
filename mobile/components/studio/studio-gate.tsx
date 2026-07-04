import {
  canAccessEducatorPanel,
  useCurrentUser,
  type CurrentUser,
} from "@/lib/hooks/use-current-user";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Redirect } from "expo-router";
import { createContext, useContext, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

export type StudioRole = "educator" | "admin";

interface StudioAccessValue {
  /** The resolved current user — guaranteed non-null while inside the gate. */
  user: CurrentUser;
  /**
   * Always true inside a mounted gate (the gate redirects otherwise). Exposed so
   * child screens can feed it to `enabled:` on data hooks without re-deriving it.
   */
  canAccess: boolean;
}

const StudioAccessContext = createContext<StudioAccessValue | null>(null);

/**
 * Read the access context established by the nearest {@link StudioGate}. Child
 * screens use this instead of re-running `useCurrentUser()` + a local
 * `canAccessEducatorPanel(...)` derivation and their own "admin required"
 * fallback — the gate above them already guarantees access.
 */
export function useStudioAccess(): StudioAccessValue {
  const value = useContext(StudioAccessContext);
  if (!value) {
    throw new Error("useStudioAccess must be used within a <StudioGate>");
  }
  return value;
}

function hasAccess(role: StudioRole, user: CurrentUser): boolean {
  return role === "admin" ? user.isAdmin : canAccessEducatorPanel(user);
}

/**
 * The single client-side access gate for both Studio shells. Wrap a section's
 * `_layout` Stack in it: while the user resolves it shows a spinner, an
 * unauthorized user is redirected to the profile tab, and authorized children
 * render with the user available via {@link useStudioAccess}.
 */
export function StudioGate({
  role,
  children,
}: Readonly<{ role: StudioRole; children: ReactNode }>) {
  const M = useMuseumTheme();
  const { data: user, isLoading } = useCurrentUser();

  // Only spin while the user is genuinely in flight. A settled-but-absent user
  // (e.g. a guest, whose `useCurrentUser` query never runs) has no access and is
  // redirected rather than left on an indefinite spinner.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: M.ink, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={M.accent} />
      </View>
    );
  }

  if (!user || !hasAccess(role, user)) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <StudioAccessContext.Provider value={{ user, canAccess: true }}>
      {children}
    </StudioAccessContext.Provider>
  );
}
