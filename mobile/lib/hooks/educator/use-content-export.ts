import { apiFetch } from "@/lib/api";
import { buildContentCsv } from "@/lib/content-export";
import type { CsvExport } from "@/lib/import-result";
import type { UnifiedRowType } from "@/lib/unified-import";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";

export interface ContentExportInput {
  languageId: string;
  type: UnifiedRowType;
  /** Narrow to one workflow state ("published", "in_review", …). */
  status?: string;
}

/**
 * Fetch one content type as a unified-shaped CSV.
 *
 * A mutation rather than a query, for the same reason as `useDictionaryExport`:
 * the educator asks for a sheet at a moment of their choosing, and caching a
 * snapshot they are about to edit elsewhere would be actively misleading.
 */
export function useContentExport() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ languageId, type, status }: ContentExportInput) => {
      const token = await getToken();
      const query = new URLSearchParams({ languageId, type });
      if (status) query.set("status", status);
      const data = await apiFetch<CsvExport>(`/import/content-export?${query}`, { token: token ?? undefined });
      return { ...data, csv: buildContentCsv(data.rows, data.columns) };
    },
  });
}
