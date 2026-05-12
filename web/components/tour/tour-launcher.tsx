"use client";

import { apiFetch } from "@/lib/api";
import { WEB_TOUR_REGISTRY, type WebTourAudience } from "@/lib/tours/web-tour-registry";
import { useTourStore } from "@/store/tour-store";
import type { UserMe } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

function canSeeAudience(audience: WebTourAudience, me?: UserMe): boolean {
  if (audience === "all") return true;
  if (!me) return false;
  if (audience === "admin") return me.isAdmin;
  return me.isAdmin || me.isReviewer;
}

/** Auto-starts a local tour only for the current screen when unseen steps exist. */
export function TourLauncher() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { completedStepIds, active, start } = useTourStore();

  const { data: me } = useQuery<UserMe>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<UserMe>("/users/me", { token: token ?? undefined });
    },
    enabled: isLoaded && isSignedIn === true,
  });

  const visibleSteps = Object.entries(WEB_TOUR_REGISTRY)
    .map(([id, definition]) => ({ id, ...definition }))
    .filter((step) => canSeeAudience(step.audience, me));

  const hasUnseenStep = visibleSteps.some((step) => !completedStepIds.includes(step.id));

  useEffect(() => {
    if (!active && hasUnseenStep) {
      // Small delay so the layout has painted before we try to measure elements
      const id = setTimeout(() => start(0), 280);
      return () => clearTimeout(id);
    }
  }, [active, hasUnseenStep, start]);

  return null;
}
