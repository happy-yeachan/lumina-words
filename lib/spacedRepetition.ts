import type { Word, FlashcardResult } from '@/types';

/**
 * SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Quality ratings:
 *   hard = 2
 *   good = 4
 *   easy = 5
 */

const QUALITY_MAP = {
  hard: 2,
  good: 4,
  easy: 5,
} as const;

export function applySpacedRepetition(word: Word, result: FlashcardResult): Word {
  const quality = QUALITY_MAP[result.rating];
  let { easeFactor, interval, streak, reviewCount } = word;

  if (quality >= 3) {
    // Correct response
    if (streak === 0) {
      interval = 1;
    } else if (streak === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    streak += 1;
  } else {
    // Incorrect — reset interval
    interval = 1;
    streak = 0;
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

  return {
    ...word,
    easeFactor,
    interval,
    streak,
    reviewCount: reviewCount + 1,
    lastReviewed: new Date().toISOString(),
    nextReview,
    difficulty: qualityToDifficulty(quality),
  };
}

function qualityToDifficulty(quality: number): Word['difficulty'] {
  if (quality <= 2) return 'hard';
  if (quality <= 3) return 'medium';
  return 'easy';
}

export function getWordsForSession(words: Word[], count = 20): Word[] {
  const now = new Date();
  const due = words.filter((w) => !w.nextReview || new Date(w.nextReview) <= now);
  // Sort: never reviewed first, then by oldest nextReview
  return due
    .sort((a, b) => {
      if (!a.lastReviewed && !b.lastReviewed) return 0;
      if (!a.lastReviewed) return -1;
      if (!b.lastReviewed) return 1;
      return new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime();
    })
    .slice(0, count);
}

export function generateQuizDistractors(
  correctWord: Word,
  allWords: Word[],
  direction: 'en-to-kr' | 'kr-to-en'
): string[] {
  const others = allWords.filter((w) => w.id !== correctWord.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);

  const distractors = shuffled.map((w) =>
    direction === 'en-to-kr' ? w.korean : w.english
  );

  const correct = direction === 'en-to-kr' ? correctWord.korean : correctWord.english;
  const options = [...distractors, correct].sort(() => Math.random() - 0.5);

  return options;
}
