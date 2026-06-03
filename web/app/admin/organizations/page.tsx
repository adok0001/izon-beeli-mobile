"use client";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface OrgRow {
  id: string;
  name: string;
  createdAt: string;
  plan?: "starter" | "pro" | "institution" | null;
  status?: "active" | "past_due" | "canceled" | null;
  studentLimit?: number | null;
  currentPeriodEnd?: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  institution: "Institution",
};

const STATUS_ICONS = {
  active: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  past_due: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  canceled: <XCircle className="h-4 w-4 text-neutral-400" />,
};

export default function AdminOrganizationsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [provisionUserId, setProvisionUserId] = useState("");
  const [provisionOrgName, setProvisionOrgName] = useState("");

  const { data: orgs = [], isLoading } = useQuery<OrgRow[]>({
    queryKey: ["admin", "billing", "organizations"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch("/admin/billing/organizations", { token: token ?? undefined });
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch("/admin/billing/provision", {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ userId: provisionUserId.trim(), orgName: provisionOrgName.trim() }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "organizations"] });
      setProvisionUserId("");
      setProvisionOrgName("");
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        Organizations
      </h1>

      {/* Provision institution form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Provision Institution Tier
        </h2>
        <div className="flex gap-3 flex-wrap">
          <input
            className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="User ID"
            value={provisionUserId}
            onChange={(e) => setProvisionUserId(e.target.value)}
          />
          <input
            className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Organization name"
            value={provisionOrgName}
            onChange={(e) => setProvisionOrgName(e.target.value)}
          />
          <button
            onClick={() => provisionMutation.mutate()}
            disabled={!provisionUserId.trim() || !provisionOrgName.trim() || provisionMutation.isPending}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Provision
          </button>
        </div>
      </div>

      {/* Organizations table */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No organizations yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Organization</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Plan</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Students</th>
                <th className="px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Renews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">{org.name}</td>
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                    {org.plan ? PLAN_LABELS[org.plan] : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {org.status ? STATUS_ICONS[org.status] : null}
                      <span className="capitalize text-neutral-600 dark:text-neutral-400">
                        {org.status ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">
                    {org.studentLimit === null ? "Unlimited" : org.studentLimit ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-500 text-xs">
                    {org.currentPeriodEnd
                      ? new Date(org.currentPeriodEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
