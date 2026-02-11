import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { apiFetch } from "@/lib/api";
import type { JournalEntry } from "@/types";

// Server returns timestamps as ISO strings
interface JournalEntryResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  lessonId: string | null;
  createdAt: string;
  updatedAt: string;
}

function toJournalEntry(r: JournalEntryResponse): JournalEntry {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    lessonId: r.lessonId ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function useJournal() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    queryFn: async () => {
      const token = await getToken();
      const data = await apiFetch<JournalEntryResponse[]>("/journal", { token: token! });
      return data.map(toJournalEntry);
    },
    enabled: !!isSignedIn,
  });
}

export function useCreateJournalEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; content: string; lessonId?: string }) => {
      const token = await getToken();
      const data = await apiFetch<JournalEntryResponse>("/journal", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
      return toJournalEntry(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["journal"] });
      const previous = queryClient.getQueryData<JournalEntry[]>(["journal"]);
      const optimistic: JournalEntry = {
        id: `temp-${Date.now()}`,
        title: input.title,
        content: input.content,
        lessonId: input.lessonId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<JournalEntry[]>(["journal"], (old) =>
        old ? [optimistic, ...old] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["journal"], context.previous);
      }
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; title: string; content: string }) => {
      const token = await getToken();
      const data = await apiFetch<JournalEntryResponse>(`/journal/${input.id}`, {
        method: "PATCH",
        token: token!,
        body: JSON.stringify({ title: input.title, content: input.content }),
      });
      return toJournalEntry(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["journal"] });
      const previous = queryClient.getQueryData<JournalEntry[]>(["journal"]);
      queryClient.setQueryData<JournalEntry[]>(["journal"], (old) =>
        old?.map((e) =>
          e.id === input.id
            ? { ...e, title: input.title, content: input.content, updatedAt: new Date().toISOString() }
            : e
        )
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["journal"], context.previous);
      }
      Alert.alert("Error", "Failed to update journal entry. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/journal/${id}`, { method: "DELETE", token: token! });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["journal"] });
      const previous = queryClient.getQueryData<JournalEntry[]>(["journal"]);
      queryClient.setQueryData<JournalEntry[]>(["journal"], (old) =>
        old?.filter((e) => e.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["journal"], context.previous);
      }
      Alert.alert("Error", "Failed to delete journal entry. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
