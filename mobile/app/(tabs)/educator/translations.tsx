import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import {
  GLOSS_LOCALES,
  useSaveTranslationGloss,
  useTranslationQueue,
  type GlossLocale,
  type TranslationQueueEntry,
} from "@/lib/hooks/educator/use-translations";
import { useToast } from "@/lib/hooks/use-toast";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ActionPill } from "@/components/studio/studio-action-pill";
import { StudioCard } from "@/components/studio/studio-card";
import { StudioFilterPills } from "@/components/studio/studio-filter-pills";
import { FormInput } from "@/components/studio/studio-form";
import { StudioScreenHeader } from "@/components/studio/studio-screen-header";
import { LANGUAGES, getLanguageName } from "@/lib/mock-data";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUnsavedGuard } from "@/lib/studio/use-unsaved-guard";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TranslationQueueScreen() {
  const M = useMuseumTheme();
  const { user } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const allowedLanguages = useMemo(
    () => (user.isAdmin ? LANGUAGES.map((l) => l.id) : user.reviewerLanguages),
    [user]
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const activeLanguageId = selectedLanguageId ?? allowedLanguages[0] ?? user.selectedLanguageId ?? "izon";

  const [locale, setLocale] = useState<GlossLocale>("fr");
  const queueQuery = useTranslationQueue(activeLanguageId, locale);
  const { refetch: refetchQueue } = queueQuery;
  const save = useSaveTranslationGloss();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchQueue();
    setRefreshing(false);
  }, [refetchQueue]);

  const [drafts, setDrafts] = useState<Record<string, { gloss: string; exampleGloss: string }>>({});
  function draftFor(entry: TranslationQueueEntry) {
    return drafts[entry.id] ?? { gloss: "", exampleGloss: "" };
  }

  const missing = queueQuery.data?.missing ?? [];

  // A saved gloss drops its entry from `missing`, so unsaved work is any
  // still-missing entry that has typed-but-unsaved draft text.
  const hasUnsavedDrafts = missing.some((entry) => {
    const draft = drafts[entry.id];
    return !!draft && (draft.gloss.trim() !== "" || draft.exampleGloss.trim() !== "");
  });
  useUnsavedGuard(hasUnsavedDrafts);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <NotificationBanner
        visible={toast.visible}
        title={toast.title}
        body={toast.body}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <StudioScreenHeader title="Translations" subtitle="Fill in missing glosses per locale." />

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={M.accent} colors={[M.accent]} />}
      >
        <View style={{ marginBottom: 16 }}>
          <StudioFilterPills
            options={allowedLanguages.map((languageId) => ({ id: languageId, label: getLanguageName(languageId) }))}
            value={activeLanguageId}
            onChange={(languageId) => { setSelectedLanguageId(languageId); setDrafts({}); }}
            scrollable
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <StudioFilterPills
            options={GLOSS_LOCALES.map((l) => ({ id: l.code, label: l.label }))}
            value={locale}
            onChange={setLocale}
          />
        </View>

        {queueQuery.isPending && <Text style={{ color: M.muted, fontSize: 13 }}>Loading…</Text>}
        {queueQuery.data && (
          <Text style={{ color: M.muted, fontSize: 13, marginBottom: 12 }}>
            {queueQuery.data.missing.length} of {queueQuery.data.total} entries missing a {locale} gloss.
          </Text>
        )}
        {queueQuery.data?.missing.length === 0 && (
          <Text style={{ color: M.success, fontSize: 13, marginBottom: 12 }}>Every entry has a {locale} gloss.</Text>
        )}

        <View style={{ gap: 12 }}>
          {missing.map((entry) => {
            const draft = draftFor(entry);
            const needsExampleGloss = !!entry.example;
            const canSave = draft.gloss.trim().length > 0 && (!needsExampleGloss || draft.exampleGloss.trim().length > 0);
            return (
              <StudioCard key={entry.id} style={{ gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{entry.word}</Text>
                {entry.example && <Text style={{ fontSize: 12, color: M.muted }}>{entry.example}</Text>}
                <FormInput
                  value={draft.gloss}
                  onChangeText={(v) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, gloss: v } }))}
                  placeholder={`Gloss in ${locale}…`}
                  multiline
                />
                {needsExampleGloss && (
                  <FormInput
                    value={draft.exampleGloss}
                    onChangeText={(v) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, exampleGloss: v } }))}
                    placeholder={`Example translation in ${locale}…`}
                    multiline
                  />
                )}
                <View style={{ alignSelf: "flex-start" }}>
                  <ActionPill
                    icon="checkmark"
                    label="Save"
                    tone="success"
                    disabled={!canSave || save.isPending}
                    onPress={() =>
                      save.mutate(
                        { entry, locale, gloss: draft.gloss.trim(), exampleGloss: draft.exampleGloss.trim() },
                        {
                          onSuccess: () => toastSuccess(`Saved "${entry.word}"`),
                          onError: (err: Error) => toastError("Save failed", friendlyError(err)),
                        }
                      )
                    }
                  />
                </View>
              </StudioCard>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
