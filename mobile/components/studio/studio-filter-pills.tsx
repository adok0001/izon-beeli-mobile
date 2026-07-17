import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, ScrollView, Text, View } from "react-native";

export interface StudioFilterOption<T extends string> {
  id: T;
  label: string;
  /** Per-option accent (e.g. category color-coding). Defaults to the theme accent. */
  color?: string;
}

/**
 * The standard Studio filter-chip row (All / Type A / Type B / ...). Used for
 * content-type filters, language pickers, and status filters alike — anywhere
 * a screen lets the admin narrow a list to one of a fixed set of options.
 */
export function StudioFilterPills<T extends string>({
  options,
  value,
  onChange,
  scrollable,
}: Readonly<{
  options: StudioFilterOption<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Wrap in a horizontal ScrollView instead of a wrapping row — for long option lists. */
  scrollable?: boolean;
}>) {
  const M = useMuseumTheme();

  const pills = options.map((opt) => {
    const active = value === opt.id;
    const color = opt.color ?? M.accent;
    return (
      <Pressable
        key={opt.id}
        onPress={() => onChange(opt.id)}
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: active ? `${color}18` : M.card,
          borderWidth: 1,
          borderColor: active ? `${color}60` : M.border,
        }}
        className="active:opacity-80"
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: active ? color : M.sub }}>
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {pills}
      </ScrollView>
    );
  }

  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{pills}</View>;
}
