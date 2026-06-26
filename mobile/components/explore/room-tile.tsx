import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

interface RoomTileProps {
  kicker: string;
  title: string;
  subtitle: string;
  glyph: string;
  color: string;
  gradient: [string, string];
  onPress: () => void;
}

export function RoomTile({ kicker, title, subtitle, glyph, color, gradient, onPress }: RoomTileProps) {
  const M = useMuseumTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="active:opacity-80"
    >
      <LinearGradient
        colors={gradient}
        style={{
          borderRadius: 18,
          height: 118,
          padding: 18,
          justifyContent: "flex-end",
          overflow: "hidden",
          position: "relative",
          borderWidth: 1,
          borderColor: `${color}22`,
        }}
      >
        {/* Background glyph */}
        <Text
          style={{ fontSize: 72, position: "absolute", top: -10, right: -4, opacity: 0.15 }}
        >
          {glyph}
        </Text>

        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.8, color, marginBottom: 3 }}>
          {kicker}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "800", color: M.parchment }}>
          {title}
        </Text>
        <Text style={{ fontSize: 11, color: M.sub, marginTop: 2 }}>
          {subtitle}
        </Text>

        {/* Enter arrow */}
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: 18,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${color}18`,
            borderWidth: 1,
            borderColor: `${color}35`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="chevron.right" size={14} color={color} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
