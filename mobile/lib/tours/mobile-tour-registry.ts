export type TourAudience = "all" | "contributor" | "reviewer" | "admin";

export interface TourFeature {
  icon: string;
  color: string;
  bgColor: string;
  titleKey: string;
  detailKey: string;
}

export interface MobileTourConfig {
  route: string;
  audience: TourAudience;
  heroIcon: string;
  heroColor: string;
  heroBg: string;
  titleKey: string;
  subtitleKey: string;
  features: TourFeature[];
}

export const MOBILE_TOUR_REGISTRY = {
  welcome: {
    route: "/(tabs)/learn",
    audience: "all",
    heroIcon: "hand.wave.fill",
    heroColor: "#2563eb",
    heroBg: "#dbeafe",
    titleKey: "onboarding.welcomeModalTitle",
    subtitleKey: "onboarding.welcomeModalSubtitle",
    features: [
      {
        icon: "book.fill",
        color: "#2563eb",
        bgColor: "#dbeafe",
        titleKey: "onboarding.welcomeLearnTitle",
        detailKey: "onboarding.welcomeLearnDetail",
      },
      {
        icon: "sparkles",
        color: "#7c3aed",
        bgColor: "#ede9fe",
        titleKey: "onboarding.welcomePracticeTitle",
        detailKey: "onboarding.welcomePracticeDetail",
      },
      {
        icon: "newspaper.fill",
        color: "#9333ea",
        bgColor: "#f3e8ff",
        titleKey: "onboarding.welcomeCommunityTitle",
        detailKey: "onboarding.welcomeCommunityDetail",
      },
    ],
  },
  learn: {
    route: "/(tabs)/learn",
    audience: "all",
    heroIcon: "book.fill",
    heroColor: "#3b82f6",
    heroBg: "#dbeafe",
    titleKey: "onboarding.learnTourTitle",
    subtitleKey: "onboarding.learnTourSubtitle",
    features: [
      {
        icon: "book.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.learnTourCourses",
        detailKey: "onboarding.learnTourCoursesDetail",
      },
      {
        icon: "speaker.wave.2.fill",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.learnTourAudio",
        detailKey: "onboarding.learnTourAudioDetail",
      },
      {
        icon: "chart.bar.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.learnTourProgress",
        detailKey: "onboarding.learnTourProgressDetail",
      },
    ],
  },
  practice: {
    route: "/(tabs)/explore",
    audience: "all",
    heroIcon: "sparkles",
    heroColor: "#8b5cf6",
    heroBg: "#ede9fe",
    titleKey: "onboarding.practiceTourTitle",
    subtitleKey: "onboarding.practiceTourSubtitle",
    features: [
      {
        icon: "trophy.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.practiceTourQuiz",
        detailKey: "onboarding.practiceTourQuizDetail",
      },
      {
        icon: "rectangle.grid.2x2",
        color: "#8b5cf6",
        bgColor: "#ede9fe",
        titleKey: "onboarding.practiceTourMatching",
        detailKey: "onboarding.practiceTourMatchingDetail",
      },
      {
        icon: "flame.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.practiceTourDaily",
        detailKey: "onboarding.practiceTourDailyDetail",
      },
      {
        icon: "person.2.fill",
        color: "#ef4444",
        bgColor: "#fee2e2",
        titleKey: "onboarding.practiceTourMultiplayer",
        detailKey: "onboarding.practiceTourMultiplayerDetail",
      },
    ],
  },
  journal: {
    route: "/journal",
    audience: "all",
    heroIcon: "pencil.and.list.clipboard",
    heroColor: "#3b82f6",
    heroBg: "#dbeafe",
    titleKey: "onboarding.journalTourTitle",
    subtitleKey: "onboarding.journalTourSubtitle",
    features: [
      {
        icon: "pencil.and.list.clipboard",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.journalTourWrite",
        detailKey: "onboarding.journalTourWriteDetail",
      },
      {
        icon: "clock.arrow.circlepath",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.journalTourRevisit",
        detailKey: "onboarding.journalTourRevisitDetail",
      },
    ],
  },
  feed: {
    route: "/(tabs)/feed",
    audience: "all",
    heroIcon: "newspaper.fill",
    heroColor: "#8b5cf6",
    heroBg: "#ede9fe",
    titleKey: "onboarding.feedTourTitle",
    subtitleKey: "onboarding.feedTourSubtitle",
    features: [
      {
        icon: "newspaper.fill",
        color: "#8b5cf6",
        bgColor: "#ede9fe",
        titleKey: "onboarding.feedTourActivity",
        detailKey: "onboarding.feedTourActivityDetail",
      },
      {
        icon: "heart.fill",
        color: "#ef4444",
        bgColor: "#fee2e2",
        titleKey: "onboarding.feedTourInteract",
        detailKey: "onboarding.feedTourInteractDetail",
      },
      {
        icon: "mic.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.feedTourContribute",
        detailKey: "onboarding.feedTourContributeDetail",
      },
    ],
  },
  profile: {
    route: "/(tabs)/profile",
    audience: "all",
    heroIcon: "person.fill",
    heroColor: "#10b981",
    heroBg: "#d1fae5",
    titleKey: "onboarding.profileTourTitle",
    subtitleKey: "onboarding.profileTourSubtitle",
    features: [
      {
        icon: "flame.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.profileTourStats",
        detailKey: "onboarding.profileTourStatsDetail",
      },
      {
        icon: "chart.bar.fill",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        titleKey: "onboarding.profileTourDashboard",
        detailKey: "onboarding.profileTourDashboardDetail",
      },
      {
        icon: "person.3.fill",
        color: "#10b981",
        bgColor: "#d1fae5",
        titleKey: "onboarding.profileTourClassroom",
        detailKey: "onboarding.profileTourClassroomDetail",
      },
      {
        icon: "star.fill",
        color: "#f59e0b",
        bgColor: "#fef3c7",
        titleKey: "onboarding.profileTourBounties",
        detailKey: "onboarding.profileTourBountiesDetail",
      },
    ],
  },
} as const;

export type TourId = keyof typeof MOBILE_TOUR_REGISTRY;