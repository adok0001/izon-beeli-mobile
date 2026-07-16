import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter, type ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Route-level error boundary for the discover activities and culture screens.
 *
 * Expo Router renders a route's named `ErrorBoundary` export in place of the
 * screen when its render throws. Screens re-export this so a single broken
 * activity shows a recoverable, themed message — and the user knows which
 * screen failed — instead of the global boundary taking down the whole app.
 *
 * Note: React error boundaries only catch render/lifecycle errors, not errors
 * thrown inside async callbacks (e.g. a failed network submit). Those still
 * need to be surfaced with explicit UI state in the screen itself.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const M = useMuseumTheme();
  const router = useRouter();

  useEffect(() => {
    console.error("[ScreenErrorBoundary]", error);
  }, [error]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${M.accent}15`,
            borderWidth: 1,
            borderColor: `${M.accent}30`,
          }}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={32} color={M.warning} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: M.text, textAlign: "center" }}>
          This activity hit a snag
        </Text>
        <Text
          style={{ fontSize: 14, color: M.sub, textAlign: "center", lineHeight: 20 }}
          numberOfLines={4}
        >
          {error?.message || "Something went wrong while loading this activity."}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <Pressable
            onPress={retry}
            style={{ borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, backgroundColor: M.accent }}
            className="active:opacity-80"
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.ink }}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/learn"))}
            style={{ borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, borderWidth: 1, borderColor: M.border }}
            className="active:opacity-70"
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>Go back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
