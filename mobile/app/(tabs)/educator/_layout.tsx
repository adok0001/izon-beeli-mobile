import { AudioPlayer } from "@/components/audio/audio-player";
import { useAudioStore } from "@/store/audio-store";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";

export default function EducatorLayout() {
  const { currentTrackId } = useAudioStore();
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      {currentTrackId ? (
        <AudioPlayer
          compact
          position="top"
          onPress={() => router.push(`/lesson/${currentTrackId}`)}
        />
      ) : null}
      <Stack screenOptions={{ headerBackTitle: "Back" }} />
    </View>
  );
}
