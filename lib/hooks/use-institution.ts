import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import type { InstitutionDashboard } from "@/types";

export function useInstitutionDashboard() {
  const { getToken } = useAuth();

  return useQuery<InstitutionDashboard>({
    queryKey: ["institution-dashboard"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<InstitutionDashboard>("/classroom/dashboard", { token: token! });
    },
  });
}

// Keep backward-compat export for screens that call useInstitution()
export function useInstitution() {
  const { data: dashboard, isLoading } = useInstitutionDashboard();
  return { institution: null, dashboard: dashboard ?? null, isLoading };
}
