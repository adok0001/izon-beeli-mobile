import { IconSymbol } from "@/components/ui/icon-symbol";
import { CULTURE_CATEGORY_ICON } from "@/constants/cultural-categories";
import type { CulturalCategory, CulturalNote } from "@/types";
import { useCultural } from "@/lib/hooks/use-cultural";
import { localize } from "@/lib/localize";
import { toParagraphs } from "@/lib/text";
import { glass, useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Shared "tap through to the Cultural gallery" card chrome for every variant below. */
function NoteCard({
  style,
  label,
  onPress,
  children,
}: {
  style: StyleProp<ViewStyle>;
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={style}
      accessibilityRole="button"
      accessibilityLabel={`Cultural note: ${label}`}
    >
      {children}
    </Pressable>
  );
}

/** The "✦ CULTURE · meta" overline shared by every card variant below. */
function NoteHeader({ label, meta }: { label: string; meta?: string | null }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <IconSymbol name="sparkles" size={13} color={M.accent} />
      <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: M.accent }}>
        {label}
        {meta ? <Text style={{ color: M.muted }}>{`  ·  ${meta}`}</Text> : null}
      </Text>
    </View>
  );
}

/**
 * Reader for a lesson's own authored culture beat. These notes are standalone
 * text (no gallery entry to link to), so tapping the card opens the note itself
 * in full rather than dumping the learner into the whole culture list.
 */
function CultureNoteReader({
  title,
  body,
  meta,
  label,
  onClose,
}: {
  title: string;
  body: string;
  meta?: string | null;
  label: string;
  onClose: () => void;
}) {
  const M = useMuseumTheme();
  const insets = useSafeAreaInsets();
  const paragraphs = body ? toParagraphs(body) : [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: M.bg }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 22 }}>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              hitSlop={8}
              style={{ alignSelf: "flex-start", width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: M.card, borderWidth: 1, borderColor: glass(0.18) }}
            >
              <IconSymbol name="xmark" size={18} color={M.text} />
            </Pressable>

            <View style={{ marginTop: 18 }}>
              <NoteHeader label={label} meta={meta} />
            </View>
            <Text style={{ marginTop: 4, fontSize: 24, fontWeight: "800", letterSpacing: -0.5, lineHeight: 29, color: M.text }}>
              {title}
            </Text>

            <View style={{ marginTop: 18 }}>
              {paragraphs.map((p, i) => (
                <Text key={i} style={{ marginBottom: 13, fontSize: 15, lineHeight: 24, fontWeight: "500", color: M.sub }}>
                  {p}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Renders a lesson's own authored culture beats — the first as a prominent
 * card, any further notes as compact companion cards right below it. Tapping a
 * card opens that note in a reader (the notes are standalone, so there's no
 * gallery entry to jump to). Pure: no data fetching, safe to mount many times
 * inline in a transcript.
 */
export function CulturalNoteCards({ notes }: { notes: CulturalNote[] }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const label = t("lesson.culture", { defaultValue: "Culture" });
  const [openNote, setOpenNote] = useState<{ title: string; body: string; meta?: string | null } | null>(null);

  const cardStyle = {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: M.card,
    borderWidth: 1,
    borderColor: M.border,
    borderLeftWidth: 3,
    borderLeftColor: M.accent,
  } as const;

  const secondaryCardStyle = {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: M.card,
    borderWidth: 1,
    borderColor: M.border,
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "flex-start" as const,
  };

  return (
    <>
      {notes.map((note, i) => {
        const title = localize(note.title, uiLanguage);
        const body = localize(note.body, uiLanguage);
        const meta = note.tags?.[0]?.replace(/_/g, " ");
        const onPress = () => setOpenNote({ title, body, meta });

        if (i === 0) {
          return (
            <NoteCard key={title} style={cardStyle} label={title} onPress={onPress}>
              <NoteHeader label={label} meta={meta} />
              <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>{title}</Text>
              {body ? (
                <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: M.sub }} numberOfLines={4}>
                  {body}
                </Text>
              ) : null}
            </NoteCard>
          );
        }
        return (
          <NoteCard key={title} style={secondaryCardStyle} label={title} onPress={onPress}>
            <IconSymbol name="sparkles" size={18} color={M.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>{title}</Text>
              {body ? (
                <Text style={{ marginTop: 3, fontSize: 12.5, lineHeight: 18, color: M.sub }} numberOfLines={3}>
                  {body}
                </Text>
              ) : null}
            </View>
          </NoteCard>
        );
      })}

      {openNote ? (
        <CultureNoteReader
          title={openNote.title}
          body={openNote.body}
          meta={openNote.meta}
          label={label}
          onClose={() => setOpenNote(null)}
        />
      ) : null}
    </>
  );
}

/**
 * Inline cultural beat inside the lesson flow. Beeli's wedge is language AND
 * culture together, so culture shouldn't live only behind a side route.
 *
 * Prefers notes authored for THIS lesson (`notes`, from the podcast package's
 * per-episode `culturalNotes`) so the right beat lands on the right lesson,
 * and only then falls back to a gallery item. The fallback is keyed to
 * `lessonId` so different lessons surface different cultural items instead of
 * every lesson repeating the language's one featured entry.
 * Renders nothing when neither is available. Use `CulturalNoteCards` directly
 * when notes are already known to exist (e.g. anchored inline in a
 * transcript) to skip this fallback's data fetch.
 */
export function LessonCultureNote({
  languageId,
  notes,
  lessonId,
}: {
  languageId: string;
  notes?: CulturalNote[];
  lessonId?: string;
}) {
  if (notes && notes.length > 0) {
    return <CulturalNoteCards notes={notes} />;
  }
  return <CulturalGalleryFallback languageId={languageId} lessonId={lessonId} />;
}

/** Stable non-negative hash of a string, for deterministic per-lesson selection. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * A gallery item shown when a lesson has no notes of its own. Deterministically
 * keyed to the lesson so each lesson gets a different (but stable) item, rather
 * than every lesson repeating the language's single featured entry.
 */
function CulturalGalleryFallback({ languageId, lessonId }: { languageId: string; lessonId?: string }) {
  const M = useMuseumTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const { data } = useCultural(languageId);

  if (!data || data.length === 0) return null;
  const item = lessonId
    ? data[hashString(lessonId) % data.length]
    : data.find((c) => c.featured) ?? data[0];
  const title = localize(item.title, uiLanguage);
  const description = localize(item.description, uiLanguage);
  const category = item.category.replace(/_/g, " ");
  const label = t("lesson.culture", { defaultValue: "Culture" });

  return (
    <NoteCard
      style={{
        marginTop: 20,
        borderRadius: 16,
        padding: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        borderLeftWidth: 3,
        borderLeftColor: M.accent,
      }}
      label={title}
      onPress={() => router.push({ pathname: "/cultural/[languageId]", params: { languageId, itemId: item.id } })}
    >
      <NoteHeader label={label} meta={category} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconSymbol name={CULTURE_CATEGORY_ICON[item.category as CulturalCategory]} size={26} color={M.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }} numberOfLines={1}>{title}</Text>
          {description ? (
            <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 18, color: M.sub }} numberOfLines={2}>{description}</Text>
          ) : null}
        </View>
        <IconSymbol name="chevron.right" size={15} color={M.muted} />
      </View>
    </NoteCard>
  );
}
