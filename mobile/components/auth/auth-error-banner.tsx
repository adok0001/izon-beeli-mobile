import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, View } from "react-native";

export function AuthErrorBanner({ message }: { message: string }) {
  const M = useMuseumTheme();
  if (!message) return null;

  return (
    <View
      style={{
        marginBottom: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: M.errorBg,
        borderWidth: 1,
        borderColor: M.errorBorder,
      }}
    >
      <Text style={{ textAlign: "center", fontSize: 13, color: M.error }}>{message}</Text>
    </View>
  );
}
