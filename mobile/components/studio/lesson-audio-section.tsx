/**
 * Audio capture + playback for the Studio lesson editor: preview scrubber,
 * in-app recorder, and the upload/replace affordance.
 */
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useAudioStore } from "@/store/audio-store";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

export function PlaybackButton({ source, onPositionChange }: Readonly<{ source?: string | null; onPositionChange?: (posSeconds: number) => void }>) {
  const M = useMuseumTheme();
  const { currentTrackId, isPlaying, isLoading, progress, duration, togglePlayback, loadAndPlay } = useAudioStore();

  const isThisTrack = !!source && currentTrackId === source;
  const thisIsPlaying = isThisTrack && isPlaying;
  const thisIsLoading = isThisTrack && isLoading;
  const positionMs = isThisTrack ? progress * 1000 : 0;
  const durationMs = isThisTrack ? duration * 1000 : 0;
  const progressRatio = durationMs > 0 ? positionMs / durationMs : 0;

  useEffect(() => {
    if (isThisTrack) onPositionChange?.(progress);
  }, [isThisTrack, progress, onPositionChange]);

  if (!source) return null;

  const handleToggle = async () => {
    if (!isThisTrack) {
      await loadAndPlay(source, source, "Lesson Preview");
    } else {
      await togglePlayback();
    }
  };

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <View
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: M.successBg, borderColor: M.successBorder }}
    >
      <Pressable
        onPress={handleToggle}
        className="flex-row items-center gap-2 px-3 py-2.5 active:opacity-70"
      >
        {thisIsLoading ? (
          <ActivityIndicator size="small" color={getAccent("teal").solid} />
        ) : (
          <IconSymbol
            name={thisIsPlaying ? "pause.circle.fill" : "play.circle.fill"}
            size={20}
            color={getAccent("teal").solid}
          />
        )}
        <Text className="flex-1 text-sm font-semibold" style={{ color: M.success }}>
          {thisIsPlaying ? "Pause" : "Play audio"}
        </Text>
        {durationMs > 0 ? (
          <Text className="text-xs" style={{ color: M.success }}>
            {formatMs(positionMs)} / {formatMs(durationMs)}
          </Text>
        ) : null}
      </Pressable>
      {durationMs > 0 ? (
        <View className="mx-3 mb-2 h-1 overflow-hidden rounded-full" style={{ backgroundColor: M.successBorder }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.round(progressRatio * 100)}%`, backgroundColor: M.success }}
          />
        </View>
      ) : null}
    </View>
  );
}

function RecordButton({
  isDisabled,
  onRecorded,
}: Readonly<{ isDisabled: boolean; onRecorded: (uri: string) => void }>) {
  const M = useMuseumTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Microphone access is needed to record audio.");
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(rec);
    setIsRecording(true);
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((prev) => prev + 1000), 1000);
  };

  const stopRecording = async () => {
    if (!recording) return;
    stopTimer();
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    if (uri) onRecorded(uri);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <Pressable
      onPress={isRecording ? stopRecording : startRecording}
      disabled={isDisabled && !isRecording}
      className={`flex-row items-center justify-center rounded-xl py-3 active:opacity-70 disabled:opacity-40 ${
        isRecording ? "" : "border border-dashed"
      }`}
      style={
        isRecording
          ? { backgroundColor: M.error }
          : { backgroundColor: M.errorBg, borderColor: M.errorBorder }
      }
    >
      <IconSymbol
        name={isRecording ? "stop.circle.fill" : "mic.fill"}
        size={16}
        color={isRecording ? M.parchment : M.error}
      />
      <Text className="ml-2 text-sm font-semibold" style={{ color: isRecording ? M.parchment : M.error }}>
        {isRecording ? `Stop  ${formatTime(elapsedMs)}` : "Record audio"}
      </Text>
    </Pressable>
  );
}

export function AudioSection({
  isEditMode,
  audioUrl,
  audioUri,
  isPending,
  onReplace,
  onPick,
  onRecord,
  onPositionChange,
  loadingLabel,
}: Readonly<{
  isEditMode: boolean;
  audioUrl?: string | null;
  audioUri?: string;
  isPending: boolean;
  onReplace: (uri: string) => void;
  onPick: () => void;
  onRecord: (uri: string) => void;
  onPositionChange?: (posSeconds: number) => void;
  loadingLabel: string;
}>) {
  const M = useMuseumTheme();
  const [recordedUri, setRecordedUri] = useState<string | undefined>(undefined);

  const pickAndReplace = () => {
    DocumentPicker.getDocumentAsync({ type: ["audio/*"], copyToCacheDirectory: true, multiple: false })
      .then((r) => { if (!r.canceled && r.assets[0]?.uri) onReplace(r.assets[0].uri); })
      .catch(() => {});
  };

  const handleRecorded = (uri: string) => {
    setRecordedUri(uri);
    if (isEditMode) {
      onReplace(uri);
    } else {
      onRecord(uri);
    }
  };

  const playbackSource = isEditMode ? audioUrl : (audioUri ?? recordedUri);
  const hasAudio = !!playbackSource;

  let uploadLabel: string;
  if (isEditMode) {
    uploadLabel = audioUrl ? "Replace file" : "Upload file";
  } else {
    uploadLabel = audioUri ? "Change file" : "Upload file";
  }

  return (
    <View className="gap-2">
      {/* Playback */}
      {hasAudio ? <PlaybackButton source={playbackSource} onPositionChange={onPositionChange} /> : null}

      {/* Record */}
      <RecordButton isDisabled={isPending} onRecorded={handleRecorded} />

      {/* Upload / replace file */}
      <Pressable
        onPress={isEditMode ? pickAndReplace : onPick}
        disabled={isPending}
        className="flex-row items-center justify-center rounded-xl border border-dashed py-3 active:opacity-70 disabled:opacity-40"
        style={{ backgroundColor: M.inputBg, borderColor: M.border }}
      >
        <IconSymbol name="square.and.arrow.up" size={16} color={M.accent} />
        <Text className="ml-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
          {isPending ? loadingLabel : uploadLabel}
        </Text>
      </Pressable>
    </View>
  );
}
