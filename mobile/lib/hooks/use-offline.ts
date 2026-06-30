import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  return onlineManager.subscribe(callback);
}

function getSnapshot(): boolean {
  return !onlineManager.isOnline();
}

/** Tracks live connectivity via the same NetInfo-backed onlineManager React Query uses (see lib/api.ts). */
export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
