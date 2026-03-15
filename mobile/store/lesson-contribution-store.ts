import { create } from "zustand";
import { Audio } from "expo-av";

interface LessonContributionState {
  // Audio playback state (for local preview during transcript timing)
  audioUri: string | null;
  audioDuration: number;
  isPlaying: boolean;
  playbackPosition: number;
  _sound: Audio.Sound | null;
  _positionInterval: ReturnType<typeof setInterval> | null;

  // Recording state (for recording directly in the wizard)
  isRecording: boolean;
  recordingDuration: number;
  _recording: Audio.Recording | null;
  _durationInterval: ReturnType<typeof setInterval> | null;

  // Actions
  loadAudio: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (positionSeconds: number) => Promise<void>;
  getCurrentPosition: () => number;
  unload: () => Promise<void>;

  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  discardRecording: () => void;

  reset: () => void;
}

export const useLessonContributionStore = create<LessonContributionState>((set, get) => ({
  audioUri: null,
  audioDuration: 0,
  isPlaying: false,
  playbackPosition: 0,
  _sound: null,
  _positionInterval: null,

  isRecording: false,
  recordingDuration: 0,
  _recording: null,
  _durationInterval: null,

  loadAudio: async (uri: string) => {
    const { _sound, _positionInterval } = get();

    // Cleanup existing sound
    if (_positionInterval) clearInterval(_positionInterval);
    if (_sound) {
      try {
        await _sound.unloadAsync();
      } catch {}
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const duration =
      status.isLoaded && status.durationMillis ? status.durationMillis / 1000 : 0;

    sound.setOnPlaybackStatusUpdate((s) => {
      if (!s.isLoaded) return;
      if (s.didJustFinish) {
        set({ isPlaying: false, playbackPosition: 0 });
        const { _positionInterval } = get();
        if (_positionInterval) clearInterval(_positionInterval);
        set({ _positionInterval: null });
      }
    });

    set({ audioUri: uri, audioDuration: duration, _sound: sound, playbackPosition: 0 });
  },

  play: async () => {
    const { _sound } = get();
    if (!_sound) return;
    await _sound.playAsync();

    const interval = setInterval(async () => {
      const { _sound } = get();
      if (!_sound) return;
      const status = await _sound.getStatusAsync();
      if (status.isLoaded) {
        set({ playbackPosition: (status.positionMillis ?? 0) / 1000 });
      }
    }, 100);

    set({ isPlaying: true, _positionInterval: interval });
  },

  pause: async () => {
    const { _sound, _positionInterval } = get();
    if (_positionInterval) clearInterval(_positionInterval);
    if (_sound) await _sound.pauseAsync();
    set({ isPlaying: false, _positionInterval: null });
  },

  seekTo: async (positionSeconds: number) => {
    const { _sound } = get();
    if (!_sound) return;
    await _sound.setPositionAsync(positionSeconds * 1000);
    set({ playbackPosition: positionSeconds });
  },

  getCurrentPosition: () => get().playbackPosition,

  unload: async () => {
    const { _sound, _positionInterval } = get();
    if (_positionInterval) clearInterval(_positionInterval);
    if (_sound) {
      try {
        await _sound.unloadAsync();
      } catch {}
    }
    set({ _sound: null, _positionInterval: null, isPlaying: false, playbackPosition: 0 });
  },

  startRecording: async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") throw new Error("Microphone permission not granted");

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
    if (_durationInterval) clearInterval(_durationInterval);

    try {
      await _recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = _recording.getURI();
      set({ isRecording: false, _recording: null, _durationInterval: null });
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
    if (_recording) _recording.stopAndUnloadAsync().catch(() => {});
    set({
      isRecording: false,
      recordingDuration: 0,
      _recording: null,
      _durationInterval: null,
    });
  },

  reset: () => {
    const { _sound, _positionInterval, _recording, _durationInterval } = get();
    if (_positionInterval) clearInterval(_positionInterval);
    if (_durationInterval) clearInterval(_durationInterval);
    if (_sound) _sound.unloadAsync().catch(() => {});
    if (_recording) _recording.stopAndUnloadAsync().catch(() => {});
    set({
      audioUri: null,
      audioDuration: 0,
      isPlaying: false,
      playbackPosition: 0,
      _sound: null,
      _positionInterval: null,
      isRecording: false,
      recordingDuration: 0,
      _recording: null,
      _durationInterval: null,
    });
  },
}));
