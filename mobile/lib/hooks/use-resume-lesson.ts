import { useLesson } from "@/lib/hooks/use-courses";
import { localize } from "@/lib/localize";
import { BUNDLED_AUDIO } from "@/lib/mock-data";
import { useAudioStore } from "@/store/audio-store";
import { useUiLanguageStore } from "@/store/ui-language-store";
import { useRouter } from "expo-router";

/**
 * The last partially-played lesson, plus a `resume()` action that re-loads its
 * audio (seeking to where playback left off) and navigates to it. Shared by
 * the Learn tab's `ContinueCard` and the Explore tab's "Continue listening"
 * rail so the resume mechanics live in one place.
 */
export function useResumeLesson() {
  const router = useRouter();
  const { uiLanguage } = useUiLanguageStore();
  const resumeState = useAudioStore((s) => s.resumeState);
  const { loadAndPlay, seekTo, currentTrackId } = useAudioStore();
  const { data: lesson } = useLesson(resumeState?.lessonId ?? "");

  async function resume() {
    if (!resumeState?.lessonId || !lesson) return;
    const audioSource = lesson.audioUrl ?? BUNDLED_AUDIO[lesson.id];
    if (audioSource) {
      if (currentTrackId !== resumeState.lessonId) {
        await loadAndPlay(resumeState.lessonId, audioSource, localize(lesson.title, uiLanguage), `/lesson/${resumeState.lessonId}`);
        await seekTo(resumeState.positionSeconds);
      } else {
        await seekTo(resumeState.positionSeconds);
      }
    }
    router.push(`/lesson/${resumeState.lessonId}` as never);
  }

  return { resumeState, lesson, resume };
}
