"use client";

import { apiFetch } from "@/lib/api";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { Bell, CheckCircle, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface BroadcastResult { sent: number; total: number }

export default function NotificationsAdminPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);

  const broadcast = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<BroadcastResult>("/notifications/broadcast", {
        token: token ?? undefined,
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          ...(languageId ? { languageId } : {}),
        }),
      });
    },
    onSuccess: (data) => {
      setLastResult(data);
      setTitle("");
      setBody("");
      setLanguageId("");
    },
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !broadcast.isPending;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
          {t("admin.notifications.title", "Push Notifications")}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("admin.notifications.subtitle", "Broadcast a message to all users or a specific language group.")}
        </p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
              {t("admin.notifications.audience", "Audience")}
            </label>
            <LanguageSelector
              value={languageId}
              onChange={setLanguageId}
              placeholder={t("admin.notifications.allUsers", "All users")}
              allowCustom={false}
            />
            <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              {languageId
                ? t("admin.notifications.audienceFiltered", "Only {{language}} learners will receive this.", { language: languageId })
                : t("admin.notifications.audienceAll", "No language selected — all users will receive this.")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
              {t("admin.notifications.notifTitle", "Title")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("admin.notifications.titlePlaceholder", "e.g. New lessons just dropped!")}
              maxLength={100}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
              {t("admin.notifications.message", "Message")}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("admin.notifications.messagePlaceholder", "e.g. Check out what's new in Beeli.")}
              maxLength={250}
              rows={3}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <p className="mt-1 text-xs text-neutral-400 text-right">{body.length}/250</p>
          </div>

          {broadcast.isError && (
            <p className="text-sm text-red-500">
              {t("admin.notifications.error", "Failed to send. Please try again.")}
            </p>
          )}

          {lastResult && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {t("admin.notifications.success", {
                  sent: lastResult.sent,
                  total: lastResult.total,
                  defaultValue: `Sent to ${lastResult.sent} of ${lastResult.total} devices.`,
                })}
              </p>
            </div>
          )}

          <button
            onClick={() => broadcast.mutate()}
            disabled={!canSend}
            className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {broadcast.isPending ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {broadcast.isPending
              ? t("admin.notifications.sending", "Sending…")
              : t("admin.notifications.send", "Send notification")}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-neutral-400" />
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              {t("admin.notifications.preview", "Device preview")}
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 py-3 max-w-xs">
            <p className="text-xs font-bold text-neutral-900 dark:text-white">{title || "Title"}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{body || "Your message will appear here."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
