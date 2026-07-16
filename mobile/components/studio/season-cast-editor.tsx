import { Pressable, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { deriveId } from "@/lib/studio/derive-id";
import { CAST_HUES, type EducatorStoryCastMember } from "@/lib/hooks/educator/use-story-arcs";
import { useMuseumTheme } from "@/lib/use-museum-theme";

interface Props {
  cast: EducatorStoryCastMember[];
  onChange: (cast: EducatorStoryCastMember[]) => void;
}

/**
 * The season's recurring characters. `castId` is the stable handle a transcript
 * segment's `speaker` refers to, so the avatar and hue set here are what tint
 * that speaker's line in the learner's transcript. The id auto-derives from the
 * name (once, on blur, while still empty — see `deriveId`) and then freezes, so
 * a later rename can't silently break a transcript link; the raw id sits behind
 * an "Advanced" chip for the rare deliberate edit.
 */
export function SeasonCastEditor({ cast, onChange }: Props) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  // Which rows have the raw id field revealed. Cosmetic, index-keyed.
  const [idOpen, setIdOpen] = useState<Set<number>>(new Set());

  const update = (index: number, key: keyof EducatorStoryCastMember, value: string) => {
    onChange(cast.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  };

  // On blur of the name, seed the id from it — but only while the id is still
  // empty, so an established id never re-derives out from under its references.
  const deriveIfEmpty = (index: number) => {
    const m = cast[index];
    if (m.castId.trim() || !m.name.trim()) return;
    const taken = cast.filter((_, i) => i !== index).map((c) => c.castId).filter(Boolean);
    update(index, "castId", deriveId(m.name, taken, "cast"));
  };

  const add = () => {
    onChange([...cast, { castId: "", name: "", role: "", hue: "teal" }]);
  };

  const remove = (index: number) => {
    onChange(cast.filter((_, i) => i !== index));
  };

  // Case-insensitive duplicate castIds within the season — the server rejects
  // these (story-arcs cast guard); surface them inline so the save doesn't fail.
  const duplicateIds = useMemo(() => {
    const seen = new Map<string, number>();
    const dups = new Set<string>();
    for (const m of cast) {
      const id = m.castId.trim().toLowerCase();
      if (!id) continue;
      seen.set(id, (seen.get(id) ?? 0) + 1);
      if (seen.get(id)! > 1) dups.add(id);
    }
    return dups;
  }, [cast]);

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

      {cast.map((member, index) => {
        const isDuplicate = !!member.castId.trim() && duplicateIds.has(member.castId.trim().toLowerCase());
        const open = idOpen.has(index);
        return (
          <View
            key={index}
            className="mb-2 rounded-2xl border p-3"
            style={{ backgroundColor: M.card, borderColor: isDuplicate ? M.errorBorder : M.border }}
          >
            <View className="flex-row items-center gap-2">
              <TextInput
                value={member.name}
                onChangeText={(v) => update(index, "name", v)}
                onBlur={() => deriveIfEmpty(index)}
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

            {/* Stable id — collapsed to a chip; the name seeds it automatically. */}
            {open ? (
              <View className="mt-2">
                <TextInput
                  value={member.castId}
                  onChangeText={(v) => update(index, "castId", v)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t("educator.story.castIdPlaceholder")}
                  placeholderTextColor={M.muted}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ ...inputStyle, borderWidth: 1, borderColor: isDuplicate ? M.errorBorder : M.inputBorder }}
                />
                {isDuplicate ? (
                  <Text className="mt-1 text-[11px] font-semibold" style={{ color: M.error }}>
                    {t("educator.story.castIdDuplicate", { defaultValue: "Duplicate id — each cast member needs a unique id." })}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Pressable
                onPress={() => setIdOpen((prev) => new Set(prev).add(index))}
                className="mt-2 flex-row items-center gap-1.5 self-start active:opacity-70"
              >
                <Text className="text-[11px]" style={{ color: isDuplicate ? M.error : M.muted }}>
                  {t("educator.story.castIdChip", { defaultValue: "id" })}:{" "}
                  <Text className="font-bold" style={{ color: isDuplicate ? M.error : M.sub }}>
                    {member.castId || "—"}
                  </Text>
                  {"  ·  "}
                  {t("common.edit")}
                </Text>
                {isDuplicate ? <IconSymbol name="exclamationmark.triangle.fill" size={11} color={M.error} /> : null}
              </Pressable>
            )}

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
        );
      })}
    </View>
  );
}
