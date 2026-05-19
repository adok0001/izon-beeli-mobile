import { LoadingScreen } from "@/components/loading-screen";

/**
 * Splash / loading screen shown while AuthGate (in _layout.tsx) resolves
 * auth state and decides where to redirect.  No hooks needed here — all
 * auth and onboarding routing logic lives in AuthGate.
 */
export default function Index() {
  return <LoadingScreen showBranding />;
}
