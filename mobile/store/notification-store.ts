import { create } from "zustand";
import AsyncStorage from "@/lib/storage";
import type { InAppNotification, NotificationType } from "@/types";

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;

  addNotification: (type: NotificationType, title: string, body: string, icon?: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  hydrate: () => Promise<void>;
  _hydrated: boolean;
}

const STORAGE_KEY = "izon-beeli-notifications";

function persist(notifications: InAppNotification[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => {});
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  _hydrated: false,

  addNotification: (type, title, body, icon) => {
    const notification: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
      ...(icon ? { icon } : {}),
    };
    const updated = [notification, ...get().notifications].slice(0, 50); // Keep max 50
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
    persist(updated);
  },

  markRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
    persist(updated);
  },

  markAllRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    persist(updated);
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    persist([]);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const notifications: InAppNotification[] = JSON.parse(stored);
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch {
      set({ _hydrated: true });
    }
  },
}));
