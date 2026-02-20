import type { Institution, InstitutionDashboard } from "@/types";

export const MOCK_INSTITUTION: Institution = {
  id: "inst-1",
  name: "Niger Delta Language Academy",
  adminId: "user-1",
  groupIds: ["group-1", "group-2"],
  createdAt: "2025-08-01T00:00:00Z",
};

export const MOCK_DASHBOARD: InstitutionDashboard = {
  totalStudents: 24,
  totalGroups: 3,
  activeThisWeek: 18,
  popularLanguages: [
    { languageId: "izon", count: 18 },
    { languageId: "yoruba", count: 4 },
    { languageId: "akan", count: 2 },
  ],
  weeklyActivity: [
    { day: "Mon", count: 12 },
    { day: "Tue", count: 15 },
    { day: "Wed", count: 8 },
    { day: "Thu", count: 18 },
    { day: "Fri", count: 14 },
    { day: "Sat", count: 6 },
    { day: "Sun", count: 4 },
  ],
};
