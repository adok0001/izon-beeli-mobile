import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Language } from "@/types";

export function useLanguages() {
  return useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: () => apiFetch<Language[]>("/languages"),
  });
}
