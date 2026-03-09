/**
 * Thin analytics wrapper. Swap `__sendEvent` for a real provider
 * (Amplitude, PostHog, Segment, etc.) without touching call sites.
 */

// eslint-disable-next-line no-undef
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

type EventName =
  | "app_open"
  | "lesson_started"
  | "lesson_completed"
  | "quiz_started"
  | "quiz_finished"
  | "word_saved"
  | "contribution_submitted"
  | "multiplayer_joined";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

function __sendEvent(name: EventName, properties?: EventProperties): void {
  if (isDev) {
    console.log("[Analytics]", name, properties ?? {});
  }
  // TODO: replace with real provider, e.g.:
  // amplitude.logEvent(name, properties);
}

export const analytics = {
  appOpen: () => __sendEvent("app_open"),
  lessonStarted: (lessonId: string, languageId: string) =>
    __sendEvent("lesson_started", { lessonId, languageId }),
  lessonCompleted: (lessonId: string, languageId: string) =>
    __sendEvent("lesson_completed", { lessonId, languageId }),
  quizStarted: (languageId: string, questionCount: number) =>
    __sendEvent("quiz_started", { languageId, questionCount }),
  quizFinished: (languageId: string, accuracy: number, durationMs: number) =>
    __sendEvent("quiz_finished", { languageId, accuracy, durationMs }),
  wordSaved: (entryId: string, languageId: string) =>
    __sendEvent("word_saved", { entryId, languageId }),
  contributionSubmitted: (languageId: string, type: string) =>
    __sendEvent("contribution_submitted", { languageId, type }),
  multiplayerJoined: (sessionId: string, type: string) =>
    __sendEvent("multiplayer_joined", { sessionId, type }),
};
