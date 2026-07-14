/**
 * Attach culture notes (cultural_content) to a lesson, in tap order.
 * Only meaningful in edit mode — a brand-new lesson has no id to attach against.
 */
import { useCulturalItems } from "@/lib/hooks/use-educator-panel";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";

export /** Lets an educator pick which of the language's cultural_content entries
 * surface on this lesson, in tap order. Only meaningful once a lesson exists
 * (edit mode) — a brand-new lesson has no id to attach against yet. */
function CulturalContentSection({
  languageId,
  selectedIds,
  onChange,
}: Readonly<{ languageId: string; selectedIds: string[]; onChange: (ids: string[]) => void }>) {
  const M = useMuseumTheme();
  const { data: items = [] } = useCulturalItems(languageId);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <View className="mt-4 px-5">
      <View className="rounded-2xl p-4" style={{ backgroundColor: M.card, borderWidth: 1, borderColor: M.border }}>
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.2px]" style={{ color: M.muted }}>
          Culture Notes ({selectedIds.length})
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
              const position = selectedIds.indexOf(item.id);
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
                  <Text className="text-sm">{item.imageEmoji}</Text>
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
      </View>
    </View>
  );
}
