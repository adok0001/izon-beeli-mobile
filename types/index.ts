export interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  lessonsCount: number;
  imageUrl?: string;
  progress?: number; // 0-100
}

export type AudioSource = string | number; // URI string or require() module ID

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  audioUrl?: AudioSource;
  duration?: number; // seconds
  order: number;
  completed?: boolean;
  transcript?: TranscriptSegment[];
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  translation?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  feedItemId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: "lesson_completed" | "achievement" | "contribution" | "community";
  title: string;
  description: string;
  userName: string;
  userAvatarUrl?: string;
  createdAt: string;
  likes: number;
  comments: number;
  audioUrl?: AudioSource; // for contribution cards with audio
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  streak: number;
  points: number;
  lessonsCompleted: number;
  joinedAt: string;
}

export interface UserProgress {
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  lastPlayedAt: string;
  audioPosition: number; // seconds
}

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  region: string;
}

export type ContributionType = "word" | "phrase" | "audio";

export interface Contribution {
  id: string;
  type: ContributionType;
  languageId: string;
  word: string;
  english: string;
  category: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string;
  audioUrl?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  createdAt: string;
}

// --- Proverbs ---

export interface Proverb {
  id: string;
  languageId: string;
  text: string;
  translation: string;
  meaning: string;
  literal?: string;
  context?: string;
  tags?: string[];
}

// --- Sentence Templates (for fill-in-the-blank) ---

export interface SentenceTemplate {
  id: string;
  languageId: string;
  /** Sentence with the target word included */
  sentence: string;
  /** The word to blank out */
  answer: string;
  /** English translation of the full sentence */
  englishSentence: string;
}

// --- Story Mode ---

export interface StoryChapter {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

export interface StoryArc {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: StoryChapter[];
}

// --- Cultural Content ---

export type CulturalCategory =
  | "colors"
  | "naming_ceremonies"
  | "festivals"
  | "creation_myths"
  | "music"
  | "clothing"
  | "cuisine"
  | "greetings_etiquette";

export interface CulturalContent {
  id: string;
  languageId: string;
  category: CulturalCategory;
  title: string;
  description: string;
  imageEmoji: string;
  keyTerms: { word: string; english: string }[];
}

// --- Matching Game ---

export interface MatchingPair {
  id: string;
  word: string;
  english: string;
}

export interface MatchingGameConfig {
  languageId: string;
  courseId?: string;
  pairCount: number; // default 8
}

export interface MatchingGameResult {
  totalPairs: number;
  attempts: number;
  timeElapsed: number; // seconds
  accuracy: number; // 0-100
}

// --- Notifications ---

export type NotificationType =
  | "word_of_day"
  | "streak_reminder"
  | "assignment_due"
  | "achievement";

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// --- Story Mode ---

export interface StoryChapter {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
}

export interface StoryArc {
  id: string;
  courseId: string;
  title: string;
  description: string;
  chapters: StoryChapter[];
}

// --- Classroom / Groups ---

export type GroupRole = "teacher" | "parent" | "student";

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  languageId: string;
  createdAt: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  role: GroupRole;
  lessonsCompleted: number;
  streak: number;
  points: number;
}

export interface AssignedLesson {
  id: string;
  groupId: string;
  lessonId: string;
  assignedBy: string;
  dueDate?: string;
  createdAt: string;
}

// --- Institutions ---

export interface Institution {
  id: string;
  name: string;
  adminId: string;
  groupIds: string[];
  createdAt: string;
}

export interface InstitutionDashboard {
  totalStudents: number;
  totalGroups: number;
  activeThisWeek: number;
  popularLanguages: { languageId: string; count: number }[];
  weeklyActivity: { day: string; count: number }[];
}

// --- Quiz ---

export type QuestionType =
  | "word-to-english"
  | "english-to-word"
  | "fill-in-the-blank"
  | "listening";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options: string[]; // 4 options, shuffled
  audioSource?: AudioSource; // for listening questions
}

export interface QuizConfig {
  languageId: string;
  courseId?: string;
  category?: string;
  questionCount: number; // default 10
}

export interface AnsweredQuestion {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  accuracy: number; // 0-100
  timeElapsed: number; // seconds
  answeredQuestions: AnsweredQuestion[];
}
