import { AudioPlayer } from "@/components/audio/audio-player";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";

function EducatorAudioBar() {
  const M = useMuseumTheme();
  const { currentTrackId } = useAudioStore();
  const router = useRouter();

  if (!currentTrackId) return null;

  return (
    <View style={{ backgroundColor: M.ink }}>
      <AudioPlayer
        compact
        position="top"
        onPress={() => router.push(`/lesson/${currentTrackId}`)}
      />
    </View>
  );
}

export default function EducatorLayout() {
  const M = useMuseumTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: M.ink },
      }}
    />
  );
}
