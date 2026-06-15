import { Audio } from "expo-av";
import { File } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

export type RecordingState = "idle" | "recording" | "stopped";

export interface VoiceRecordingControls {
  state: RecordingState;
  uri: string | null;
  elapsed: number;
  playbackPosition: number;
  playbackDuration: number;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  discardRecording: () => void;
  loadUri: (uri: string) => void;
}

export function useVoiceRecording(): VoiceRecordingControls {
  const [state, setState] = useState<RecordingState>("idle");
  const [uri, setUri] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackPosition(0);
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      unloadSound();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, [unloadSound]);

  const startRecording = useCallback(async () => {
    await unloadSound();
    setUri(null);
    setElapsed(0);

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("Microphone access required", "Enable microphone access in Settings to record audio notes.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setState("recording");

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
  }, [unloadSound]);

  const stopRecording = useCallback(async () => {
    clearTimer();
    if (!recordingRef.current) return;

    await recordingRef.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const fileUri = recordingRef.current.getURI();
    recordingRef.current = null;

    if (fileUri) {
      setUri(fileUri);
      setState("stopped");

      const { sound, status } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;
      if (status.isLoaded) {
        setPlaybackDuration(Math.floor((status.durationMillis ?? 0) / 1000));
      }
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        setPlaybackPosition(Math.floor(s.positionMillis / 1000));
        if (s.didJustFinish) {
          setIsPlaying(false);
          setPlaybackPosition(0);
        }
      });
    } else {
      setState("idle");
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const discardRecording = useCallback(() => {
    clearTimer();
    unloadSound();
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current = null;
    setUri(null);
    setState("idle");
    setElapsed(0);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
  }, [unloadSound]);

  const loadUri = useCallback(
    (fileUri: string) => {
      unloadSound().then(async () => {
        // Guard against missing files (purged cache / stale path) so we never
        // hit an uncaught AVPlayerItem -11800 rejection.
        try {
          if (!new File(fileUri).exists) {
            setState("idle");
            setUri(null);
            return;
          }
        } catch {
          setState("idle");
          setUri(null);
          return;
        }

        try {
          setUri(fileUri);
          setState("stopped");
          const { sound, status } = await Audio.Sound.createAsync({ uri: fileUri });
          soundRef.current = sound;
          if (status.isLoaded) {
            setPlaybackDuration(Math.floor((status.durationMillis ?? 0) / 1000));
          }
          sound.setOnPlaybackStatusUpdate((s) => {
            if (!s.isLoaded) return;
            setPlaybackPosition(Math.floor(s.positionMillis / 1000));
            if (s.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          });
        } catch {
          soundRef.current = null;
          setState("idle");
          setUri(null);
        }
      });
    },
    [unloadSound]
  );

  return {
    state,
    uri,
    elapsed,
    playbackPosition,
    playbackDuration,
    isPlaying,
    startRecording,
    stopRecording,
    togglePlayback,
    discardRecording,
    loadUri,
  };
}
