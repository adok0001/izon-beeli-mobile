"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BillingSuccessPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"polling" | "active" | "timeout">("polling");

  useEffect(() => {
    let attempts = 0;
    const MAX = 12; // 12 × 2.5s = 30s

    async function poll() {
      try {
        const token = await getToken();
        const data = await apiFetch<{ active: boolean }>("/billing/educator/status", {
          token: token ?? undefined,
        });
        if (data.active) {
          setStatus("active");
          setTimeout(() => router.push("/classroom"), 1500);
          return;
        }
      } catch {
        // keep polling
      }

      attempts++;
      if (attempts >= MAX) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, 2500);
    }

    poll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {status === "polling" && (
        <>
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Activating your subscription…
          </h1>
          <p className="text-neutral-500 text-sm mt-2">This usually takes a few seconds.</p>
        </>
      )}

      {status === "active" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            You&apos;re all set!
          </h1>
          <p className="text-neutral-500 text-sm mt-2">Redirecting to your classroom…</p>
        </>
      )}

      {status === "timeout" && (
        <>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Almost there
          </h1>
          <p className="text-neutral-500 text-sm mb-6">
            Your payment was received. It may take a moment to activate. Check back in a minute.
          </p>
          <a
            href="/educator/billing"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Go to billing
          </a>
        </>
      )}
    </div>
  );
}
