/**
 * Collapsible "what the learner will see" preview for the Studio lesson editor —
 * the hero, the description, and the transcript as authored so far.
 */
import { LessonHero } from "@/components/lesson/lesson-hero";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { SegmentEditor } from "@/components/studio/lesson-segment-editor";
import { localize } from "@/lib/localize";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  description: string;
  type: string;
  segments: SegmentEditor[];
}

export function LessonPreviewSection({
  title,
  description,
  type,
  segments,
}: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { uiLanguage } = useUiLanguageStore();
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <View className="mt-4 px-5">
      <Pressable
        onPress={() => setPreviewVisible((v) => !v)}
        className="flex-row items-center justify-between rounded-2xl px-4 py-3 active:opacity-70"
        style={{
          backgroundColor: M.card,
          borderWidth: 1,
          borderColor: M.border,
        }}
      >
        <View className="flex-row items-center gap-2">
          <IconSymbol name="eye.fill" size={16} color={M.accent} />
          <Text className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            {t("educator.lessonEdit.previewTitle")}
          </Text>
        </View>
        <IconSymbol
          name={previewVisible ? "chevron.up" : "chevron.down"}
          size={14}
          color={M.muted}
        />
      </Pressable>
      {previewVisible && (
        <View
          className="mt-2 overflow-hidden rounded-2xl border"
          style={{ backgroundColor: M.card, borderColor: M.border }}
        >
          <LessonHero
            title={title || t("educator.lessonEdit.untitled")}
            overline={type ? type.toUpperCase() : "LESSON"}
            accentColor={M.accent}
          />
          {description ? (
            <View
              className="border-b px-4 pb-4"
              style={{ borderColor: M.border }}
            >
              <Text className="text-sm" style={{ color: M.sub }}>
                {description}
              </Text>
            </View>
          ) : null}
          {segments.some((s) => s.text.trim().length > 0) ? (
            <View className="px-4 py-3">
              <Text
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: M.muted }}
              >
                {t("review.transcript")}
              </Text>
              {segments
                .filter((s) => s.text.trim().length > 0)
                .map((s, i) => {
                  const previewTranslation = localize(
                    s.translation,
                    uiLanguage,
                  );
                  return (
                    <View key={s.uid} className={`${i > 0 ? "mt-3" : ""}`}>
                      <Text className="text-base" style={{ color: M.text }}>
                        {s.text}
                      </Text>
                      {previewTranslation ? (
                        <Text
                          className="mt-0.5 text-sm"
                          style={{ color: M.sub }}
                        >
                          {previewTranslation}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
            </View>
          ) : (
            <View className="px-4 py-6 items-center">
              <Text className="text-sm" style={{ color: M.muted }}>
                {t("educator.lessonEdit.noSegments")}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
