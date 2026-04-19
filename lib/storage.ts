import type { Word, AppStats, AppSettings, ReviewSession, UserProgress } from '@/types';

// Migration path comment: Replace localStorage calls with Supabase client
// e.g., supabase.from('words').select('*') instead of getWords()

const KEYS = {
  WORDS: 'lumina_words',
  STATS: 'lumina_stats',
  SETTINGS: 'lumina_settings',
  SESSIONS: 'lumina_sessions',
  PROGRESS: 'lumina_progress',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

// ─── Words ───────────────────────────────────────────────────────────────────

export function getWords(): Word[] {
  return safeGet<Word[]>(KEYS.WORDS, []);
}

export function saveWords(words: Word[]): void {
  safeSet(KEYS.WORDS, words);
}

export function addWord(word: Word): void {
  const words = getWords();
  saveWords([...words, word]);
}

export function updateWord(updated: Word): void {
  const words = getWords();
  saveWords(words.map((w) => (w.id === updated.id ? updated : w)));
}

export function deleteWord(id: string): void {
  const words = getWords();
  saveWords(words.filter((w) => w.id !== id));
}

export function getWordsDueForReview(): Word[] {
  const words = getWords();
  const now = new Date();
  return words.filter((w) => {
    if (!w.nextReview) return true;
    return new Date(w.nextReview) <= now;
  });
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getStats(): AppStats {
  return safeGet<AppStats>(KEYS.STATS, {
    totalWords: 0,
    wordsLearnedToday: 0,
    reviewDueCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalReviews: 0,
    sessions: [],
  });
}

export function saveStats(stats: AppStats): void {
  safeSet(KEYS.STATS, stats);
}

export function updateStreak(): AppStats {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let { currentStreak, longestStreak, lastStudyDate } = stats;

  if (lastStudyDate === today) {
    // Already studied today, no change
  } else if (lastStudyDate === yesterday) {
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  } else {
    currentStreak = 1;
  }

  const updated = { ...stats, currentStreak, longestStreak, lastStudyDate: today };
  saveStats(updated);
  return updated;
}

export function addSession(session: ReviewSession): void {
  const stats = getStats();
  const sessions = [...(stats.sessions || []), session].slice(-100); // keep last 100
  saveStats({ ...stats, sessions, totalReviews: stats.totalReviews + session.wordsReviewed });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return safeGet<AppSettings>(KEYS.SETTINGS, {
    targetLanguage: 'English',
    nativeLanguage: 'Korean',
    dailyGoal: 10,
    darkMode: 'system',
  });
}

export function saveSettings(settings: AppSettings): void {
  safeSet(KEYS.SETTINGS, settings);
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export function exportData(): string {
  return JSON.stringify({
    words: getWords(),
    stats: getStats(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.words) saveWords(data.words);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch {
    return false;
  }
}

// ─── XP / Gamification ───────────────────────────────────────────────────────

/** Level thresholds — each level requires progressively more XP */
const XP_THRESHOLDS = [0, 300, 700, 1200, 1800, 2500, 3300, 4200, 5200, 6300];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevel(xp);
  const idx = level - 1;
  const prevThreshold = XP_THRESHOLDS[idx] ?? 0;
  const nextThreshold = XP_THRESHOLDS[idx + 1] ?? prevThreshold + 1000;
  const current = xp - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

export function getUserProgress(): UserProgress {
  return safeGet<UserProgress>(KEYS.PROGRESS, {
    totalXP: 0,
    level: 1,
    sessionsCompleted: 0,
    lastEvaluationDate: null,
  });
}

export function saveUserProgress(progress: UserProgress): void {
  safeSet(KEYS.PROGRESS, progress);
}

export function addXP(amount: number): UserProgress {
  const progress = getUserProgress();
  const newXP = progress.totalXP + amount;
  const updated: UserProgress = {
    ...progress,
    totalXP: newXP,
    level: getLevel(newXP),
    sessionsCompleted: progress.sessionsCompleted + 1,
    lastEvaluationDate: new Date().toISOString(),
  };
  saveUserProgress(updated);
  return updated;
}
