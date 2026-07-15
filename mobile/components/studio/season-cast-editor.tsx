import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { CAST_HUES, type EducatorStoryCastMember } from "@/lib/hooks/educator/use-story-arcs";
import { useMuseumTheme } from "@/lib/use-museum-theme";

interface Props {
  cast: EducatorStoryCastMember[];
  onChange: (cast: EducatorStoryCastMember[]) => void;
}

/**
 * The season's recurring characters. `castId` is the stable handle a transcript
 * segment's `speaker` refers to, so the avatar and hue set here are what tint
 * that speaker's line in the learner's transcript.
 */
export function SeasonCastEditor({ cast, onChange }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  const update = (index: number, key: keyof EducatorStoryCastMember, value: string) => {
    onChange(cast.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  };

  const add = () => {
    onChange([...cast, { castId: "", name: "", role: "", avatar: "🙂", hue: "teal" }]);
  };

  const remove = (index: number) => {
    onChange(cast.filter((_, i) => i !== index));
  };

  const inputStyle = { backgroundColor: M.inputBg, color: M.inputText };

  return (
    <View className="mt-4 px-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-[1.5px]" style={{ color: M.muted }}>
          {t("educator.story.castTitle", { count: cast.length })}
        </Text>
        <Pressable onPress={add} className="flex-row items-center gap-1.5 active:opacity-70">
          <IconSymbol name="plus.circle.fill" size={16} color={M.accent} />
          <Text className="text-sm font-bold" style={{ color: M.accent }}>
            {t("educator.story.castAdd")}
          </Text>
        </Pressable>
      </View>

      <Text className="mb-3 text-xs" style={{ color: M.sub }}>
        {t("educator.story.castHint")}
      </Text>

      {cast.length === 0 ? (
        <View className="rounded-2xl border p-4" style={{ backgroundColor: M.card, borderColor: M.border }}>
          <Text className="text-sm" style={{ color: M.sub }}>
            {t("educator.story.castEmpty")}
          </Text>
        </View>
      ) : null}

      {cast.map((member, index) => (
        <View
          key={index}
          className="mb-2 rounded-2xl border p-3"
          style={{ backgroundColor: M.card, borderColor: M.border }}
        >
          <View className="flex-row items-center gap-2">
            <TextInput
              value={member.avatar}
              onChangeText={(v) => update(index, "avatar", v)}
              placeholder="🙂"
              placeholderTextColor={M.muted}
              className="w-12 rounded-lg px-2 py-2 text-center text-lg"
              style={inputStyle}
            />
            <TextInput
              value={member.name}
              onChangeText={(v) => update(index, "name", v)}
              placeholder={t("educator.story.castNamePlaceholder")}
              placeholderTextColor={M.muted}
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
            />
            <Pressable onPress={() => remove(index)} hitSlop={6} className="active:opacity-70">
              <IconSymbol name="trash" size={16} color={M.error} />
            </Pressable>
          </View>

          <TextInput
            value={member.role}
            onChangeText={(v) => update(index, "role", v)}
            placeholder={t("educator.story.castRolePlaceholder")}
            placeholderTextColor={M.muted}
            className="mt-2 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />

          <TextInput
            value={member.castId}
            onChangeText={(v) => update(index, "castId", v)}
            autoCapitalize="none"
            placeholder={t("educator.story.castIdPlaceholder")}
            placeholderTextColor={M.muted}
            className="mt-2 rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />

          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {CAST_HUES.map((hue) => {
              const accent = getAccent(hue as AccentHue);
              const active = member.hue === hue;
              return (
                <Pressable
                  key={hue}
                  onPress={() => update(index, "hue", hue)}
                  hitSlop={2}
                  accessibilityRole="button"
                  accessibilityLabel={hue}
                  accessibilityState={{ selected: active }}
                  className="h-7 w-7 items-center justify-center rounded-full border-2 active:opacity-70"
                  style={{
                    backgroundColor: accent.bg,
                    borderColor: active ? accent.solid : accent.border,
                  }}
                >
                  {active ? <IconSymbol name="checkmark" size={11} color={accent.solid} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
