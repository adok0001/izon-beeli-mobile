// Scoped entry for the Claude Design sync — re-exports ONLY the design-system
// surface the user scoped in (UI primitives + standalone cards), so the bundle
// stays tight instead of pulling the whole Expo app's screen graph.
export { Button } from "@/components/ui/button";
export { Badge } from "@/components/ui/badge";
export { SectionHeader, ExhibitDivider } from "@/components/ui/section-header";
export { ScreenContainer } from "@/components/ui/screen-container";
export { LocalizedTextInput } from "@/components/ui/localized-text-input";
export { LanguagePicker } from "@/components/ui/language-picker";
// Web variant of the date picker (the native one uses a native modal picker).
export { DueDatePicker } from "@/components/ui/due-date-picker.web";
export { IconSymbol } from "@/components/ui/icon-symbol";

export { XpLevelBadge } from "@/components/xp-level-badge";
export { ProverbCard } from "@/components/proverb-card";
export { WordOfTheDay } from "@/components/word-of-the-day";
export { ProverbOfTheDay } from "@/components/proverb-of-the-day";
export { DiscoverCard } from "@/components/discover-card";
export { DailyChallengeCards } from "@/components/daily-challenge-card";
export { UpNextCard } from "@/components/up-next-card";
export { WordChallengeCard } from "@/components/word-challenge-card";
export { ContributionSpotlightCard } from "@/components/contribution-spotlight-card";
