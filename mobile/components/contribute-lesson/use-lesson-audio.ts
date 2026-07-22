import * as DocumentPicker from "expo-document-picker";
import type { ContributionStore } from "./types";

export interface LessonAudioActions {
  handlePickAudio: () => Promise<void>;
  handleRecord: () => Promise<void>;
}

export function useLessonAudio(
  store: ContributionStore,
  onError: (title: string, body: string) => void
): LessonAudioActions {
  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp4", "audio/m4a", "audio/wav", "audio/x-m4a"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await store.loadAudio(asset.uri);
    } catch {
      onError("Error", "Could not pick audio file.");
    }
  };

  const handleRecord = async () => {
    try {
      if (store.isRecording) {
        const uri = await store.stopRecording();
        if (uri) await store.loadAudio(uri);
      } else {
        await store.startRecording();
      }
    } catch {
      onError("Error", "Could not record audio.");
    }
  };

  return { handlePickAudio, handleRecord };
}
