import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ImportResult } from "@/lib/import-result";

export interface UnifiedImportInput {
  languageId: string;
  entries: Record<string, string>[];
  dryRun: boolean;
}

/**
 * Bulk-import a parsed unified CSV. A `dryRun` call validates and previews; the
 * real run inserts (admins publish, reviewers stage for review) and refreshes
 * the content the sheet may have touched.
 */
export function useUnifiedImport() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ languageId, entries, dryRun }: UnifiedImportInput) => {
      const token = await getToken();
      return apiFetch<ImportResult>("/import/unified", {
        method: "POST",
        body: JSON.stringify({ languageId, entries, dryRun }),
        token: token ?? undefined,
      });
    },
    onSuccess: (_res, input) => {
      if (input.dryRun) return;
      for (const key of ["dictionary", "sentences", "proverbs", "quiz-bank"]) {
        queryClient.invalidateQueries({ queryKey: ["educator", key] });
      }
    },
  });
}
