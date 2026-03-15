import { create } from "zustand";
import {
  MOCK_GROUPS,
  MOCK_ASSIGNMENTS,
} from "@/lib/data/mock-classroom";
import type { Group, AssignedLesson } from "@/types";

interface ClassroomState {
  groups: Group[];
  assignments: AssignedLesson[];

  getGroup: (id: string) => Group | undefined;
  getAssignmentsForGroup: (groupId: string) => AssignedLesson[];
  getAssignedLessonIds: () => string[];
  createGroup: (name: string, languageId: string) => Group;
  joinGroup: (inviteCode: string) => Group | null;
  addAssignment: (groupId: string, lessonId: string, assignedBy: string, dueDate?: string) => void;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  groups: MOCK_GROUPS,
  assignments: MOCK_ASSIGNMENTS,

  getGroup: (id) => get().groups.find((g) => g.id === id),

  getAssignmentsForGroup: (groupId) =>
    get().assignments.filter((a) => a.groupId === groupId),

  getAssignedLessonIds: () =>
    get().assignments.map((a) => a.lessonId),

  createGroup: (name, languageId) => {
    const group: Group = {
      id: `group-${Date.now()}`,
      name,
      inviteCode: generateCode(),
      languageId,
      createdAt: new Date().toISOString(),
      members: [],
    };
    set({ groups: [...get().groups, group] });
    return group;
  },

  joinGroup: (inviteCode) => {
    const group = get().groups.find(
      (g) => g.inviteCode.toUpperCase() === inviteCode.toUpperCase()
    );
    return group ?? null;
  },

  addAssignment: (groupId, lessonId, assignedBy, dueDate) => {
    const assignment: AssignedLesson = {
      id: `assign-${Date.now()}`,
      groupId,
      lessonId,
      assignedBy,
      dueDate,
      createdAt: new Date().toISOString(),
    };
    set({ assignments: [...get().assignments, assignment] });
  },
}));
