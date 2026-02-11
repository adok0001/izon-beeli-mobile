import { create } from "zustand";
import { SAMPLE_FEED, SAMPLE_COMMENTS } from "@/lib/mock-data";
import type { FeedItem, Comment, AudioSource } from "@/types";

interface FeedState {
  items: FeedItem[];
  comments: Comment[];
  likedIds: Set<string>;

  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  getLikeCount: (item: FeedItem) => number;
  getComments: (feedItemId: string) => Comment[];
  addComment: (feedItemId: string, userName: string, text: string) => void;
  addPost: (title: string, description: string, userName: string) => void;
  addContribution: (title: string, description: string, userName: string, audioUrl?: AudioSource) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: SAMPLE_FEED,
  comments: SAMPLE_COMMENTS,
  likedIds: new Set<string>(),

  toggleLike: (id) =>
    set((state) => {
      const next = new Set(state.likedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { likedIds: next };
    }),

  isLiked: (id) => get().likedIds.has(id),

  getLikeCount: (item) => item.likes + (get().likedIds.has(item.id) ? 1 : 0),

  getComments: (feedItemId) =>
    get().comments.filter((c) => c.feedItemId === feedItemId),

  addComment: (feedItemId, userName, text) =>
    set((state) => {
      const comment: Comment = {
        id: `c-${Date.now()}`,
        feedItemId,
        userName,
        text,
        createdAt: new Date().toISOString(),
      };
      const updatedItems = state.items.map((item) =>
        item.id === feedItemId
          ? { ...item, comments: item.comments + 1 }
          : item
      );
      return {
        comments: [...state.comments, comment],
        items: updatedItems,
      };
    }),

  addPost: (title, description, userName) =>
    set((state) => {
      const post: FeedItem = {
        id: `f-${Date.now()}`,
        type: "community",
        title,
        description,
        userName,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };
      return { items: [post, ...state.items] };
    }),

  addContribution: (title, description, userName, audioUrl) =>
    set((state) => {
      const item: FeedItem = {
        id: `f-${Date.now()}`,
        type: "contribution",
        title,
        description,
        userName,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        audioUrl,
      };
      return { items: [item, ...state.items] };
    }),
}));
