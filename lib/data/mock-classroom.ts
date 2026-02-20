import type { Group, AssignedLesson, Institution, InstitutionDashboard } from "@/types";

export const MOCK_GROUPS: Group[] = [
  {
    id: "group-1",
    name: "Izon Language Club",
    inviteCode: "IJN42K",
    languageId: "izon",
    createdAt: "2025-09-01T00:00:00Z",
    members: [
      {
        id: "m1",
        userId: "user-1",
        name: "Mrs. Ebiere",
        role: "teacher",
        lessonsCompleted: 12,
        streak: 30,
        points: 1500,
      },
      {
        id: "m2",
        userId: "user-2",
        name: "Tari",
        role: "student",
        lessonsCompleted: 8,
        streak: 14,
        points: 820,
      },
      {
        id: "m3",
        userId: "user-3",
        name: "Diepreye",
        role: "student",
        lessonsCompleted: 6,
        streak: 7,
        points: 610,
      },
      {
        id: "m4",
        userId: "user-4",
        name: "Mieibi",
        role: "student",
        lessonsCompleted: 4,
        streak: 3,
        points: 340,
      },
    ],
  },
  {
    id: "group-2",
    name: "Adokeme Family",
    inviteCode: "FAM9X2",
    languageId: "izon",
    createdAt: "2025-10-15T00:00:00Z",
    members: [
      {
        id: "m5",
        userId: "user-5",
        name: "Papa",
        role: "parent",
        lessonsCompleted: 5,
        streak: 10,
        points: 500,
      },
      {
        id: "m6",
        userId: "user-6",
        name: "Tamara",
        role: "student",
        lessonsCompleted: 10,
        streak: 21,
        points: 1100,
      },
      {
        id: "m7",
        userId: "user-7",
        name: "Seiyefa",
        role: "student",
        lessonsCompleted: 3,
        streak: 2,
        points: 250,
      },
    ],
  },
];

export const MOCK_ASSIGNMENTS: AssignedLesson[] = [
  {
    id: "assign-1",
    groupId: "group-1",
    lessonId: "lesson-1",
    assignedBy: "Mrs. Ebiere",
    dueDate: "2026-02-25T00:00:00Z",
    createdAt: "2026-02-18T00:00:00Z",
  },
  {
    id: "assign-2",
    groupId: "group-1",
    lessonId: "lesson-2",
    assignedBy: "Mrs. Ebiere",
    dueDate: "2026-03-01T00:00:00Z",
    createdAt: "2026-02-18T00:00:00Z",
  },
  {
    id: "assign-3",
    groupId: "group-2",
    lessonId: "lesson-3",
    assignedBy: "Papa",
    createdAt: "2026-02-17T00:00:00Z",
  },
];

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
