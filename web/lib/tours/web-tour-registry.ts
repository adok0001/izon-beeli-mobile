export type WebTourAudience = "all" | "admin" | "educator";

export interface WebTourDefinition {
  route: string;
  audience: WebTourAudience;
  mode: "spotlight" | "intro-card";
  title: string;
  description: string;
  action?: string; // e.g., "Complete one lesson", "Submit a word contribution"
}

export const WEB_TOUR_REGISTRY = {
  completeOneLesson: {
    route: "/learn",
    audience: "all",
    mode: "spotlight",
    title: "Complete one lesson",
    description: "Finish a lesson from any course to earn XP and build your streak.",
    action: "complete_lesson",
  },
  takeAQuiz: {
    route: "/quiz",
    audience: "all",
    mode: "spotlight",
    title: "Take a quiz",
    description: "Test your knowledge with vocabulary and comprehension questions.",
    action: "complete_quiz",
  },
  createJournalEntry: {
    route: "/journal",
    audience: "all",
    mode: "spotlight",
    title: "Write a journal entry",
    description: "Reflect on your learning and practice writing in the target language.",
    action: "create_journal_entry",
  },
  submitContribution: {
    route: "/contribute",
    audience: "all",
    mode: "spotlight",
    title: "Submit a word or audio",
    description: "Add new vocabulary or record audio to help other learners.",
    action: "submit_contribution",
  },
  listenToAudio: {
    route: "/listen",
    audience: "all",
    mode: "intro-card",
    title: "Listen to an audio lesson",
    description: "Practice pronunciation with expert-narrated lessons.",
    action: "listen_to_audio",
  },
  exploreProfile: {
    route: "/profile",
    audience: "all",
    mode: "intro-card",
    title: "Check your profile",
    description: "View your streak, XP, and learning statistics.",
    action: "view_profile",
  },
  discoverCommunity: {
    route: "/feed",
    audience: "all",
    mode: "intro-card",
    title: "Explore the community",
    description: "See what other learners are sharing and celebrate wins.",
    action: "view_feed",
  },
  useDictionary: {
    route: "/dictionary",
    audience: "all",
    mode: "intro-card",
    title: "Search the dictionary",
    description: "Look up words and learn contextual usage.",
    action: "use_dictionary",
  },
  reviewWords: {
    route: "/word-review",
    audience: "all",
    mode: "intro-card",
    title: "Review words",
    description: "Use spaced repetition to memorize vocabulary.",
    action: "review_words",
  },
  participateInBattle: {
    route: "/battle",
    audience: "all",
    mode: "intro-card",
    title: "Join a battle",
    description: "Compete in real-time quizzes against another learner.",
    action: "complete_battle",
  },
  completeBounty: {
    route: "/bounties",
    audience: "all",
    mode: "intro-card",
    title: "Complete a bounty",
    description: "Finish high-priority tasks to earn extra rewards.",
    action: "complete_bounty",
  },
  // Admin actions
  adminReviewContributions: {
    route: "/admin/review",
    audience: "admin",
    mode: "intro-card",
    title: "Review community contributions",
    description: "Approve or provide feedback on user submissions.",
    action: "admin_review_item",
  },
  adminManageUsers: {
    route: "/admin/users",
    audience: "admin",
    mode: "intro-card",
    title: "Manage user accounts",
    description: "Monitor user activity and handle account administration.",
    action: "admin_manage_users",
  },
  adminViewAnalytics: {
    route: "/admin",
    audience: "admin",
    mode: "intro-card",
    title: "View platform analytics",
    description: "Check system health and learning metrics.",
    action: "admin_view_analytics",
  },
  // Educator actions
  educatorCreateCourse: {
    route: "/educator/courses",
    audience: "educator",
    mode: "intro-card",
    title: "Create or edit a course",
    description: "Build curriculum and add lessons for your language.",
    action: "educator_create_course",
  },
  educatorReviewSubmissions: {
    route: "/educator/review",
    audience: "educator",
    mode: "intro-card",
    title: "Review learner submissions",
    description: "Grade and provide feedback on student work.",
    action: "educator_review_submission",
  },
  educatorExploreResources: {
    route: "/educator/dictionary",
    audience: "educator",
    mode: "intro-card",
    title: "Explore language resources",
    description: "Access the dictionary and cultural materials for teaching.",
    action: "educator_use_resources",
  },
} as const;

export type WebTourId = keyof typeof WEB_TOUR_REGISTRY;