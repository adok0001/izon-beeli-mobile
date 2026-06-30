import { IconSymbol } from "@/components/ui/icon-symbol";
import { PROFILE_AVATARS } from "@/constants/profile-avatars";
import { View } from "react-native";

interface AvatarCircleProps {
  avatarId: string;
  size: number;
  selected?: boolean;
  accentColor?: string;
}

export function AvatarCircle({ avatarId, size, selected, accentColor }: Readonly<AvatarCircleProps>) {
  const avatar = PROFILE_AVATARS.find((a) => a.id === avatarId) ?? PROFILE_AVATARS[0];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: avatar.bg,
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? (accentColor ?? "#C4862A") : "transparent",
        shadowColor: avatar.bg,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: selected ? 0.6 : 0,
        shadowRadius: 10,
        elevation: selected ? 6 : 0,
      }}
    >
      <IconSymbol name={avatar.icon as any} size={size * 0.42} color={avatar.fg} />
    </View>
  );
}
