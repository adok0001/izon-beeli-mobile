import { apiFetch } from "@/lib/api";
import type { Comment, FeedItem } from "@/types";
import { useFeedLikesStore } from "@/store/feed-likes-store";
import { useGuestStore } from "@/store/guest-store";
import { useProfileAvatarStore } from "@/store/profile-avatar-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

interface FeedItemResponse {
  id: string;
  type: FeedItem["type"];
  title: string;
  titleFr?: string | null;
  description: string;
  descriptionFr?: string | null;
  userName: string;
  userAvatarUrl?: string;
  profileAvatarId?: string | null;
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
  const isGuest = useGuestStore((s) => s.isGuest);

  return useInfiniteQuery<FeedPage>({
    queryKey: ["feed", typeFilter ?? "all"],
    queryFn: async ({ pageParam }) => {
      // GET /feed is publicly mounted server-side; the token is only sent to
      // resolve isLiked for the caller, so it's optional for guests.
      const token = isSignedIn ? await getToken() : undefined;
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam as string);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      return apiFetch<FeedPage>(`/feed?${params}`, { token: token ?? undefined });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!isSignedIn || isGuest,
  });
}

export function useCreatePost() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const profileAvatarId = useProfileAvatarStore((s) => s.selectedId);

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
        profileAvatarId,
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
  const setLike = useFeedLikesStore((s) => s.setLike);

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
      const allFeedData = queryClient.getQueriesData<{ pages: FeedPage[]; pageParams: unknown[] }>({ queryKey: ["feed"] });
      queryClient.setQueriesData<{ pages: FeedPage[]; pageParams: unknown[] }>(
        { queryKey: ["feed"] },
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            pages: previous.pages.map((page) => ({
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
            })),
          };
        }
      );
      return { allFeedData };
    },
    onSuccess: (data, feedItemId) => {
      // Persist the server-confirmed state so it survives cache refreshes.
      setLike(feedItemId, data.liked);
      queryClient.setQueriesData<{ pages: FeedPage[]; pageParams: unknown[] }>(
        { queryKey: ["feed"] },
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            pages: previous.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === feedItemId ? { ...item, isLiked: data.liked } : item
              ),
            })),
          };
        }
      );
    },
    onError: (_err, _feedItemId, context) => {
      if (context?.allFeedData) {
        for (const [queryKey, data] of context.allFeedData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
  });
}

export function useComments(feedItemId: string | null) {
  const { getToken, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);

  return useQuery<Comment[]>({
    queryKey: ["comments", feedItemId],
    queryFn: async () => {
      const token = isSignedIn ? await getToken() : undefined;
      return apiFetch<Comment[]>(`/feed/${feedItemId}/comments`, { token: token ?? undefined });
    },
    enabled: (!!isSignedIn || isGuest) && !!feedItemId,
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
