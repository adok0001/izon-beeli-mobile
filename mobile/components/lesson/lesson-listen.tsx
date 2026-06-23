import { View } from "react-native";
import { SyncedAudioPlayer } from "@/components/audio/synced-audio-player";
import { SyncedTranscript } from "@/components/audio/synced-transcript";
import type { AudioSource, TranscriptSegment } from "@/types";

interface Props {
  trackId: string;
  source: AudioSource;
  title: string;
  route: string;
  segments: TranscriptSegment[];
  transcriptLabel?: string;
  onFinish?: () => void;
}

/**
 * The lesson "Basic audio + transcript" experience: a clean audio player above a
 * transcript that stays in sync with playback (active line + word highlighting,
 * tap-to-seek, auto-follow). Composed from the two reusable audio primitives so
 * the lesson screen only has to drop in one block.
 */
export function LessonListen({ trackId, source, title, route, segments, transcriptLabel, onFinish }: Props) {
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
      <SyncedAudioPlayer trackId={trackId} source={source} title={title} route={route} onFinish={onFinish} />
      {segments.length > 0 ? (
        <View style={{ marginTop: 22 }}>
          <SyncedTranscript segments={segments} label={transcriptLabel} />
        </View>
      ) : null}
    </View>
  );
}
