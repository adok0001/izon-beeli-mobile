import { AudioPlayer } from "@/components/audio/audio-player";
import { StudioGate } from "@/components/studio/studio-gate";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";

function EducatorAudioBar() {
  const M = useMuseumTheme();
  const { currentTrackId, currentTrackRoute } = useAudioStore();
  const router = useRouter();

  if (!currentTrackId) return null;

  return (
    <View style={{ backgroundColor: M.ink }}>
      <AudioPlayer
        compact
        position="top"
        onPress={currentTrackRoute ? () => router.push(currentTrackRoute as Parameters<typeof router.push>[0]) : undefined}
      />
    </View>
  );
}

export default function EducatorLayout() {
  const M = useMuseumTheme();

  return (
    <StudioGate role="educator">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: M.ink },
        }}
      />
    </StudioGate>
  );
}
