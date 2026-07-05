import { IconSymbol } from "@/components/ui/icon-symbol";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { friendlyError } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import {
  GLOSS_LOCALES,
  useSaveTranslationGloss,
  useTranslationQueue,
  type GlossLocale,
  type TranslationQueueEntry,
} from "@/lib/hooks/educator/use-translations";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TranslationQueueScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  useStudioAccess();
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: currentUser } = useCurrentUser();

  const [locale, setLocale] = useState<GlossLocale>("fr");
  const languageId = currentUser?.reviewerLanguages?.[0];
  const queueQuery = useTranslationQueue(languageId, locale);
  const save = useSaveTranslationGloss();

  const [drafts, setDrafts] = useState<Record<string, { gloss: string; exampleGloss: string }>>({});
  function draftFor(entry: TranslationQueueEntry) {
    return drafts[entry.id] ?? { gloss: "", exampleGloss: "" };
  }

  const missing = queueQuery.data?.missing ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <IconSymbol name="chevron.left" size={22} color={M.parchment} />
        </Pressable>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: M.parchment }}>Translations</Text>
          <Text style={{ fontSize: 12, color: M.textDim }}>Fill in missing glosses per locale.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: M.card }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {GLOSS_LOCALES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => setLocale(l.code)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                backgroundColor: locale === l.code ? M.accent : M.bg,
                borderWidth: 1, borderColor: locale === l.code ? M.accent : M.border,
              }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: locale === l.code ? M.ink : M.sub }}>
                {l.label}
              </Text>
            </Pressable>
          ))}
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
              <View key={entry.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: M.border, backgroundColor: M.bg, padding: 14, gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{entry.word}</Text>
                {entry.example && <Text style={{ fontSize: 12, color: M.muted }}>{entry.example}</Text>}
                <TextInput
                  value={draft.gloss}
                  onChangeText={(v) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, gloss: v } }))}
                  placeholder={`Gloss in ${locale}…`}
                  placeholderTextColor={M.inputPlaceholder}
                  multiline
                  style={{
                    borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
                    backgroundColor: M.inputBg, color: M.inputText,
                    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44,
                  }}
                />
                {needsExampleGloss && (
                  <TextInput
                    value={draft.exampleGloss}
                    onChangeText={(v) => setDrafts((d) => ({ ...d, [entry.id]: { ...draft, exampleGloss: v } }))}
                    placeholder={`Example translation in ${locale}…`}
                    placeholderTextColor={M.inputPlaceholder}
                    multiline
                    style={{
                      borderRadius: 10, borderWidth: 1, borderColor: M.inputBorder,
                      backgroundColor: M.inputBg, color: M.inputText,
                      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44,
                    }}
                  />
                )}
                <Pressable
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
                  style={{
                    alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
                    backgroundColor: M.accent, opacity: !canSave || save.isPending ? 0.4 : 1,
                  }}
                  className="active:opacity-80"
                >
                  <Text style={{ fontWeight: "800", color: M.ink, fontSize: 13 }}>Save</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
