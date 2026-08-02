export type CourseType = "first_words" | "sound_script" | "everyday_life" | "numbers_trade" | "oral_tradition" | "communicative" | "contemporary" | "songs" | "colors" | "house" | "community" | "work" | "modern_life" | "grammar" | "script" | "mv_arrival" | "mv_household" | "mv_village" | "mv_growing_up" | "mv_threshold" | "mv_working_year" | "mv_union" | "mv_assembly" | "mv_elders_voice" | "mv_keeper";
export interface Course {
    id: string;
    title: string;
    titleFr?: string | null;
    description: string;
    descriptionFr?: string | null;
    language: string;
    level: "beginner" | "intermediate" | "advanced";
    lessonsCount: number;
    imageUrl?: string;
    progress?: number;
    courseType?: CourseType;
}
export type AudioSource = string | number;
export type LessonType = "lesson" | "song";
export interface Lesson {
    id: string;
    courseId: string;
    /** @default "lesson" */
    type?: LessonType | null;
    title: string;
    titleFr?: string | null;
    description: string;
    descriptionFr?: string | null;
    audioUrl?: AudioSource;
    duration?: number;
    order: number;
    completed?: boolean;
    /** Artist or traditional source (songs only) */
    artist?: string | null;
    /** e.g. "lullaby", "praise", "work_song", "festival", "contemporary" */
    genre?: string | null;
    transcript?: TranscriptSegment[];
}
export interface TranscriptSegment {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    translation?: string | null;
    translationFr?: string | null;
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
    titleFr?: string | null;
    description: string;
    descriptionFr?: string | null;
    userName: string;
    userAvatarUrl?: string;
    createdAt: string;
    likes: number;
    comments: number;
    audioUrl?: AudioSource;
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
    audioPosition: number;
}
export interface Language {
    id: string;
    name: string;
    nativeName: string;
    region: string;
}
export type ContributionType = "word" | "phrase" | "audio" | "entry_audio" | "entry_meaning";
export type FeedbackCategory = "bug" | "suggestion" | "other";
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
export interface Proverb {
    id: string;
    languageId: string;
    text: string;
    translation: string;
    translationFr?: string | null;
    meaning: string;
    meaningFr?: string | null;
    literal?: string;
    context?: string;
    tags?: string[];
}
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
export type CulturalCategory = "colors" | "naming_ceremonies" | "festivals" | "creation_myths" | "music" | "clothing" | "cuisine" | "greetings_etiquette" | "governance_values" | "land_livelihood" | "kinship" | "cosmology" | "oral_tradition" | "arts_oratory" | "numbers_trade" | "geography";
export interface CulturalContent {
    id: string;
    languageId: string;
    category: CulturalCategory;
    title: string;
    titleFr?: string | null;
    description: string;
    descriptionFr?: string | null;
    keyTerms: {
        word: string;
        english: string;
        french?: string | null;
    }[];
}
export interface MatchingPair {
    id: string;
    word: string;
    english: string;
}
export interface MatchingGameConfig {
    languageId: string;
    courseId?: string;
    pairCount: number;
}
export interface MatchingGameResult {
    totalPairs: number;
    attempts: number;
    timeElapsed: number;
    accuracy: number;
}
export type NotificationType = "word_of_day" | "streak_reminder" | "assignment_due" | "achievement";
export interface InAppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
}
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
    popularLanguages: {
        languageId: string;
        count: number;
    }[];
    weeklyActivity: {
        day: string;
        count: number;
    }[];
}
export type QuestionType = "word-to-english" | "english-to-word" | "fill-in-the-blank" | "listening";
export interface QuizQuestion {
    id: string;
    type: QuestionType;
    prompt: string;
    correctAnswer: string;
    options: string[];
    audioSource?: AudioSource;
    explanation?: string;
    exampleSentence?: string;
    exampleSentenceTranslation?: string;
}
export interface QuizConfig {
    languageId: string;
    courseId?: string;
    category?: string;
    questionCount: number;
}
export interface AnsweredQuestion {
    questionId: string;
    selectedAnswer: string;
    correct: boolean;
}
export interface QuizResult {
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
    timeElapsed: number;
    answeredQuestions: AnsweredQuestion[];
}
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
export interface MultiplayerPlayerInfo {
    id: string;
    name: string;
    ready?: boolean;
}
export interface MultiplayerResultPlayer {
    id: string;
    name: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
}
export interface MultiplayerChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    text: string;
    timestamp: number;
}
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
export type MultiplayerMessage = MpSessionInfoMessage | MpPlayerJoinedMessage | MpPlayerLeftMessage | MpWaitingForReadyMessage | MpCountdownMessage | MpQuestionMessage | MpOpponentAnsweredMessage | MpAnswerResultMessage | MpGameOverMessage | MpLessonStartedMessage | MpYourTurnMessage | MpPartnerTurnMessage | MpPartnerAnsweredMessage | MpLessonCompleteMessage | MpPartnerRematchMessage | MpRematchStartingMessage | MpReactionMessage | MpChatBroadcastMessage | MpChatHistoryMessage | MpPlayerDisconnectedMessage | MpPlayerReconnectedMessage | MpOpponentForfeitedMessage | MpPartnerForfeitedMessage | MpErrorMessage;
export type MultiplayerPhase = "lobby" | "countdown" | "playing" | "between_questions" | "results";
export interface LevelInfo {
    level: number;
    title: string;
    currentXP: number;
    xpForNextLevel: number;
    totalXP: number;
    progress: number;
}
export type ChallengeType = "complete_quiz" | "review_words" | "listen_lesson" | "complete_lesson" | "save_words";
export interface DailyChallenge {
    id: string;
    userId: string;
    date: string;
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
export interface DayActivity {
    date: string;
    lessonsCompleted: number;
    quizAccuracy: number | null;
    wordsReviewed: number;
}
export interface DashboardStats {
    weeklyActivity: DayActivity[];
    totalLessonsThisWeek: number;
    avgQuizAccuracyThisWeek: number | null;
    totalWordsReviewedThisWeek: number;
}
export interface StreakCalendar {
    activeDays: string[];
}
