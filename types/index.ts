export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Word {
  id: string;
  english: string;
  korean: string;
  exampleEnglish: string;
  exampleKorean: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
  lastReviewed: string | null;
  nextReview: string | null;
  reviewCount: number;
  easeFactor: number; // SM-2 algorithm ease factor (default 2.5)
  interval: number;   // Days until next review
  streak: number;     // Consecutive correct reviews
}

export interface ReviewSession {
  id: string;
  date: string;
  wordsReviewed: number;
  correctCount: number;
  mode: 'flashcard' | 'quiz';
  duration: number; // seconds
}

export interface AppSettings {
  targetLanguage: string;
  dailyGoal: number;
  darkMode: 'system' | 'light' | 'dark';
  nativeLanguage: string;
}

export interface AppStats {
  totalWords: number;
  wordsLearnedToday: number;
  reviewDueCount: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalReviews: number;
  sessions: ReviewSession[];
}

export type QuizDirection = 'en-to-kr' | 'kr-to-en';

export interface QuizQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
  direction: QuizDirection;
}

export interface FlashcardResult {
  wordId: string;
  rating: 'hard' | 'good' | 'easy';
  timestamp: string;
}

// ─── Conversation / Chat ──────────────────────────────────────────────────────

export interface Correction {
  original: string;    // the exact wrong phrase the user wrote
  better: string;      // the correct / more natural expression
  explanation: string; // concise explanation in Korean
}

export interface ChatApiResponse {
  reply: string;
  corrections: Correction[];
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface UserProgress {
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  lastEvaluationDate: string | null;
}

export interface EvaluationResult {
  score: number;           // 0–100
  xp_earned: number;       // score × 10
  feedback: string;        // 2–3 encouraging sentences
  strengths: string[];     // exactly 2 specific strengths
  improvements: string[];  // 1–2 specific areas to work on
}
