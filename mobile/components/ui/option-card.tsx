import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";

export interface OptionCardProps {
  icon: string;
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}

/** Selectable icon + label + detail card with a checkmark when active. */
export function OptionCard({ icon, label, detail, selected, onPress }: Readonly<OptionCardProps>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        borderWidth: 2,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: selected ? M.accentGlow : M.card,
        borderColor: selected ? M.accent : M.border,
      }}
      className="active:opacity-70"
    >
      <View
        style={{
          marginRight: 16,
          height: 48,
          width: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 24,
          backgroundColor: selected ? M.accent : M.border,
        }}
      >
        <IconSymbol name={icon as never} size={22} color={selected ? M.ink : M.sub} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: selected ? M.accent : M.text }}>{label}</Text>
        <Text style={{ fontSize: 13, color: M.sub }}>{detail}</Text>
      </View>
      {selected && <IconSymbol name="checkmark.circle.fill" size={22} color={M.accent} />}
    </Pressable>
  );
}
