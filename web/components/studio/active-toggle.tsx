"use client";

import { setContentActive, type ActiveToggleEntityType } from "@/lib/content-workflow";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Studio Web — the shared active/inactive visibility switch, mirroring mobile's
 * `components/studio/active-toggle.tsx`. A single-click eye pill (same look as
 * the courses table toggle) that flips the row's `is_active` flag through
 * POST /content/:entityType/:id/active. Inactive rows stay editable in Studio
 * but disappear from learner-facing reads.
 *
 * Presentational state comes from the `isActive` prop; the caller owns the query
 * cache and passes the keys to invalidate (or an `onDone` callback).
 */
export function ActiveToggle({
  entityType,
  id,
  isActive,
  invalidateKeys,
  onDone,
  className,
}: Readonly<{
  entityType: ActiveToggleEntityType;
  id: string;
  isActive: boolean | undefined;
  invalidateKeys?: readonly unknown[][];
  onDone?: () => void;
  className?: string;
}>) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const qc = useQueryClient();

  // Treat undefined as active — rows written before the column existed default true.
  const active = isActive !== false;

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const token = await getToken();
      return setContentActive(entityType, id, next, token ?? undefined);
    },
    onSuccess: (_row, next) => {
      for (const queryKey of invalidateKeys ?? []) void qc.invalidateQueries({ queryKey });
      onDone?.();
      toast.success(
        next
          ? t("studio.activeToggle.shown", { defaultValue: "Now visible to learners" })
          : t("studio.activeToggle.hidden", { defaultValue: "Hidden from learners" })
      );
    },
    onError: (e: Error) =>
      toast.error(t("studio.activeToggle.failed", { defaultValue: "Failed to update visibility" }), {
        description: e.message,
      }),
  });

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate(!active);
      }}
      disabled={toggle.isPending}
      title={
        active
          ? t("studio.activeToggle.deactivate", { defaultValue: "Deactivate — hide from learners" })
          : t("studio.activeToggle.activate", { defaultValue: "Activate — show to learners" })
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors disabled:opacity-50",
        active
          ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30"
          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/[0.1]",
        className
      )}
    >
      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {active
        ? t("studio.activeToggle.statusActive", { defaultValue: "Active" })
        : t("studio.activeToggle.statusInactive", { defaultValue: "Inactive" })}
    </button>
  );
}
