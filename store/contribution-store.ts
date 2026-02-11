import { create } from "zustand";
import { Audio } from "expo-av";
import type { Contribution, ContributionType } from "@/types";

interface ContributionState {
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  _recording: Audio.Recording | null;
  _durationInterval: ReturnType<typeof setInterval> | null;

  // Form state
  contributions: Contribution[];

  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  discardRecording: () => void;

  // CRUD actions
  addContribution: (
    type: ContributionType,
    language: string,
    title: string,
    description: string,
    audioUri?: string,
    text?: string
  ) => void;
  deleteContribution: (id: string) => void;
}

export const useContributionStore = create<ContributionState>((set, get) => ({
  isRecording: false,
  recordingDuration: 0,
  recordingUri: null,
  _recording: null,
  _durationInterval: null,
  contributions: [],

  startRecording: async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Microphone permission not granted");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      const interval = setInterval(() => {
        set((state) => ({ recordingDuration: state.recordingDuration + 1 }));
      }, 1000);

      set({
        isRecording: true,
        recordingDuration: 0,
        recordingUri: null,
        _recording: recording,
        _durationInterval: interval,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  },

  stopRecording: async () => {
    const { _recording, _durationInterval } = get();
    if (!_recording) return null;

    if (_durationInterval) {
      clearInterval(_durationInterval);
    }

    try {
      await _recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = _recording.getURI();
      set({
        isRecording: false,
        recordingUri: uri,
        _recording: null,
        _durationInterval: null,
      });
      return uri;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      set({ isRecording: false, _recording: null, _durationInterval: null });
      return null;
    }
  },

  discardRecording: () => {
    const { _recording, _durationInterval } = get();
    if (_durationInterval) clearInterval(_durationInterval);
    if (_recording) {
      _recording.stopAndUnloadAsync().catch(() => {});
    }
    set({
      isRecording: false,
      recordingDuration: 0,
      recordingUri: null,
      _recording: null,
      _durationInterval: null,
    });
  },

  addContribution: (type, language, title, description, audioUri, text) =>
    set((state) => ({
      contributions: [
        {
          id: `contrib-${Date.now()}`,
          type,
          language,
          title,
          description,
          audioUri,
          text,
          status: "submitted",
          createdAt: new Date().toISOString(),
        },
        ...state.contributions,
      ],
      recordingUri: null,
      recordingDuration: 0,
    })),

  deleteContribution: (id) =>
    set((state) => ({
      contributions: state.contributions.filter((c) => c.id !== id),
    })),
}));
