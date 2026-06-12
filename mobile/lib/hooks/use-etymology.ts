import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { EtymologyEntry } from "@/types";

export function useEtymology(languageId?: string) {
  const url = languageId
    ? `/etymology?languageId=${encodeURIComponent(languageId)}`
    : "/etymology";
  return useQuery<EtymologyEntry[]>({
    queryKey: ["etymology", languageId ?? "all"],
    queryFn: () => apiFetch<EtymologyEntry[]>(url),
  });
}
