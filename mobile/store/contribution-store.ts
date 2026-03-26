import { create } from "zustand";
import { Audio } from "expo-av";

interface ContributionState {
  // Recording state
  isRecording: boolean;
  isPlaying: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  _recording: Audio.Recording | null;
  _playback: Audio.Sound | null;
  _durationInterval: ReturnType<typeof setInterval> | null;

  // Recording actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  discardRecording: () => void;
  playRecording: () => Promise<void>;
  stopPlayback: () => Promise<void>;
}

export const useContributionStore = create<ContributionState>((set, get) => ({
  isRecording: false,
  isPlaying: false,
  recordingDuration: 0,
  recordingUri: null,
  _recording: null,
  _playback: null,
  _durationInterval: null,

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
    const { _recording, _playback, _durationInterval } = get();
    if (_durationInterval) clearInterval(_durationInterval);
    if (_recording) {
      _recording.stopAndUnloadAsync().catch(() => {});
    }
    if (_playback) {
      _playback.unloadAsync().catch(() => {});
    }
    set({
      isRecording: false,
      isPlaying: false,
      recordingDuration: 0,
      recordingUri: null,
      _recording: null,
      _playback: null,
      _durationInterval: null,
    });
  },

  playRecording: async () => {
    const { recordingUri, _playback, isPlaying } = get();
    if (!recordingUri || isPlaying) return;

    if (_playback) {
      await _playback.unloadAsync().catch(() => {});
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      set({ isPlaying: true, _playback: sound });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          set({ isPlaying: false, _playback: null });
        }
      });
    } catch {
      set({ isPlaying: false, _playback: null });
    }
  },

  stopPlayback: async () => {
    const { _playback } = get();
    if (_playback) {
      await _playback.stopAsync().catch(() => {});
      await _playback.unloadAsync().catch(() => {});
    }
    set({ isPlaying: false, _playback: null });
  },
}));
