import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";

interface AppConfig {
  plusEnabled: boolean;
}

export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: () => apiFetch<AppConfig>("/config/public"),
    staleTime: 5 * 60 * 1000, // re-fetch every 5 minutes
    gcTime: 30 * 60 * 1000,
  });
}
