import storage from "@/lib/storage";
import { useEffect, useState } from "react";

const KEY = "recently-viewed-words";
const MAX = 8;

interface RecentEntry {
  id: string;
  languageId: string;
}

export async function addRecentlyViewed(id: string, languageId: string): Promise<void> {
  try {
    const raw = await storage.getItem(KEY);
    const existing: RecentEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((e) => e.id !== id);
    const updated = [{ id, languageId }, ...filtered].slice(0, MAX);
    await storage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // non-critical
  }
}

export function useRecentlyViewed(): RecentEntry[] {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  useEffect(() => {
    storage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setEntries(JSON.parse(raw));
        } catch {
          // ignore
        }
      }
    });
  }, []);

  return entries;
}
