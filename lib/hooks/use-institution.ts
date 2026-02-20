import { useMemo } from "react";
import { MOCK_INSTITUTION, MOCK_DASHBOARD } from "@/lib/data/mock-institution";
import type { Institution, InstitutionDashboard } from "@/types";

export function useInstitution(): {
  institution: Institution | null;
  dashboard: InstitutionDashboard | null;
} {
  return useMemo(
    () => ({
      institution: MOCK_INSTITUTION,
      dashboard: MOCK_DASHBOARD,
    }),
    []
  );
}
