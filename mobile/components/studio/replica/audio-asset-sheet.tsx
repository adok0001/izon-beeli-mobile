import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMediaAssets } from "@/lib/hooks/use-media-assets";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { ReplicaSheetShell } from "./replica-field-sheet";

export type AudioAssetSaveInput = { kind: "file"; uri: string } | { kind: "url"; url: string };

interface Props {
  visible: boolean;
  title: string;
  currentUrl?: string | null;
  /** Owned by the calling field, which also closes the sheet once a save lands. */
  saving?: boolean;
  onClose: () => void;
  onSave: (input: AudioAssetSaveInput) => void | Promise<void>;
}

/**
 * Record / pick-file / pick-from-media-library / play, for the `audio-asset`
 * ReplicaField variant. Reuses the recording pattern from
 * app/(tabs)/educator/lesson-edit.tsx's RecordButton and the multipart-upload
 * shape already proven in use-dictionary.ts.
 *
 * Unlike the text editors this has no Save button — each action *is* the
 * commit, so there is nothing to confirm.
 */
export function AudioAssetSheet({ visible, title, currentUrl, saving, onClose, onSave }: Props) {
  const M = useMuseumTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const { data: library } = useMediaAssets("audio");

  // Keep a ref alongside the state so unmount cleanup sees the live recording
  // without making the effect depend on it (which would tear down on every change).
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(rec);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    if (uri) await onSave({ kind: "file", uri });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.canceled || !result.assets?.[0]) return;
    await onSave({ kind: "file", uri: result.assets[0].uri });
  };

  const playCurrent = async () => {
    if (!currentUrl) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: currentUrl });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlaying(false);
      });
      setPlaying(true);
      await sound.playAsync();
    } catch {
      setPlaying(false);
    }
  };

  return (
    <ReplicaSheetShell visible={visible} title={title} busy={saving || isRecording} onClose={onClose}>
      {currentUrl ? (
        <Pressable
          onPress={playCurrent}
          disabled={playing}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.bg,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <IconSymbol name={playing ? "speaker.wave.2.fill" : "play.fill"} size={16} color={M.accent} />
          <Text style={{ fontSize: 14, color: M.text }}>Play current audio</Text>
        </Pressable>
      ) : null}

      {saving ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator color={M.accent} />
        </View>
      ) : (
        <>
          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
              paddingVertical: 12,
              marginBottom: 8,
              backgroundColor: isRecording ? M.error : M.accentGlow,
              borderWidth: 1,
              borderColor: isRecording ? M.error : M.accentBorder,
            }}
          >
            <IconSymbol name="mic.fill" size={16} color={isRecording ? M.ink : M.accent} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: isRecording ? M.ink : M.accent }}>
              {isRecording ? "Stop recording" : "Record new"}
            </Text>
          </Pressable>

          <Pressable
            onPress={pickFile}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 12,
              paddingVertical: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: M.border,
            }}
          >
            <IconSymbol name="doc.text.fill" size={16} color={M.text} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.text }}>Choose file</Text>
          </Pressable>

          {!!library?.assets?.length && (
            <Pressable onPress={() => setLibraryOpen((o) => !o)} style={{ paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: M.accent }}>
                {libraryOpen ? "Hide media library" : `Pick from media library (${library.assets.length})`}
              </Text>
            </Pressable>
          )}
          {libraryOpen && (
            <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
              {library?.assets.map((asset) => (
                <Pressable
                  key={asset.id}
                  onPress={() => onSave({ kind: "url", url: asset.url })}
                  style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: M.border }}
                >
                  <Text style={{ fontSize: 13, color: M.text }} numberOfLines={1}>
                    {asset.filename}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </ReplicaSheetShell>
  );
}
