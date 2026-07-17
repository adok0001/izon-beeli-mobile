import type { SocialProvider } from "@/components/auth/social-button";
import { authErrorMessage, isUserCancelled } from "@/lib/auth-errors";
import { completeAuth } from "@/lib/complete-auth";
import { useClerk, useSSO, useSignInWithApple } from "@clerk/clerk-expo";
import type { SetActive, SignUpResource } from "@clerk/types";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

/**
 * Dismisses the auth browser if it's still open when the app resumes — without
 * this an abandoned OAuth session can leave a stranded tab on Android.
 */
export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === "android") void WebBrowser.warmUpAsync();
    return () => {
      if (Platform.OS === "android") void WebBrowser.coolDownAsync();
    };
  }, []);
}

/** Apple's native sheet is iOS-only; Android and web users take the Google path. */
export const APPLE_AVAILABLE = Platform.OS === "ios";

export interface UseSocialAuthResult {
  /** Which provider is mid-flight, for per-button spinners. */
  pending: SocialProvider | null;
  error: string;
  clearError: () => void;
  authenticate: (provider: SocialProvider) => Promise<void>;
}

export function useSocialAuth(): UseSocialAuthResult {
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  const clearError = useCallback(() => setError(""), []);

  const authenticate = useCallback(
    async (provider: SocialProvider) => {
      if (pending) return;
      setError("");
      setPending(provider);

      try {
        // Only the browser-based flow reports an authSessionResult, so the two
        // paths are unpacked separately rather than off a union.
        let createdSessionId: string | null;
        let setActive: SetActive | undefined;
        let signUp: SignUpResource | undefined;
        let cancelledInBrowser = false;

        if (provider === "apple" && APPLE_AVAILABLE) {
          ({ createdSessionId, setActive, signUp } = await startAppleAuthenticationFlow());
        } else {
          const sso = await startSSOFlow({
            strategy: provider === "apple" ? "oauth_apple" : "oauth_google",
            redirectUrl: AuthSession.makeRedirectUri(),
          });
          ({ createdSessionId, setActive, signUp } = sso);
          // Closing the OAuth browser resolves rather than throwing, so the
          // deliberate-exit case has to be read off the result. (Apple's native
          // sheet throws instead — `isUserCancelled` catches that below.)
          cancelledInBrowser = !!sso.authSessionResult && sso.authSessionResult.type !== "success";
        }

        if (createdSessionId && setActive) {
          await completeAuth({
            clerk,
            sessionId: createdSessionId,
            setActive,
            strategy: provider,
            isSignUp: signUp?.createdSessionId === createdSessionId,
          });
          // A guest signing in here keeps isGuest until AuthGate's migration
          // effect drains their local progress onto the new account.
          router.replace("/(tabs)/learn");
          return;
        }

        if (cancelledInBrowser) return;

        // Signed in fine, but this Clerk instance wants a field the provider
        // never supplies — a username, almost always.
        if (signUp?.status === "missing_requirements" && needsUsernameOnly(signUp)) {
          router.push({ pathname: "/(auth)/complete-profile", params: { provider } });
          return;
        }

        // Anything else — a second factor, a forced password reset, an
        // unexpected transfer state — has no screen in this flow yet. Say so:
        // falling through silently leaves the sheet closing onto nothing, which
        // reads as the button being broken.
        setError(t("auth.socialIncomplete"));
      } catch (err) {
        if (!isUserCancelled(err)) {
          setError(authErrorMessage(err, t("common.error")));
        }
      } finally {
        setPending(null);
      }
    },
    [pending, startSSOFlow, startAppleAuthenticationFlow, clerk, router, t]
  );

  return { pending, error, clearError, authenticate };
}

/**
 * Clerk reports outstanding sign-up fields in `missingFields`. We can only
 * self-serve the username here; anything else (an unverified email, a required
 * legal acceptance) needs its own step, so we surface a message instead of
 * dropping the user on a screen that can't finish the job.
 */
function needsUsernameOnly(signUp: SignUpResource): boolean {
  const missing = signUp.missingFields ?? [];
  return missing.length > 0 && missing.every((f) => f === "username");
}
