/**
 * Transcript-segment editing for the Studio lesson editor: the per-segment row,
 * the gloss-language chip row above it, and the payload serializer.
 */
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GLOSS_LANGUAGES } from "@/components/ui/localized-text-input";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { EducatorLessonSegment } from "@/lib/hooks/use-educator-panel";
import type { UiLanguage } from "@/store/ui-language-store";
import type { LocalizedText } from "@/types";
import { Pressable, Text, TextInput, View } from "react-native";

export type SegmentEditor = {
  uid: string;
  text: string;
  translation: LocalizedText;
  startTime: string;
  endTime: string;
};

let _segUid = 0;
export const makeSegment = (overrides?: Partial<Omit<SegmentEditor, "uid">>): SegmentEditor => ({
  uid: `seg-${(_segUid++).toString()}`,
  text: "",
  translation: {},
  startTime: "",
  endTime: "",
  ...overrides,
});

export const EMPTY_SEGMENT = (): SegmentEditor => makeSegment();

/** Compact chip row for picking which language's translation to view/edit across all segments. */
export function TranslationLanguagePicker({
  value,
  onChange,
  filledLangs,
}: Readonly<{ value: UiLanguage; onChange: (lang: UiLanguage) => void; filledLangs: Set<UiLanguage> }>) {
  const M = useMuseumTheme();
  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      {GLOSS_LANGUAGES.map((lang) => {
        const active = value === lang.key;
        const filled = filledLangs.has(lang.key);
        return (
          <Pressable
            key={lang.key}
            onPress={() => onChange(lang.key)}
            className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70"
            style={{
              borderColor: active ? M.accentBorder : M.border,
              backgroundColor: active ? M.accentGlow : "transparent",
            }}
          >
            {filled ? (
              <IconSymbol name="checkmark.circle.fill" size={11} color={active ? M.accent : M.muted} />
            ) : null}
            <Text
              className="text-xs font-bold"
              style={{ color: active ? M.accent : M.muted }}
            >
              {lang.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SegmentItem({
  segment,
  index,
  total,
  translationLang,
  playbackPositionSeconds,
  onChange,
  onChangeTranslation,
  onRemove,
}: Readonly<{
  segment: SegmentEditor;
  index: number;
  total: number;
  translationLang: UiLanguage;
  playbackPositionSeconds: number;
  onChange: (index: number, key: "text" | "startTime" | "endTime", value: string) => void;
  onChangeTranslation: (index: number, lang: UiLanguage, value: string) => void;
  onRemove: (index: number) => void;
}>) {
  const M = useMuseumTheme();
  const stamp = (key: "startTime" | "endTime") =>
    onChange(index, key, playbackPositionSeconds.toFixed(1));
  const translationLabel = GLOSS_LANGUAGES.find((l) => l.key === translationLang)?.label ?? translationLang.toUpperCase();

  return (
    <View
      className="mb-2 rounded-xl border p-3"
      style={{ backgroundColor: M.card, borderColor: M.border }}
    >
      <TextInput
        value={segment.text}
        onChangeText={(v) => onChange(index, "text", v)}
        placeholder="Segment text"
        placeholderTextColor={M.muted}
        className="rounded-lg px-3 py-2 text-sm"
        style={{ backgroundColor: M.inputBg, color: M.inputText }}
      />
      <TextInput
        value={segment.translation[translationLang] ?? ""}
        onChangeText={(v) => onChangeTranslation(index, translationLang, v)}
        placeholder={`Translation (${translationLabel}, optional)`}
        placeholderTextColor={M.muted}
        className="mt-2 rounded-lg px-3 py-2 text-sm"
        style={{ backgroundColor: M.inputBg, color: M.inputText }}
      />
      <View className="mt-2 flex-row gap-2">
        {(["startTime", "endTime"] as const).map((key) => (
          <View key={key} className="flex-1">
            <Text
              className="mb-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: M.muted }}
            >
              {key === "startTime" ? "Start" : "End"}
            </Text>
            <View className="flex-row items-center gap-1">
              <TextInput
                value={segment[key]}
                onChangeText={(v) => onChange(index, key, v)}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={M.muted}
                className="flex-1 rounded-lg px-2.5 py-2 text-sm"
                style={{ backgroundColor: M.inputBg, color: M.inputText }}
              />
              <Pressable
                onPress={() => stamp(key)}
                hitSlop={4}
                className="items-center justify-center rounded-lg bg-brand-50 px-2.5 py-2 active:opacity-70 dark:bg-brand-900/30"
              >
                <IconSymbol name="record.circle" size={16} color={M.accent} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {total > 1 ? (
        <Pressable onPress={() => onRemove(index)} className="mt-2 self-end">
          <Text className="text-xs font-semibold" style={{ color: M.error }}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * en/fr persist through their dedicated DB columns (translation/translationFr).
 * Other languages (pcm/ar/pt) have no dedicated column, so once any of those are
 * filled the whole map is JSON-encoded into `translation` — `localize()` already
 * unpacks that transparently wherever segment translations are read.
 */
export function serializeSegmentTranslation(t: LocalizedText): { translation?: string; translationFr?: string } {
  const hasExtraLangs = !!(t.pcm?.trim() || t.ar?.trim() || t.pt?.trim());
  if (hasExtraLangs) return { translation: JSON.stringify(t) };
  return {
    translation: t.en?.trim() || undefined,
    translationFr: t.fr?.trim() || undefined,
  };
}

export function toSegmentsPayload(source: SegmentEditor[]): EducatorLessonSegment[] {
  return source
    .map((seg, i) => ({
      text: seg.text.trim(),
      ...serializeSegmentTranslation(seg.translation),
      startTime: seg.startTime ? Number(seg.startTime) : 0,
      endTime: seg.endTime ? Number(seg.endTime) : 0,
      order: i,
    }))
    .filter((seg) => seg.text.length > 0);
}
