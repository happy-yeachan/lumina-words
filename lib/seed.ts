/**
 * Seeds the app with sample vocabulary on first load.
 * Call this once in the root layout or home page.
 */
import type { Word } from '@/types';
import { getWords, saveWords } from './storage';
import { generateId } from './utils';

const SAMPLE_WORDS: Omit<Word, 'id' | 'createdAt'>[] = [
  {
    english: 'serendipity',
    korean: '뜻밖의 행운, 우연한 발견',
    exampleEnglish: 'Finding that old photo was pure serendipity.',
    exampleKorean: '그 오래된 사진을 발견한 것은 순전한 우연한 행운이었다.',
    difficulty: 'hard',
    tags: ['noun', 'advanced'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'perseverance',
    korean: '인내, 끈기',
    exampleEnglish: 'Her perseverance helped her pass the exam.',
    exampleKorean: '그녀의 끈기가 시험을 통과하는 데 도움이 되었다.',
    difficulty: 'medium',
    tags: ['noun', 'motivation'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'eloquent',
    korean: '웅변적인, 말을 잘 하는',
    exampleEnglish: 'She gave an eloquent speech at the ceremony.',
    exampleKorean: '그녀는 행사에서 웅변적인 연설을 했다.',
    difficulty: 'medium',
    tags: ['adjective'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'resilient',
    korean: '회복력 있는, 탄력 있는',
    exampleEnglish: 'Children are often more resilient than adults.',
    exampleKorean: '아이들은 종종 어른보다 더 회복력이 강하다.',
    difficulty: 'medium',
    tags: ['adjective'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'ubiquitous',
    korean: '어디에나 있는, 편재하는',
    exampleEnglish: 'Smartphones are now ubiquitous in modern society.',
    exampleKorean: '스마트폰은 이제 현대 사회 어디에나 있다.',
    difficulty: 'hard',
    tags: ['adjective', 'advanced'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'gratitude',
    korean: '감사, 고마움',
    exampleEnglish: 'I feel deep gratitude for your help.',
    exampleKorean: '나는 당신의 도움에 깊은 감사를 느낀다.',
    difficulty: 'easy',
    tags: ['noun', 'emotion'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'ambiguous',
    korean: '모호한, 불명확한',
    exampleEnglish: 'His instructions were ambiguous and confusing.',
    exampleKorean: '그의 지시는 모호하고 혼란스러웠다.',
    difficulty: 'medium',
    tags: ['adjective'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
  {
    english: 'procrastinate',
    korean: '미루다, 질질 끌다',
    exampleEnglish: "Don't procrastinate — start studying now!",
    exampleKorean: '미루지 마세요 — 지금 당장 공부를 시작하세요!',
    difficulty: 'medium',
    tags: ['verb'],
    lastReviewed: null,
    nextReview: null,
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 1,
    streak: 0,
  },
];

export function seedSampleData(): void {
  if (typeof window === 'undefined') return;
  const existing = getWords();
  if (existing.length > 0) return; // Already has data

  const words: Word[] = SAMPLE_WORDS.map((w) => ({
    ...w,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));

  saveWords(words);
}
