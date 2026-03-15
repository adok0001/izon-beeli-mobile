import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";
import type { Group } from "@/types";

export interface MemberProgress {
  userId: string;
  name: string;
  role: string;
  lessonsCompleted: number;
  streak: number;
  points: number;
  assignedCount: number;
  overdueLessons: number;
}

export interface ServerAssignment {
  id: string;
  groupId: string;
  lessonId: string;
  assignedBy: string;
  dueDate: string | null;
  createdAt: string;
}

export function useClassroomGroups() {
  const { getToken } = useAuth();

  return useQuery<Group[]>({
    queryKey: ["classroom-groups"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Group[]>("/classroom/groups", { token: token! });
    },
  });
}

export function useCreateGroup() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, languageId }: { name: string; languageId: string }) => {
      const token = await getToken();
      return apiFetch<Group>("/classroom/groups", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ name, languageId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-groups"] });
    },
  });
}

export function useJoinGroupByCode() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const token = await getToken();
      return apiFetch<Group>("/classroom/groups/join-by-code", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ inviteCode }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-groups"] });
    },
  });
}

export function useGroupAssignments(groupId: string) {
  const { getToken } = useAuth();

  return useQuery<ServerAssignment[]>({
    queryKey: ["classroom-assignments", groupId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ServerAssignment[]>(`/classroom/groups/${groupId}/assignments`, {
        token: token!,
      });
    },
    enabled: !!groupId,
  });
}

export function useCreateAssignment() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      lessonId,
      dueDate,
    }: {
      groupId: string;
      lessonId: string;
      dueDate?: string;
    }) => {
      const token = await getToken();
      return apiFetch<ServerAssignment>("/classroom/assignments", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ groupId, lessonId, dueDate }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-assignments", variables.groupId],
      });
    },
  });
}

export function useGroupProgress(groupId: string) {
  const { getToken } = useAuth();

  return useQuery<MemberProgress[]>({
    queryKey: ["classroom-progress", groupId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<MemberProgress[]>(`/classroom/groups/${groupId}/progress`, {
        token: token!,
      });
    },
    enabled: !!groupId,
  });
}
