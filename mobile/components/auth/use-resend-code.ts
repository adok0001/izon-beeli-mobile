import { authErrorMessage } from "@/lib/auth-errors";
import { useCallback, useEffect, useState } from "react";

export interface UseResendCodeParams {
  /** Issues a fresh code. Throwing surfaces as `error`. */
  send: () => Promise<void>;
  fallbackError: string;
  cooldownSeconds?: number;
}

export interface UseResendCodeResult {
  /** Seconds until resend is allowed again; 0 means ready. */
  secondsLeft: number;
  sending: boolean;
  /** True briefly after a successful send, to confirm something happened. */
  justSent: boolean;
  error: string;
  resend: () => Promise<void>;
}

const JUST_SENT_MS = 4000;

/**
 * Backs the "didn't get a code?" affordance on the two code-entry screens.
 * Both open already on cooldown, because reaching either one means a code was
 * just dispatched — offering an instant resend would invite a double-send that
 * invalidates the code still in flight, which reads as the feature being broken.
 */
export function useResendCode({
  send,
  fallbackError,
  cooldownSeconds = 30,
}: UseResendCodeParams): UseResendCodeResult {
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (!justSent) return;
    const id = setTimeout(() => setJustSent(false), JUST_SENT_MS);
    return () => clearTimeout(id);
  }, [justSent]);

  const resend = useCallback(async () => {
    if (secondsLeft > 0 || sending) return;
    setError("");
    setSending(true);
    try {
      await send();
      setSecondsLeft(cooldownSeconds);
      setJustSent(true);
    } catch (err) {
      setError(authErrorMessage(err, fallbackError));
    } finally {
      setSending(false);
    }
  }, [secondsLeft, sending, cooldownSeconds, fallbackError, send]);

  return { secondsLeft, sending, justSent, error, resend };
}
