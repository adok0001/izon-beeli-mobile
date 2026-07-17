export type MobileChecklistAudience = "all" | "reviewer" | "admin";

export interface MobileChecklistItem {
  route: string;
  audience: MobileChecklistAudience;
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

export const MOBILE_CHECKLIST_REGISTRY = {
  completeOneLesson: {
    route: "/(tabs)/learn",
    audience: "all",
    titleKey: "welcomeChecklist.completeOneLessonTitle",
    descriptionKey: "welcomeChecklist.completeOneLessonDetail",
    icon: "book.fill",
  },
  takeOneQuiz: {
    route: "/quiz",
    audience: "all",
    titleKey: "welcomeChecklist.takeOneQuizTitle",
    descriptionKey: "welcomeChecklist.takeOneQuizDetail",
    icon: "trophy.fill",
  },
  writeJournalEntry: {
    route: "/journal",
    audience: "all",
    titleKey: "welcomeChecklist.writeJournalEntryTitle",
    descriptionKey: "welcomeChecklist.writeJournalEntryDetail",
    icon: "pencil.and.list.clipboard",
  },
  submitContribution: {
    route: "/contribute",
    audience: "all",
    titleKey: "welcomeChecklist.submitContributionTitle",
    descriptionKey: "welcomeChecklist.submitContributionDetail",
    icon: "mic.fill",
  },
  listenToAudio: {
    route: "/(tabs)/explore",
    audience: "all",
    titleKey: "welcomeChecklist.listenToAudioTitle",
    descriptionKey: "welcomeChecklist.listenToAudioDetail",
    icon: "sparkles",
  },
  exploreFeed: {
    route: "/(tabs)/feed",
    audience: "all",
    titleKey: "welcomeChecklist.exploreFeedTitle",
    descriptionKey: "welcomeChecklist.exploreFeedDetail",
    icon: "newspaper.fill",
  },
  openDictionary: {
    route: "/dictionary",
    audience: "all",
    titleKey: "welcomeChecklist.openDictionaryTitle",
    descriptionKey: "welcomeChecklist.openDictionaryDetail",
    icon: "character.book.closed",
  },
  exploreCultureMusic: {
    route: "/(tabs)/explore",
    audience: "all",
    titleKey: "welcomeChecklist.exploreCultureMusicTitle",
    descriptionKey: "welcomeChecklist.exploreCultureMusicDetail",
    icon: "music.note",
  },
  reviewDashboard: {
    route: "/dashboard",
    audience: "all",
    titleKey: "welcomeChecklist.reviewDashboardTitle",
    descriptionKey: "welcomeChecklist.reviewDashboardDetail",
    icon: "chart.bar.fill",
  },
  reviewerModerate: {
    route: "/review",
    audience: "reviewer",
    titleKey: "welcomeChecklist.reviewerModerateTitle",
    descriptionKey: "welcomeChecklist.reviewerModerateDetail",
    icon: "checkmark.seal.fill",
  },
  adminReviewerApplications: {
    route: "/admin/users",
    audience: "admin",
    titleKey: "welcomeChecklist.adminReviewerApplicationsTitle",
    descriptionKey: "welcomeChecklist.adminReviewerApplicationsDetail",
    icon: "person.fill",
  },
} as const;

export type MobileChecklistId = keyof typeof MOBILE_CHECKLIST_REGISTRY;
