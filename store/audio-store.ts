import { create } from "zustand";
import { Audio, AVPlaybackStatus, AVPlaybackSource } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AudioSource } from "@/types";

type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

const RESUME_KEY = "audio-store-resume";

interface ResumeState {
  lessonId: string;
  positionSeconds: number;
}

interface AudioState {
  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  progress: number; // seconds
  duration: number; // seconds
  playbackSpeed: PlaybackSpeed;

  // Resume state (persisted)
  resumeState: ResumeState | null;

  // Internal
  _sound: Audio.Sound | null;

  // Actions
  loadAndPlay: (trackId: string, source: AudioSource, title?: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  setSpeed: (speed: PlaybackSpeed) => void;
  reset: () => Promise<void>;
  loadResumeState: () => Promise<void>;
  saveResumeState: (lessonId: string, positionSeconds: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  currentTrackId: null,
  currentTrackTitle: null,
  progress: 0,
  duration: 0,
  playbackSpeed: 1,
  resumeState: null,
  _sound: null,

  loadAndPlay: async (trackId, source, title) => {
    const { _sound: currentSound, currentTrackId } = get();

    // If same track, just resume
    if (currentTrackId === trackId && currentSound) {
      await currentSound.playAsync();
      set({ isPlaying: true });
      return;
    }

    // Unload previous sound
    if (currentSound) {
      await currentSound.unloadAsync();
    }

    set({ isLoading: true, currentTrackId: trackId, currentTrackTitle: title ?? null });

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Support both URI strings and require() module IDs
      const playbackSource: AVPlaybackSource =
        typeof source === "number" ? source : { uri: source };

      const { sound } = await Audio.Sound.createAsync(
        playbackSource,
        { shouldPlay: true, rate: get().playbackSpeed },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          const positionSeconds = (status.positionMillis ?? 0) / 1000;
          set({
            progress: positionSeconds,
            duration: (status.durationMillis ?? 0) / 1000,
            isPlaying: status.isPlaying,
          });
          if (status.isPlaying) {
            get().saveResumeState(trackId, positionSeconds);
          }
          if (status.didJustFinish) {
            set({ isPlaying: false, progress: 0 });
          }
        }
      );

      set({ _sound: sound, isLoading: false, isPlaying: true });
    } catch (error) {
      console.error("Error loading audio:", error);
      set({ isLoading: false, currentTrackId: null, currentTrackTitle: null });
    }
  },

  play: async () => {
    const { _sound } = get();
    if (_sound) {
      await _sound.playAsync();
      set({ isPlaying: true });
    }
  },

  pause: async () => {
    const { _sound, currentTrackId, progress } = get();
    if (_sound) {
      await _sound.pauseAsync();
      set({ isPlaying: false });
      if (currentTrackId) {
        get().saveResumeState(currentTrackId, progress);
      }
    }
  },

  togglePlayback: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await get().pause();
    } else {
      await get().play();
    }
  },

  seekTo: async (seconds) => {
    const { _sound } = get();
    if (_sound) {
      await _sound.setPositionAsync(seconds * 1000);
      set({ progress: seconds });
    }
  },

  skipForward: async (seconds = 10) => {
    const { progress, duration } = get();
    const newPos = Math.min(progress + seconds, duration);
    await get().seekTo(newPos);
  },

  skipBackward: async (seconds = 10) => {
    const { progress } = get();
    const newPos = Math.max(progress - seconds, 0);
    await get().seekTo(newPos);
  },

  setSpeed: (speed) => {
    const { _sound } = get();
    if (_sound) {
      _sound.setRateAsync(speed, true);
    }
    set({ playbackSpeed: speed });
  },

  reset: async () => {
    const { _sound } = get();
    if (_sound) {
      await _sound.unloadAsync();
    }
    set({
      isPlaying: false,
      isLoading: false,
      currentTrackId: null,
      currentTrackTitle: null,
      progress: 0,
      duration: 0,
      _sound: null,
    });
  },

  loadResumeState: async () => {
    try {
      const stored = await AsyncStorage.getItem(RESUME_KEY);
      if (stored) {
        set({ resumeState: JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  },

  saveResumeState: (lessonId, positionSeconds) => {
    const state: ResumeState = { lessonId, positionSeconds };
    set({ resumeState: state });
    AsyncStorage.setItem(RESUME_KEY, JSON.stringify(state)).catch(() => {});
  },
}));
