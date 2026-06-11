"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface BillingStatus {
  active: boolean;
  plan?: "starter" | "pro" | "institution";
  status?: "active" | "past_due" | "canceled";
  studentLimit?: number | null;
  currentPeriodEnd?: string | null;
  organizationName?: string;
  studentCount?: number;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Classroom Starter",
  pro: "Classroom Pro",
  institution: "Institution",
};

export default function EducatorBillingPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const { data: billing, isLoading } = useQuery<BillingStatus>({
    queryKey: ["billing", "educator", "status"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/billing/educator/status", { token: token ?? undefined });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const { url } = await apiFetch<{ url: string }>("/billing/educator/portal", {
        method: "POST",
        token: token ?? undefined,
      });
      window.location.href = url;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!billing?.active) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {t("educator.billing.noSubscriptionTitle")}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
            {t("educator.billing.noSubscriptionDesc")}
          </p>
          <Link
            href="/educator/pricing"
            className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {t("educator.billing.viewPlans")}
          </Link>
        </div>
      </div>
    );
  }

  const statusColor =
    billing.status === "active"
      ? "text-emerald-600 dark:text-emerald-400"
      : billing.status === "past_due"
      ? "text-amber-600 dark:text-amber-400"
      : "text-neutral-500";

  const renewDate = billing.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const studentPct =
    billing.studentLimit && billing.studentCount !== undefined
      ? Math.round((billing.studentCount / billing.studentLimit) * 100)
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        {t("educator.billing.title")}
      </h1>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{t("educator.billing.labelOrganization")}</p>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {billing.organizationName ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{t("educator.billing.labelPlan")}</p>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {billing.plan ? PLAN_LABELS[billing.plan] : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle2 className={`h-4 w-4 ${statusColor}`} />
          <span className={`text-sm font-medium capitalize ${statusColor}`}>
            {billing.status}
          </span>
          {billing.status === "past_due" && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t("educator.billing.pastDue")}
            </span>
          )}
        </div>

        {renewDate && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Clock className="h-4 w-4" />
            {t("educator.billing.renewalLabel", { date: renewDate })}
          </div>
        )}

        {billing.studentLimit !== null && billing.studentCount !== undefined && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Users className="h-4 w-4" />
                {t("educator.billing.labelStudents")}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {billing.studentCount} / {billing.studentLimit}
              </span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  (studentPct ?? 0) >= 90 ? "bg-amber-500" : "bg-brand-500"
                }`}
                style={{ width: `${Math.min(studentPct ?? 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {billing.studentLimit === null && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Users className="h-4 w-4" />
            {t("educator.billing.unlimitedStudents")}
          </div>
        )}

        {billing.plan !== "institution" && (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="w-full py-2.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {portalMutation.isPending ? t("educator.billing.openingPortal") : t("educator.billing.managePortal")}
          </button>
        )}
      </div>
    </div>
  );
}
