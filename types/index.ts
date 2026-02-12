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
