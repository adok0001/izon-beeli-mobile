import { AudioPlayer } from "@/components/audio/audio-player";
import { useAudioStore } from "@/store/audio-store";
import { Header, getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";

function EducatorHeader({ back, navigation, options, route }: NativeStackHeaderProps) {
  const { currentTrackId } = useAudioStore();
  const router = useRouter();
  return (
    <View>
      <Header
        {...options}
        title={getHeaderTitle(options, route.name)}
        back={back}
        navigation={navigation as never}
      />
      {currentTrackId ? (
        <AudioPlayer
          compact
          position="top"
          onPress={() => router.push(`/lesson/${currentTrackId}`)}
        />
      ) : null}
    </View>
  );
}

export default function EducatorLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <EducatorHeader {...props} />,
        headerBackTitle: "Back",
      }}
    />
  );
}
