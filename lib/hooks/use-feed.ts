import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { apiFetch } from "@/lib/api";
import type { FeedItem, Comment } from "@/types";

interface FeedItemResponse {
  id: string;
  type: FeedItem["type"];
  title: string;
  description: string;
  userName: string;
  userAvatarUrl?: string;
  audioUrl?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

interface FeedPage {
  items: FeedItemResponse[];
  nextCursor: string | null;
}

export type FeedTypeFilter = "all" | "achievement" | "contribution" | "community";

export function useFeed(typeFilter?: FeedTypeFilter) {
  const { getToken, isSignedIn } = useAuth();

  return useInfiniteQuery<FeedPage>({
    queryKey: ["feed", typeFilter ?? "all"],
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam as string);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      return apiFetch<FeedPage>(`/feed?${params}`, { token: token! });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!isSignedIn,
  });
}

export function useCreatePost() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      const token = await getToken();
      return apiFetch<FeedItemResponse>("/feed", {
        method: "POST",
        token: token!,
        body: JSON.stringify(input),
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(["feed"]);
      const optimistic: FeedItemResponse = {
        id: `temp-${Date.now()}`,
        type: "community",
        title: input.title,
        description: input.description,
        userName: user?.username ?? "You",
        likes: 0,
        comments: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };
      if (previous) {
        const newPages = [...previous.pages];
        if (newPages.length > 0) {
          newPages[0] = { ...newPages[0], items: [optimistic, ...newPages[0].items] };
        }
        queryClient.setQueryData(["feed"], { ...previous, pages: newPages });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feed"], context.previous);
      }
      Alert.alert("Error", "Failed to create post. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useToggleLike() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedItemId: string) => {
      const token = await getToken();
      return apiFetch<{ liked: boolean }>(`/feed/${feedItemId}/like`, {
        method: "POST",
        token: token!,
      });
    },
    onMutate: async (feedItemId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(["feed"]);
      if (previous) {
        const newPages = previous.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === feedItemId
              ? {
                  ...item,
                  isLiked: !item.isLiked,
                  likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                }
              : item
          ),
        }));
        queryClient.setQueryData(["feed"], { ...previous, pages: newPages });
      }
      return { previous };
    },
    onError: (_err, _feedItemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["feed"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useComments(feedItemId: string | null) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<Comment[]>({
    queryKey: ["comments", feedItemId],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<Comment[]>(`/feed/${feedItemId}/comments`, { token: token! });
    },
    enabled: !!isSignedIn && !!feedItemId,
  });
}

export function useAddComment() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { feedItemId: string; text: string }) => {
      const token = await getToken();
      return apiFetch<Comment>(`/feed/${input.feedItemId}/comments`, {
        method: "POST",
        token: token!,
        body: JSON.stringify({ text: input.text }),
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["comments", input.feedItemId] });
      const previous = queryClient.getQueryData<Comment[]>(["comments", input.feedItemId]);
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        feedItemId: input.feedItemId,
        userName: user?.username ?? "You",
        text: input.text,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Comment[]>(["comments", input.feedItemId], (old) =>
        old ? [...old, optimistic] : [optimistic]
      );
      return { previous, feedItemId: input.feedItemId };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["comments", context.feedItemId], context.previous);
      }
      Alert.alert("Error", "Failed to add comment. Please try again.");
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.feedItemId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
