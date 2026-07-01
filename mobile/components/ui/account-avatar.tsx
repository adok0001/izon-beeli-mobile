import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Image } from "expo-image";
import { Text, View } from "react-native";

interface AccountAvatarProps {
  imageUrl?: string | null;
  hasImage?: boolean;
  name?: string | null;
  size?: number;
}

/** Real Clerk account photo when available, otherwise a first-initial fallback. */
export function AccountAvatar({ imageUrl, hasImage, name, size = 46 }: Readonly<AccountAvatarProps>) {
  const M = useMuseumTheme();
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: M.accentGlow,
        borderWidth: 1,
        borderColor: M.accentBorder,
      }}
    >
      {hasImage && imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        <Text style={{ color: M.accent, fontWeight: "800", fontSize: size * 0.42 }}>{initial}</Text>
      )}
    </View>
  );
}
