import { IconSymbol } from "@/components/ui/icon-symbol";
import { Pressable, Text, View } from "react-native";
import type { ContributionStore } from "./types";
import { formatTime } from "./utils";

type TranscriptPlaybackBarProps = Readonly<{
  store: ContributionStore;
}>;

export function TranscriptPlaybackBar({ store }: TranscriptPlaybackBarProps) {
  return (
    <View className="mb-5 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
      <View className="flex-row items-center">
        <Pressable
          onPress={store.isPlaying ? store.pause : store.play}
          className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-500 active:opacity-80"
        >
          <IconSymbol
            name={store.isPlaying ? "pause.fill" : "play.fill"}
            size={18}
            color="white"
          />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
              {formatTime(store.playbackPosition)}
            </Text>
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              {formatTime(store.audioDuration)}
            </Text>
          </View>
          <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <View
              className="h-2 rounded-full bg-blue-500"
              style={{
                width: store.audioDuration > 0
                  ? `${(store.playbackPosition / store.audioDuration) * 100}%`
                  : "0%",
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
