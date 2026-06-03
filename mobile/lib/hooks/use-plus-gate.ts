import { useRouter } from "expo-router";
import { useAppConfig } from "./use-app-config";
import { useCurrentUser } from "./use-current-user";

/**
 * Returns whether the current user has access to Plus features.
 *
 * When the global `plus_enabled` flag is off, isPlus is always true
 * (all Plus features are free until the D60 retention threshold is met).
 */
export function usePlusGate() {
  const { data: config } = useAppConfig();
  const { data: user } = useCurrentUser();
  const router = useRouter();

  const plusGloballyEnabled = config?.plusEnabled ?? false;
  const isPlus = !plusGloballyEnabled || user?.planTier === "plus";

  function showPaywall() {
    router.push("/plus-paywall");
  }

  return { isPlus, showPaywall };
}
