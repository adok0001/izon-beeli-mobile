/**
 * BCP-47 UI language code → localized string.
 * The target-language content always lives in a bare field (e.g. `text`, `word`).
 * Glosses and UI-facing translations live here.
 *
 * Omitted keys fall through to `en` then the first available value.
 * Use `localize(field, uiLang)` from `@/lib/localize` to resolve.
 */
export type LocalizedText = Partial<Record<import("@/store/ui-language-store").UiLanguage, string>>;

/** Self-reported onboarding signal — persisted locally and on the user's backend record. */
export type UserLevel = "new" | "some_words" | "comfortable";

export type CourseType =
  | "first_words"
  | "sound_script"
  | "everyday_life"
  | "numbers_trade"
  | "oral_tradition"
  | "communicative"
  | "contemporary"
  | "songs"
  | "colors"
  | "house"
  | "community"
  | "work"
  | "modern_life"
  | "grammar"
  | "script"
  | "mv_arrival"
  | "mv_household"
  | "mv_village"
  | "mv_growing_up"
  | "mv_threshold"
  | "mv_working_year"
  | "mv_union"
  | "mv_assembly"
  | "mv_elders_voice"
  | "mv_keeper";

export type Skill =
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "vocabulary"
  | "grammar";

export interface Course {
  id: string;
  title: string | LocalizedText;
  /** Full gloss map — the authoritative value; `title` is its English projection. */
  titleTranslations?: LocalizedText | null;
  description: string | LocalizedText;
  /** Full gloss map — the authoritative value; `description` is its English projection. */
  descriptionTranslations?: LocalizedText | null;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  lessonsCount: number;
  imageUrl?: string | null;
  /** Free-form emoji override for the course badge; takes priority over the courseType icon. */
  emoji?: string | null;
  progress?: number; // 0-100
  courseType?: CourseType;
  /** Path position. Convention: >= 100 marks a reference shelf, off the numbered journey. */
  order?: number;
}

export type AudioSource = string | number; // URI string or require() module ID

/**
 * Every value `lessons.type` may hold. Derived as a const array rather than a
 * bare union so the Studio picker and the type cannot drift apart — a new kind
 * of lesson row becomes selectable the moment it is legal.
 *
 * `game` rows are the block-closing mini-games. They occupy a real slot on the
 * journey path (Movement 1's are at orders 5, 10, … 50) but are not lessons: a
 * learner plays them rather than working through a transcript, and they must be
 * kept out of lesson lists and completion counts. See `lib/course-path`.
 */
export const LESSON_TYPES = ["lesson", "song", "game"] as const;

export type LessonType = (typeof LESSON_TYPES)[number];

export type WordTone = "high" | "rising" | "level" | "falling";

export interface LessonWord {
  text: string;
  translation: string | LocalizedText;
  tone?: WordTone;
  audioUrl?: AudioSource;
}

/**
 * A cultural beat surfaced alongside a lesson — "language and culture together"
 * as a literal reading position rather than a separate destination.
 *
 * Served by `GET /lessons/:id` as `culturalNotes`, authored in Studio. It lived
 * in the bundled podcast package until that was retired; the shape is unchanged
 * so the rendering components didn't have to move.
 */
export interface CulturalNote {
  title: LocalizedText;
  body: LocalizedText;
  /** Category chips, e.g. ["festivals"]. The note card renders `tags[0]` as its overline. */
  tags?: string[];
  /**
   * Render inline immediately after this transcript segment (0-based index into
   * the lesson's ordered segments). Omitted = render after the transcript.
   */
  afterSegmentIndex?: number;
}

/**
 * An in-lesson check — a low-stakes formative question that fires between
 * transcript lines (same placement rail as cultural notes). Options empty =
 * tap-to-reveal.
 */
export interface LessonCheck {
  id: string;
  /** "predict-next" | "meaning" | "who-said" | "cloze" | "pick-reply" */
  type: string;
  prompt: string;
  answer: string;
  options: string[];
  explanation?: string | null;
  /** 0-based segment index the check fires after; null/omitted = end. */
  afterSegmentIndex?: number | null;
  order: number;
}

/** A recurring character in a season. Avatar + hue are authored in Studio, not bundled. */
export interface SeasonCastMember {
  castId: string;
  name: string;
  role: string;
  /** Categorical accent hue (see constants/accent-colors) tinting the avatar circle. */
  hue: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  /** @default "lesson" */
  type?: LessonType | null;
  /**
   * `type: "game"` rows only — which playground mini-game this block's gate runs
   * (an id from `lib/playground.ts`). Null falls back to the gate's own rotating
   * recall/listen/build/match round.
   */
  gameKey?: string | null;
  title: string | LocalizedText;
  /** Full gloss map — the authoritative value; `title` is its English projection. */
  titleTranslations?: LocalizedText | null;
  description: string | LocalizedText;
  /** Full gloss map — the authoritative value; `description` is its English projection. */
  descriptionTranslations?: LocalizedText | null;
  audioUrl?: AudioSource;
  duration?: number; // seconds
  order: number;
  completed?: boolean;
  /** Artist or traditional source (songs only) */
  artist?: string | null;
  /** e.g. "lullaby", "praise", "work_song", "festival", "contemporary" */
  genre?: string | null;
  skills?: Skill[];
  transcript?: TranscriptSegment[];
  /** How to interpret `transcript`. Defaults to "plain". */
  transcriptType?: "plain" | "helper" | null;
  scene?: string;
  sceneTitle?: string;
  sceneOrder?: number;
  /** Background illustration key (SceneKind) for the lesson hero, e.g. "kitchen". */
  sceneIllustration?: string;
  /** Educator-uploaded custom SVG URL — takes precedence over `sceneIllustration` when set. */
  sceneIllustrationUrl?: string | null;
  /** What the learner will be able to do after this lesson. */
  objectives?: (string | LocalizedText)[];
  /** Honest real-world competence statement ("You can now …"). */
  canDo?: string | LocalizedText | null;
  /** Full gloss map — the authoritative value; `canDo` is its English projection. */
  canDoTranslations?: LocalizedText | null;
  /** Key vocabulary with optional tone and gloss. */
  vocab?: LessonWord[];
  /** Culture notes attached to this lesson in Studio, in display order. */
  culturalNotes?: CulturalNote[];
  /**
   * Cast of the season this lesson is an episode of, if any — gives transcript
   * speakers their avatar and hue. Empty for standalone lessons.
   */
  seasonCast?: SeasonCastMember[];
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  translation?: string | LocalizedText | null;
  /** Full gloss map — the authoritative value; `translation` is its English projection. */
  translations?: LocalizedText | null;
  colorHex?: string | null;
  /** Who speaks this line (audio-drama attribution). */
  speaker?: string | null;
  /** Romanized / pronunciation guidance for the learner (never spoken). */
  roman?: string | null;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  lessonId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  feedItemId: string;
  /** Author's internal user id. Absent on optimistic (not-yet-posted) comments. */
  userId?: string | null;
  userName: string;
  text: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: "lesson_completed" | "achievement" | "contribution" | "community";
  /** Author's internal user id. Absent on optimistic (not-yet-posted) items. */
  userId?: string | null;
  title: string | LocalizedText;
  /** Full gloss map — the authoritative value; `title` is its English projection. */
  titleTranslations?: LocalizedText | null;
  description: string | LocalizedText;
  /** Full gloss map — the authoritative value; `description` is its English projection. */
  descriptionTranslations?: LocalizedText | null;
  userName: string;
  userAvatarUrl?: string;
  profileAvatarId?: string | null;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  audioUrl?: AudioSource; // for contribution cards with audio
  languageId?: string | null;
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
  isActive: boolean;
  /** Has at least one active course — the learner-facing pickers filter to these. */
  hasContent: boolean;
}

export type ContributionType = "word" | "phrase" | "audio" | "entry_audio" | "entry_meaning";

export type FeedbackCategory = "bug" | "suggestion" | "other";

export interface Contribution {
  id: string;
  type: ContributionType;
  languageId: string;
  word: string;
  english: string | LocalizedText;
  category: string;
  pronunciation?: string;
  example?: string;
  exampleTranslation?: string | LocalizedText;
  audioUrl?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  createdAt: string;
}

// --- Proverbs ---

export interface Proverb {
  id: string;
  languageId: string;
  text: string;
  translation: string | LocalizedText;
  /** Full gloss map — the authoritative value; `translation` is its English projection. */
  translations?: LocalizedText | null;
  meaning: string | LocalizedText;
  /** Full gloss map — the authoritative value; `meaning` is its English projection. */
  meaningTranslations?: LocalizedText | null;
  literal?: string;
  context?: string;
  tags?: string[];
  audioUrl?: string;
  relatedLessonId?: string;
}

// --- Etymology Trail ---

export interface EtymologyNode {
  era: string;
  form: string;
  language: string;
  note: string | LocalizedText;
}

export interface EtymologyEntry {
  id: string;
  languageId: string;
  word: string;
  english: string | LocalizedText;
  trail: EtymologyNode[];
  isActive?: boolean;
}

// --- Sentence Templates (for fill-in-the-blank) ---

export interface SentenceTemplate {
  id: string;
  languageId: string;
  /** Sentence with the target word included */
  sentence: string;
  /** The word to blank out */
  answer: string;
  /** Translation of the full sentence in the learner's UI language */
  englishSentence: string | LocalizedText;
  /** Explicit question kind: "blank" or "equivalent". Defaults to "blank". */
  kind?: "blank" | "equivalent";
  /** Literal word-for-word gloss (for idioms/equivalents) */
  literalTranslation?: string | LocalizedText | null;
  /** Audio recording of the full sentence, when available */
  exampleAudioUrl?: string;
}

export interface ScenarioTurn {
  text: string;
  translation: string | LocalizedText;
  audioUrl?: string;
}

export interface Scenario {
  id: string;
  languageId: string;
  situation: string;
  turns: ScenarioTurn[];
  createdAt?: string;
  updatedAt?: string;
}

// --- Story Mode ---

export interface StoryChapter {
  id: string;
  lessonId: string;
  title: string;
  narrativeIntro: string;
  narrativeOutro: string;
  order: number;
  /** Level of the linked lesson (from `podcast.<level>` scene). Enriched server-side. */
  level?: "beginner" | "intermediate" | "advanced" | string | null;
  /** Runtime of the linked lesson in minutes. Enriched server-side. */
  lessonDuration?: number | null;
  /** Genre of the linked lesson (e.g. "podcast"). Enriched server-side. */
  lessonGenre?: string | null;
  /** Whether the linked lesson is live/playable. false = "coming soon". */
  lessonIsActive?: boolean;
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
  | "greetings_etiquette"
  // Categories carried over from story/course content.
  | "governance_values"
  | "land_livelihood"
  | "kinship"
  | "cosmology"
  | "oral_tradition"
  | "arts_oratory"
  | "numbers_trade"
  | "geography";

/** A colour stripe in a cultural reader hero (e.g. the Izon colour symbolism entry). */
export interface CulturalHeroBand {
  label: string;
  sublabel?: string | LocalizedText;
  /** gradient start / end fills */
  from: string;
  to: string;
  /** true when the band is dark and needs light text */
  dark?: boolean;
}

export interface CulturalContent {
  id: string;
  languageId: string;
  category: CulturalCategory;
  title: string | LocalizedText;
  /** Full gloss map — the authoritative value; `title` is its English projection. */
  titleTranslations?: LocalizedText | null;
  description: string | LocalizedText;
  /** Full gloss map — the authoritative value; `description` is its English projection. */
  descriptionTranslations?: LocalizedText | null;
  keyTerms: { word: string; gloss?: string | LocalizedText; /** @deprecated Use `gloss` */ english?: string }[];
  /** Surfaced as the "Featured" hero card at the top of the gallery. */
  featured?: boolean;
  /** Primary headword shown with an audio button in the reader. */
  headword?: { word: string; gloss?: string | LocalizedText; audioUrl?: string };
  /** Contexts where this appears, rendered as chips ("Where you'll find them"). */
  applications?: (string | LocalizedText)[];
  /** Colour-band reader hero (falls back to an emoji hero when absent). */
  heroBands?: CulturalHeroBand[];
}

// --- Matching Game ---

export interface MatchingPair {
  id: string;
  word: string;
  english: string | LocalizedText;
}

export interface MatchingGameConfig {
  languageId: string;
  courseId?: string;
  lessonId?: string;
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
  | "proverb_of_month"
  | "song_of_week"
  | "streak_reminder"
  | "assignment_due"
  | "achievement"
  | "broadcast"
  | "reengagement";

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  icon?: string;
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
  /** The current authenticated user's role in this group */
  myRole?: GroupRole;
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
  | "equivalence"
  | "sentence-translate"
  | "listening"
  | "segment-listening"
  | "context-translate"
  | "picture-to-word"
  | "word-to-picture"
  | "type-the-word";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options: string[]; // 4 options, shuffled
  wordId?: string; // dictionary entry id — present for word-level questions
  audioSource?: AudioSource; // for listening questions
  startTime?: number; // seconds — for segment-listening, seek to this position
  endTime?: number; // seconds — for segment-listening, stop at this position
  explanation?: string; // optional explanation shown after incorrect answer
  exampleSentence?: string;
  exampleSentenceTranslation?: string;
  exampleAudioUrl?: string; // for sentence-listening questions
  imageUrl?: string; // for picture question types
  /** For word-to-picture: map option label → imageUrl */
  optionImages?: Record<string, string>;
}

export interface QuizConfig {
  languageId: string;
  courseId?: string;
  lessonId?: string;
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

// --- Multiplayer ---

export type GameSessionType = "quiz_battle" | "paired_lesson";
export type GameSessionStatus = "waiting" | "active" | "completed" | "abandoned";

export interface GameSession {
  id: string;
  type: GameSessionType;
  status: GameSessionStatus;
  inviteCode: string | null;
  languageId: string;
  courseId: string | null;
  lessonId: string | null;
  partyRoomId: string;
  createdBy: string;
  questionCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  players?: GameSessionPlayer[];
}

export interface GameSessionPlayer {
  id: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string | null;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  joinedAt: string;
  finishedAt: string | null;
}

/** A player as seen in lobby/session messages. */
export interface MultiplayerPlayerInfo {
  id: string;
  name: string;
  ready?: boolean;
}

/** Per-player results payload for game_over / lesson_complete. */
export interface MultiplayerResultPlayer {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

/** A chat message broadcast within a paired-lesson session. */
export interface MultiplayerChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

// Server → client message protocol (PartyKit room). One interface per `type`,
// unioned into MultiplayerMessage so handlers can switch-narrow on `type`.
export interface MpSessionInfoMessage {
  type: "session_info";
  sessionId: string;
  playerId: string;
}

export interface MpPlayerJoinedMessage {
  type: "player_joined";
  player: MultiplayerPlayerInfo;
}

export interface MpPlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export interface MpWaitingForReadyMessage {
  type: "waiting_for_ready";
  players: MultiplayerPlayerInfo[];
}

export interface MpCountdownMessage {
  type: "countdown";
  seconds: number;
}

export interface MpQuestionMessage {
  type: "question";
  question: QuizQuestion;
  index: number;
  total: number;
}

export interface MpOpponentAnsweredMessage {
  type: "opponent_answered";
}

export interface MpAnswerResultMessage {
  type: "answer_result";
  correct: boolean;
  correctAnswer: string;
  myScore: number;
  opponentScore: number;
}

export interface MpGameOverMessage {
  type: "game_over";
  winner: string | null;
  players: MultiplayerResultPlayer[];
}

export interface MpLessonStartedMessage {
  type: "lesson_started";
}

export interface MpYourTurnMessage {
  type: "your_turn";
  exercise: QuizQuestion;
  index: number;
  total: number;
  currentTurnPlayer: string;
}

export interface MpPartnerTurnMessage {
  type: "partner_turn";
  exercise: QuizQuestion;
  index: number;
  total: number;
  currentTurnPlayer: string;
}

export interface MpPartnerAnsweredMessage {
  type: "partner_answered";
  correct: boolean;
  correctAnswer: string;
}

export interface MpLessonCompleteMessage {
  type: "lesson_complete";
  players: MultiplayerResultPlayer[];
}

export interface MpPartnerRematchMessage {
  type: "partner_rematch";
}

export interface MpRematchStartingMessage {
  type: "rematch_starting";
}

export interface MpReactionMessage {
  type: "reaction";
  emoji?: string;
  playerId?: string;
}

export interface MpChatBroadcastMessage {
  type: "chat";
  message: MultiplayerChatMessage;
}

export interface MpChatHistoryMessage {
  type: "chat_history";
  messages: MultiplayerChatMessage[];
}

export interface MpPlayerDisconnectedMessage {
  type: "player_disconnected";
}

export interface MpPlayerReconnectedMessage {
  type: "player_reconnected";
}

export interface MpOpponentForfeitedMessage {
  type: "opponent_forfeited";
}

export interface MpPartnerForfeitedMessage {
  type: "partner_forfeited";
}

export interface MpErrorMessage {
  type: "error";
  message: string;
}

export type MultiplayerMessage =
  | MpSessionInfoMessage
  | MpPlayerJoinedMessage
  | MpPlayerLeftMessage
  | MpWaitingForReadyMessage
  | MpCountdownMessage
  | MpQuestionMessage
  | MpOpponentAnsweredMessage
  | MpAnswerResultMessage
  | MpGameOverMessage
  | MpLessonStartedMessage
  | MpYourTurnMessage
  | MpPartnerTurnMessage
  | MpPartnerAnsweredMessage
  | MpLessonCompleteMessage
  | MpPartnerRematchMessage
  | MpRematchStartingMessage
  | MpReactionMessage
  | MpChatBroadcastMessage
  | MpChatHistoryMessage
  | MpPlayerDisconnectedMessage
  | MpPlayerReconnectedMessage
  | MpOpponentForfeitedMessage
  | MpPartnerForfeitedMessage
  | MpErrorMessage;

export type MultiplayerPhase =
  | "lobby"
  | "countdown"
  | "playing"
  | "between_questions"
  | "results";

// --- XP / Levels ---

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  progress: number; // 0-1
}

// --- Daily Challenges ---

export type ChallengeType =
  | "complete_quiz"
  | "review_words"
  | "listen_lesson"
  | "complete_lesson"
  | "save_words";

export interface DailyChallenge {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  challengeType: ChallengeType;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
  completedAt: string | null;
  createdAt: string;
}

// --- Dashboard Stats ---

export interface DayActivity {
  date: string; // YYYY-MM-DD
  lessonsCompleted: number;
  quizAccuracy: number | null; // 0-100 or null if no quiz
  wordsReviewed: number;
}

export interface DashboardStats {
  weeklyActivity: DayActivity[];
  totalLessonsThisWeek: number;
  avgQuizAccuracyThisWeek: number | null;
  totalWordsReviewedThisWeek: number;
}

export interface StreakCalendar {
  activeDays: string[]; // YYYY-MM-DD
}

// --- Discover (Blog / Podcast / Film) ---

export type DiscoverContentType = "blog" | "podcast" | "film";

export interface DiscoverItem {
  id: string;
  type: DiscoverContentType;
  title: string;
  description: string;
  author: string;
  publishedAt: string; // ISO-8601
  /** Seconds for podcast/film; reading seconds for blog */
  duration: number;
  coverGradient: [string, string];
  featured?: boolean;
  audioUrl?: string;
  videoUrl?: string;
  /**
   * The experience the card OPENS. A film IS its story, so this is the film's
   * own `id` once it has a scene graph; a podcast opens its season. Present for
   * backwards compatibility — prefer `scenes` (films) / `seasonArcId` (podcasts).
   */
  storyId?: string;
  /** The season this card BELONGS TO (`culture_items.season_arc_id`). */
  seasonArcId?: string;
  /**
   * A film's branching scene graph, folded inline (a film IS its story). Present
   * only on `film` cards that open a story; absent for podcasts, blogs, and
   * story-less "mini-series" films.
   */
  scenes?: Record<string, StoryScene>;
  initialSceneId?: string;
  estimatedMinutes?: number;
  language?: string;
  contentUrl?: string;
  body?: string;
  showNotes?: string;
  /** Studio visibility switch; inactive cards are hidden from learners. */
  isActive?: boolean;
}

export type StorySceneType = "narrative" | "choice" | "conclusion";

export interface StoryChoice {
  id: string;
  text: string;
  nextSceneId: string;
}

export interface StoryScene {
  id: string;
  type: StorySceneType;
  gradient: [string, string];
  title?: string;
  text: string;
  choices?: StoryChoice[];
  nextSceneId?: string;
}

export interface InteractiveStory {
  id: string;
  title: string;
  description: string;
  coverGradient: [string, string];
  estimatedMinutes: number;
  author: string;
  language?: string;
  initialSceneId: string;
  scenes: Record<string, StoryScene>;
}
