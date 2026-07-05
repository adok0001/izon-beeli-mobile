import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const GLOSS_LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pcm", label: "Pidgin" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
] as const;
export type GlossLocale = (typeof GLOSS_LOCALES)[number]["code"];

export interface TranslationQueueEntry {
  id: string;
  word: string;
  example: string | null;
  translations: Record<string, string> | null;
  exampleTranslations: Record<string, string> | null;
}

export interface TranslationQueueResponse {
  languageId: string;
  locale: string;
  total: number;
  missing: TranslationQueueEntry[];
}

export function useTranslationQueue(languageId: string | undefined, locale: GlossLocale) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<TranslationQueueResponse>({
    queryKey: ["educator", "translation-queue", languageId ?? null, locale],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<TranslationQueueResponse>(
        `/educator/translation-queue?languageId=${languageId}&locale=${locale}`,
        { token: token ?? undefined }
      );
    },
    enabled: !!isSignedIn && !!languageId,
  });
}

export function useSaveTranslationGloss() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entry, locale, gloss, exampleGloss,
    }: { entry: TranslationQueueEntry; locale: GlossLocale; gloss: string; exampleGloss: string }) => {
      const token = await getToken();
      const body: Record<string, unknown> = {
        translations: { ...entry.translations, [locale]: gloss },
      };
      if (entry.example) {
        body.exampleTranslations = { ...entry.exampleTranslations, [locale]: exampleGloss };
      }
      return apiFetch(`/educator/dictionary/${entry.id}`, {
        method: "PATCH",
        token: token ?? undefined,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["educator", "translation-queue"] }),
  });
}
