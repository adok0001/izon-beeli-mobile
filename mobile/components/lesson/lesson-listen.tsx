import { View } from "react-native";
import { SyncedAudioPlayer } from "@/components/audio/synced-audio-player";
import { SyncedTranscript } from "@/components/audio/synced-transcript";
import type { AudioSource, CulturalNote, LessonCheck, TranscriptSegment } from "@/types";
import type { SeasonCastMember } from "@/lib/hooks/use-story-arc";

interface Props {
  trackId: string;
  source: AudioSource;
  title: string;
  route: string;
  segments: TranscriptSegment[];
  transcriptLabel?: string;
  onFinish?: () => void;
  /** Lesson-specific culture beats, surfaced inline at the segment they explain. */
  culturalNotes?: CulturalNote[];
  /** In-lesson checks, surfaced inline at the segment they fire after. */
  checks?: LessonCheck[];
  /** Season cast, when the lesson is an episode — gives transcript speakers their avatars. */
  cast?: SeasonCastMember[];
}

/**
 * The lesson "Basic audio + transcript" experience: a clean audio player above a
 * transcript that stays in sync with playback (active line + word highlighting,
 * tap-to-seek, auto-follow). Composed from the two reusable audio primitives so
 * the lesson screen only has to drop in one block.
 */
export function LessonListen({ trackId, source, title, route, segments, transcriptLabel, onFinish, culturalNotes, checks, cast }: Props) {
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
      <SyncedAudioPlayer trackId={trackId} source={source} title={title} route={route} onFinish={onFinish} />
      {segments.length > 0 ? (
        <View style={{ marginTop: 22 }}>
          <SyncedTranscript segments={segments} label={transcriptLabel} culturalNotes={culturalNotes} checks={checks} lessonId={trackId} cast={cast} />
        </View>
      ) : null}
    </View>
  );
}
