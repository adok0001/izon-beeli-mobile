import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "@/lib/api";

export function useWordBank() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<string[]>({
    queryKey: ["wordbank"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<string[]>("/wordbank", { token: token! });
    },
    enabled: !!isSignedIn,
  });
}

export function useSaveWord() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dictionaryEntryId: string) => {
      const token = await getToken();
      return apiFetch("/wordbank", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ dictionaryEntryId }),
      });
    },
    onMutate: async (dictionaryEntryId) => {
      await queryClient.cancelQueries({ queryKey: ["wordbank"] });
      const previous = queryClient.getQueryData<string[]>(["wordbank"]);
      queryClient.setQueryData<string[]>(["wordbank"], (old) =>
        old ? [...old, dictionaryEntryId] : [dictionaryEntryId]
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wordbank"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbank"] });
    },
  });
}

export function useRemoveWord() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dictionaryEntryId: string) => {
      const token = await getToken();
      return apiFetch(`/wordbank/${dictionaryEntryId}`, {
        method: "DELETE",
        token: token!,
      });
    },
    onMutate: async (dictionaryEntryId) => {
      await queryClient.cancelQueries({ queryKey: ["wordbank"] });
      const previous = queryClient.getQueryData<string[]>(["wordbank"]);
      queryClient.setQueryData<string[]>(["wordbank"], (old) =>
        old?.filter((id) => id !== dictionaryEntryId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["wordbank"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wordbank"] });
    },
  });
}
