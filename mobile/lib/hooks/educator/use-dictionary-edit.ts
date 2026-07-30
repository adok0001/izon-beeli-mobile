import { apiFetch } from "@/lib/api";
import { buildEditCsv } from "@/lib/edit-import";
import type { DictionaryExport, ImportResult } from "@/lib/import-result";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface DictionaryExportInput {
  languageId: string;
  category?: string;
  status?: string;
  /** Export exactly these entries (the Studio checkbox picker) — takes precedence over category/status. */
  ids?: string[];
}

export interface DictionaryEditInput {
  languageId: string;
  entries: Record<string, string>[];
  dryRun: boolean;
}

/**
 * Fetch an editable slice of the dictionary as CSV text.
 *
 * A mutation rather than a query: the educator asks for a sheet at a moment of
 * their choosing, and caching a snapshot they are about to edit elsewhere would
 * be actively misleading.
 */
export function useDictionaryExport() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ languageId, category, status, ids }: DictionaryExportInput) => {
      const token = await getToken();
      const query = new URLSearchParams({ languageId, type: "dictionary" });
      if (ids?.length) {
        query.set("ids", ids.join(","));
      } else {
        if (category) query.set("category", category);
        if (status) query.set("status", status);
      }
      const data = await apiFetch<DictionaryExport>(`/import/export?${query}`, { token: token ?? undefined });
      return { ...data, csv: buildEditCsv(data.rows, data.columns) };
    },
  });
}

/**
 * Apply a corrected sheet. A `dryRun` call diffs and previews; the real run
 * updates rows in place — it can never create one — and refreshes the
 * dictionary the sheet just changed.
 */
export function useDictionaryEdit() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ languageId, entries, dryRun }: DictionaryEditInput) => {
      const token = await getToken();
      return apiFetch<ImportResult>("/import/edit", {
        method: "POST",
        body: JSON.stringify({ languageId, entries, dryRun }),
        token: token ?? undefined,
      });
    },
    onSuccess: (_res, input) => {
      if (input.dryRun) return;
      queryClient.invalidateQueries({ queryKey: ["educator", "dictionary"] });
    },
  });
}
