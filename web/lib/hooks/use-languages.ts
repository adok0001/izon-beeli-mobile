"use client";

import { apiFetch } from "@/lib/api";
import type { Language } from "@/types";
import { useQuery } from "@tanstack/react-query";

/** Client-side language catalog — the single source for all "use client" pages/components. */
export function useLanguages() {
  return useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: () => apiFetch<Language[]>("/languages"),
    staleTime: 1000 * 60 * 60,
  });
}
