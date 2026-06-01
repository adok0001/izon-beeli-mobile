import PostHog from "posthog-react-native";

// eslint-disable-next-line no-undef
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

const client = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "", {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  disabled: !process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
});

type EventName =
  | "app_open"
  | "lesson_started"
  | "lesson_completed"
  | "quiz_started"
  | "quiz_finished"
  | "word_saved"
  | "contribution_submitted"
  | "multiplayer_joined"
  | "daily_challenge_completed"
  | "level_up"
  | "plus_cta_tapped";

type EventProperties = Record<string, string | number | boolean | null>;

function __sendEvent(name: EventName, properties?: EventProperties): void {
  if (isDev) {
    console.log("[Analytics]", name, properties ?? {});
  }
  client.capture(name, properties);
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
  dailyChallengeCompleted: (challengeType: string, xpReward: number) =>
    __sendEvent("daily_challenge_completed", { challengeType, xpReward }),
  levelUp: (level: number, title: string) =>
    __sendEvent("level_up", { level, title }),
  plusCtaTapped: (source: string) =>
    __sendEvent("plus_cta_tapped", { source }),
  identify: (userId: string, traits?: Record<string, string>) =>
    client.identify(userId, traits),
  reset: () => client.reset(),
};
