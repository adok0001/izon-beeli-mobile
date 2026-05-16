import type { Lesson } from "@/types";
import { create } from "zustand";

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
export const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface AudioState {
  currentLesson: Lesson | null;
  isPlaying: boolean;
  position: number; // seconds
  duration: number; // seconds
  speed: PlaybackSpeed;
  audioElement: HTMLAudioElement | null;

  // Actions
  load: (lesson: Lesson) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  stop: () => void;
}

let _audioCleanup: (() => void) | null = null;

export const useAudioStore = create<AudioState>((set, get) => ({
  currentLesson: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  speed: 1,
  audioElement: null,

  load: (lesson: Lesson) => {
    _audioCleanup?.();
    _audioCleanup = null;

    const { audioElement: existing, speed } = get();
    if (existing) {
      existing.pause();
      existing.src = "";
    }

    if (!lesson.audioUrl || typeof lesson.audioUrl !== "string") {
      set({ currentLesson: lesson, isPlaying: false, position: 0, duration: 0 });
      return;
    }

    const audio = new Audio(lesson.audioUrl);
    audio.playbackRate = speed;

    const onTimeUpdate = () => { set({ position: audio.currentTime }); };
    const onLoadedMetadata = () => { set({ duration: audio.duration }); };
    const onEnded = () => { set({ isPlaying: false, position: 0 }); };
    const onPlay = () => set({ isPlaying: true });
    const onPause = () => set({ isPlaying: false });

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    _audioCleanup = () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };

    audio.play().catch(() => {
      // Autoplay blocked — user must interact first
    });

    set({ currentLesson: lesson, audioElement: audio, position: 0, isPlaying: true });
  },

  play: () => {
    const { audioElement } = get();
    audioElement?.play();
  },

  pause: () => {
    const { audioElement } = get();
    audioElement?.pause();
  },

  resume: () => {
    const { audioElement } = get();
    audioElement?.play();
  },

  seek: (seconds: number) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.currentTime = seconds;
      set({ position: seconds });
    }
  },

  skipForward: (seconds = 10) => {
    const { audioElement, duration } = get();
    if (audioElement) {
      const next = Math.min(duration, audioElement.currentTime + seconds);
      audioElement.currentTime = next;
      set({ position: next });
    }
  },

  skipBackward: (seconds = 10) => {
    const { audioElement } = get();
    if (audioElement) {
      const next = Math.max(0, audioElement.currentTime - seconds);
      audioElement.currentTime = next;
      set({ position: next });
    }
  },

  setSpeed: (speed: PlaybackSpeed) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.playbackRate = speed;
    }
    set({ speed });
  },

  setPosition: (seconds: number) => set({ position: seconds }),
  setDuration: (seconds: number) => set({ duration: seconds }),

  stop: () => {
    _audioCleanup?.();
    _audioCleanup = null;
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }
    set({ currentLesson: null, isPlaying: false, position: 0, duration: 0, audioElement: null });
  },
}));
