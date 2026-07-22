import { tWithVars } from "@/lib/i18n-dynamic";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ContributionStore } from "./types";
import { formatTime } from "./utils";

type AudioStepProps = Readonly<{
  store: ContributionStore;
  onPickAudio: () => void;
  onRecord: () => void;
}>;

export function AudioStep({ store, onPickAudio, onRecord }: AudioStepProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();

  return (
    <View>
      <Text className="mb-1 text-xl font-bold text-neutral-900 dark:text-white">
        {t("contribute.addAudio")}
      </Text>
      <Text className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
        {t("contribute.addAudioDesc")}
      </Text>

      {store.audioUri ? (
        <View className="items-center rounded-2xl bg-green-50 p-8 dark:bg-green-950">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <IconSymbol name="checkmark" size={28} color={M.success} />
          </View>
          <Text className="text-lg font-bold text-green-700 dark:text-green-400">
            {t("contribute.audioReady")}
          </Text>
          {store.audioDuration > 0 && (
            <Text className="mt-1 text-sm text-green-600 dark:text-green-500">
              {formatTime(store.audioDuration)}
            </Text>
          )}
          {/* Inline preview */}
          <Pressable
            onPress={store.isPlaying ? store.pause : store.play}
            className="mt-4 flex-row items-center rounded-full bg-green-600 px-5 py-2.5"
          >
            <IconSymbol
              name={store.isPlaying ? "pause.fill" : "play.fill"}
              size={14}
              color="white"
            />
            <Text className="ml-2 text-sm font-semibold text-white">
              {store.isPlaying ? t("lesson.pause") : t("contribute.preview")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              store.unload();
              store.reset();
            }}
            className="mt-3"
          >
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("contribute.chooseDifferentAudio")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-3">
          <Pressable
            onPress={onPickAudio}
            className="flex-row items-center rounded-2xl bg-blue-50 p-5 active:opacity-80 dark:bg-blue-950"
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <IconSymbol name="folder.fill" size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {t("contribute.chooseFile")}
              </Text>
              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {t("contribute.chooseFileFormats")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={getAccent("blue").solid} />
          </Pressable>

          <Pressable
            onPress={onRecord}
            className={`flex-row items-center rounded-2xl p-5 active:opacity-80 ${
              store.isRecording
                ? "bg-red-50 dark:bg-red-950"
                : "bg-neutral-50 dark:bg-neutral-800"
            }`}
          >
            <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
              store.isRecording ? "bg-red-500" : "bg-red-100 dark:bg-red-900"
            }`}>
              {store.isRecording ? (
                <View className="h-5 w-5 rounded-sm bg-white" />
              ) : (
                <IconSymbol name="mic.fill" size={22} color={M.error} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white">
                {store.isRecording ? t("contribute.stopRecording") : t("contribute.recordAudio")}
              </Text>
              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {store.isRecording
                  ? tWithVars(t, "contribute.recordingProgress", { duration: store.recordingDuration })
                  : t("contribute.tapToStartRecording")}
              </Text>
            </View>
            {store.isRecording && (
              <View className="h-3 w-3 rounded-full bg-red-500" />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
