"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { useState } from "react";

const STRIPE_PRICE_STARTER = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "";
const STRIPE_PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "";

const PLANS = [
  {
    id: "starter",
    name: "Classroom Starter",
    price: "$99",
    period: "/month",
    studentLimit: "Up to 30 students",
    priceId: STRIPE_PRICE_STARTER,
    features: [
      "Classroom creation & group management",
      "Bulk enrollment via invite code",
      "Lesson assignments with due dates",
      "Student progress & completion reports",
      "Educator content panel",
      "Priority support",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Classroom Pro",
    price: "$199",
    period: "/month",
    studentLimit: "Up to 100 students",
    priceId: STRIPE_PRICE_PRO,
    features: [
      "Everything in Starter",
      "Up to 100 students",
      "Advanced analytics dashboard",
      "Multi-class management",
      "Dedicated onboarding call",
    ],
    highlight: true,
  },
  {
    id: "institution",
    name: "Institution",
    price: "Custom",
    period: "",
    studentLimit: "Unlimited students",
    priceId: null,
    features: [
      "Everything in Pro",
      "Unlimited students",
      "Custom language content setup",
      "SLA & compliance support",
      "Dedicated account manager",
      "Custom integrations",
    ],
    highlight: false,
  },
] as const;

export default function EducatorPricingPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [showOrgPrompt, setShowOrgPrompt] = useState<string | null>(null);

  async function startCheckout(priceId: string) {
    if (!orgName.trim()) {
      setShowOrgPrompt(priceId);
      return;
    }
    setLoading(priceId);
    try {
      const token = await getToken();
      const { url } = await apiFetch<{ url: string }>("/billing/educator/checkout", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ priceId, orgName: orgName.trim() }),
      });
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Educator Plans
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-xl mx-auto">
          Bring Beeli into your classroom. Manage students, assign lessons, and track progress — all in one place.
        </p>
      </div>

      {showOrgPrompt && (
        <div className="mb-8 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200 mb-2">
            What&apos;s the name of your school or organization?
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Lagos Heritage Language School"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startCheckout(showOrgPrompt)}
            />
            <button
              onClick={() => startCheckout(showOrgPrompt)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col ${
              plan.highlight
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/10 shadow-lg"
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {plan.name}
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-neutral-500 text-sm">{plan.period}</span>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {plan.studentLimit}
              </p>
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.priceId ? (
              <button
                onClick={() => startCheckout(plan.priceId!)}
                disabled={loading === plan.priceId}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-brand-600 hover:bg-brand-700 text-white"
                    : "bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
                } disabled:opacity-60`}
              >
                {loading === plan.priceId ? "Redirecting…" : "Subscribe"}
              </button>
            ) : (
              <a
                href="mailto:hello@beeli.app?subject=Institution Plan"
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-center border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors block"
              >
                Contact us
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400 mt-8">
        Prices in USD. Billed monthly. Cancel anytime from your billing portal.
      </p>
    </div>
  );
}
