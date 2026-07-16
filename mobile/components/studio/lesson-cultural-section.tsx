/**
 * Attach culture notes (cultural_content) to a lesson, in tap order, and choose
 * where each one lands in the transcript.
 *
 * Only meaningful in edit mode — a brand-new lesson has no id to attach against.
 */
import type { SegmentEditor } from "@/components/studio/lesson-segment-editor";
import type { EducatorLessonCulturalAttachment } from "@/lib/hooks/educator/use-lessons";
import { useCulturalItems } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

const PREVIEW_CHARS = 24;

/**
 * Blank segments are dropped on save, so an anchor's index has to line up with
 * the *saved* transcript, not the editor's rows.
 */
function anchorableSegments(segments: SegmentEditor[]): SegmentEditor[] {
  return segments.filter((seg) => seg.text.trim().length > 0);
}

/**
 * The server rejects an anchor that points past the end of the transcript, so
 * send anchors that a segment deletion has orphaned back to "end of lesson".
 */
export function clampAttachments(
  attachments: EducatorLessonCulturalAttachment[],
  segments: SegmentEditor[],
): EducatorLessonCulturalAttachment[] {
  const count = anchorableSegments(segments).length;
  return attachments.map((a) =>
    a.afterSegmentIndex != null && a.afterSegmentIndex >= count ? { ...a, afterSegmentIndex: null } : a,
  );
}

function truncate(text: string): string {
  const clean = text.trim();
  if (!clean) return "";
  return clean.length > PREVIEW_CHARS ? `${clean.slice(0, PREVIEW_CHARS)}…` : clean;
}

/** One chip row: "End of lesson" plus one chip per transcript line. Shared by
 * the culture-note attachments and the in-lesson checks section — both anchor
 * to the same between-segment rail. */
export function AnchorPicker({
  value,
  segments,
  onChange,
}: Readonly<{
  value: number | null;
  segments: SegmentEditor[];
  onChange: (index: number | null) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  const chipStyle = (active: boolean) =>
    active
      ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder }
      : { backgroundColor: M.inputBg, borderColor: M.border };

  if (segments.length === 0) {
    return (
      <Text className="mt-1 text-xs" style={{ color: M.muted }}>
        {t("educator.lessonEdit.anchorNoSegments")}
      </Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1.5">
      <View className="flex-row gap-1.5 pr-2">
        <Pressable
          onPress={() => onChange(null)}
          className="rounded-full border px-2.5 py-1"
          style={chipStyle(value === null)}
        >
          <Text className="text-[11px] font-semibold" style={{ color: value === null ? M.accent : M.sub }}>
            {t("educator.lessonEdit.anchorEnd")}
          </Text>
        </Pressable>
        {segments.map((segment, index) => {
          const active = value === index;
          const preview = truncate(segment.text);
          return (
            <Pressable
              key={segment.uid}
              onPress={() => onChange(index)}
              className="rounded-full border px-2.5 py-1"
              style={chipStyle(active)}
            >
              <Text className="text-[11px] font-semibold" style={{ color: active ? M.accent : M.sub }}>
                {t("educator.lessonEdit.anchorAfterLine", { number: String(index + 1) })}
                {preview ? ` · ${preview}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * Lets an educator pick which of the language's cultural_content entries surface
 * on this lesson, in tap order, and anchor each to a transcript line.
 */
export function CulturalContentSection({
  languageId,
  attachments,
  segments,
  onChange,
}: Readonly<{
  languageId: string;
  attachments: EducatorLessonCulturalAttachment[];
  segments: SegmentEditor[];
  onChange: (attachments: EducatorLessonCulturalAttachment[]) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { data: items = [] } = useCulturalItems(languageId);

  const toggle = (id: string) => {
    const exists = attachments.some((a) => a.culturalContentId === id);
    onChange(
      exists
        ? attachments.filter((a) => a.culturalContentId !== id)
        : [...attachments, { culturalContentId: id, afterSegmentIndex: null }],
    );
  };

  const setAnchor = (id: string, afterSegmentIndex: number | null) => {
    onChange(attachments.map((a) => (a.culturalContentId === id ? { ...a, afterSegmentIndex } : a)));
  };

  const titleFor = (id: string) => items.find((item) => item.id === id)?.title ?? id;

  return (
    <View className="mt-4 px-5">
      <View className="rounded-2xl p-4" style={{ backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
          Culture Notes ({attachments.length})
        </Text>
        <Text className="mb-3 text-xs" style={{ color: M.sub }}>
          Attach culture notes from this language&apos;s Culture Notes gallery to this lesson.
        </Text>
        {items.length === 0 ? (
          <Text className="text-sm" style={{ color: M.sub }}>
            No culture notes exist yet for this language.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {items.map((item) => {
              const position = attachments.findIndex((a) => a.culturalContentId === item.id);
              const active = position !== -1;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
                  style={
                    active
                      ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder }
                      : { backgroundColor: M.card, borderColor: M.border }
                  }
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? M.accent : M.sub }}
                  >
                    {item.title}
                  </Text>
                  {active ? (
                    <View className="ml-0.5 h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: M.accent }}>
                      <Text className="text-[9px] font-bold" style={{ color: M.parchment }}>{position + 1}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {attachments.length > 0 ? (
          <View className="mt-4 gap-3">
            <Text className="text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
              {t("educator.lessonEdit.anchorSectionTitle")}
            </Text>
            {attachments.map((attachment) => (
              <View key={attachment.culturalContentId}>
                <Text className="text-xs font-semibold" style={{ color: M.text }}>
                  {titleFor(attachment.culturalContentId)}
                </Text>
                <AnchorPicker
                  value={attachment.afterSegmentIndex}
                  segments={anchorableSegments(segments)}
                  onChange={(index) => setAnchor(attachment.culturalContentId, index)}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
