import { create } from "zustand";
import { Audio, AVPlaybackStatus, AVPlaybackSource } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AudioSource } from "@/types";
import { useLanguageStore } from "./language-store";

type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

const RESUME_KEY = "audio-store-resume";

function getAudioErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Network-level failures (DNS, offline, timeout) surface as NSURLErrorDomain
  if (/NSURLErrorDomain|-1001|-1003|-1009/.test(message)) {
    return "Can't reach this audio source. Check your connection or the link.";
  }
  // AVFoundation rejects non-audio responses (e.g. an HTML page) or unsupported formats
  if (/AVFoundationErrorDomain|-11850|-11828|-11800/.test(message)) {
    return "This link isn't a playable audio file.";
  }
  return "Couldn't play this audio. Please try again.";
}

interface ResumeState {
  lessonId: string;
  positionSeconds: number;
  languageId: string;
}

interface AudioState {
  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentTrackRoute: string | null;
  progress: number; // seconds
  duration: number; // seconds
  playbackSpeed: PlaybackSpeed;
  error: string | null;

  // Resume state (persisted)
  resumeState: ResumeState | null;

  // Internal
  _sound: Audio.Sound | null;

  // Shadow loop state
  shadowSegment: { startTime: number; endTime: number } | null;

  // Actions
  loadAndPlay: (trackId: string, source: AudioSource, title?: string, route?: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  setSpeed: (speed: PlaybackSpeed) => void;
  setShadowLoop: (segment: { startTime: number; endTime: number } | null) => void;
  reset: () => Promise<void>;
  loadResumeState: () => Promise<void>;
  saveResumeState: (lessonId: string, positionSeconds: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  isLoading: false,
  currentTrackId: null,
  currentTrackTitle: null,
  currentTrackRoute: null,
  progress: 0,
  duration: 0,
  playbackSpeed: 1,
  error: null,
  resumeState: null,
  shadowSegment: null,
  _sound: null,

  loadAndPlay: async (trackId, source, title, route) => {
    const { _sound: currentSound, currentTrackId } = get();

    // If same track, just resume
    if (currentTrackId === trackId && currentSound) {
      await currentSound.playAsync();
      set({ isPlaying: true });
      return;
    }

    // Unload previous sound
    if (currentSound) {
      await currentSound.unloadAsync().catch(() => {});
    }

    set({
      isLoading: true,
      currentTrackId: trackId,
      currentTrackTitle: title ?? null,
      currentTrackRoute: route ?? null,
      shadowSegment: null,
      error: null,
      _sound: null,
      progress: 0,
      duration: 0,
    });

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Support both URI strings and require() module IDs
      const playbackSource: AVPlaybackSource =
        typeof source === "number" ? source : { uri: source };

      let lastUpdateMs = 0;
      let lastSavedPosition = 0;

      const { sound } = await Audio.Sound.createAsync(
        playbackSource,
        { shouldPlay: true, rate: get().playbackSpeed },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          const positionSeconds = (status.positionMillis ?? 0) / 1000;
          const now = Date.now();
          const stateChanged = status.didJustFinish || status.isPlaying !== get().isPlaying;

          if (stateChanged || now - lastUpdateMs >= 250) {
            lastUpdateMs = now;
            set({
              progress: positionSeconds,
              duration: (status.durationMillis ?? 0) / 1000,
              isPlaying: status.isPlaying,
            });
          }
          const { shadowSegment } = get();
          if (shadowSegment && status.isPlaying && positionSeconds >= shadowSegment.endTime) {
            sound.setPositionAsync(shadowSegment.startTime * 1000).catch(() => {});
          }
          if (status.isPlaying && Math.abs(positionSeconds - lastSavedPosition) >= 2) {
            lastSavedPosition = positionSeconds;
            get().saveResumeState(trackId, positionSeconds);
          }
          if (status.didJustFinish) {
            set({ isPlaying: false, progress: 0 });
            sound.setPositionAsync(0).catch(() => {});
          }
        }
      );

      set({ _sound: sound, isLoading: false, isPlaying: true });
    } catch (error) {
      console.error("Error loading audio:", error);
      // Keep the track id/title so the player stays visible with the error message
      set({
        isLoading: false,
        isPlaying: false,
        progress: 0,
        duration: 0,
        _sound: null,
        error: getAudioErrorMessage(error),
      });
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

  setShadowLoop: (segment) => set({ shadowSegment: segment }),

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
      currentTrackRoute: null,
      progress: 0,
      duration: 0,
      shadowSegment: null,
      error: null,
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
    const languageId = useLanguageStore.getState().selectedLanguageId;
    const state: ResumeState = { lessonId, positionSeconds, languageId };
    set({ resumeState: state });
    AsyncStorage.setItem(RESUME_KEY, JSON.stringify(state)).catch(() => {});
  },
}));
