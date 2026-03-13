"use client";

import { useEffect } from "react";
import { useTourStore } from "@/store/tour-store";

/** Auto-starts the tour on first visit. Mount inside the app layout. */
export function TourLauncher() {
  const { completed, active, start } = useTourStore();

  useEffect(() => {
    if (!completed && !active) {
      // Small delay so the layout has painted before we try to measure elements
      const id = setTimeout(start, 400);
      return () => clearTimeout(id);
    }
  }, []); // run once on mount

  return null;
}
