/**
 * Episode style picker (`lessons.style`).
 *
 * Only meaningful for a season episode — it drives the style chip on the Series
 * screen. Ordinary lessons leave it unset. Labels come from `styleLabel()` so
 * the Studio and the learner-facing Series screen never drift apart.
 */
import type { LessonStyle } from "@/lib/hooks/educator/use-lessons";
import { styleLabel } from "@/lib/series-presentation";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

const STYLES: LessonStyle[] = ["skit", "immersive_story", "host_narrated"];

export function LessonStylePicker({
  value,
  onChange,
}: Readonly<{ value: LessonStyle | null; onChange: (style: LessonStyle | null) => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  const options: { key: LessonStyle | null; label: string }[] = [
    { key: null, label: t("educator.lessonEdit.styleNone") },
    ...STYLES.map((style) => ({ key: style, label: styleLabel(style) ?? style })),
  ];

  return (
    <View className="mt-3">
      <Text className="mb-1.5 text-xs font-semibold" style={{ color: M.sub }}>
        {t("educator.lessonEdit.styleLabel")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.key;
          return (
            <Pressable
              key={option.key ?? "none"}
              onPress={() => onChange(option.key)}
              className="rounded-full border px-3 py-1.5"
              style={
                active
                  ? { backgroundColor: M.accentGlow, borderColor: M.accentBorder }
                  : { backgroundColor: M.inputBg, borderColor: M.border }
              }
            >
              <Text className="text-xs font-semibold" style={{ color: active ? M.accent : M.sub }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-1.5 text-[11px]" style={{ color: M.muted }}>
        {t("educator.lessonEdit.styleHint")}
      </Text>
    </View>
  );
}
