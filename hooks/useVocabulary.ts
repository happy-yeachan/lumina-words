'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Word, Difficulty } from '@/types';
import {
  getWords,
  saveWords,
  addWord as storageAddWord,
  updateWord as storageUpdateWord,
  deleteWord as storageDeleteWord,
} from '@/lib/storage';
import { generateId } from '@/lib/utils';

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'difficulty' | 'due';

interface UseVocabularyReturn {
  words: Word[];
  filteredWords: Word[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterDifficulty: Difficulty | 'all';
  setFilterDifficulty: (d: Difficulty | 'all') => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  addWord: (data: Omit<Word, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'reviewCount' | 'easeFactor' | 'interval' | 'streak'>) => void;
  updateWord: (word: Word) => void;
  deleteWord: (id: string) => void;
  isLoaded: boolean;
}

export function useVocabulary(): UseVocabularyReturn {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    setWords(getWords());
    setIsLoaded(true);
  }, []);

  const addWord = useCallback(
    (data: Omit<Word, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'reviewCount' | 'easeFactor' | 'interval' | 'streak'>) => {
      const newWord: Word = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        nextReview: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 1,
        streak: 0,
      };
      storageAddWord(newWord);
      setWords(getWords());
    },
    []
  );

  const updateWord = useCallback((word: Word) => {
    storageUpdateWord(word);
    setWords(getWords());
  }, []);

  const deleteWord = useCallback((id: string) => {
    storageDeleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const filteredWords = words
    .filter((w) => {
      const q = searchQuery.toLowerCase();
      if (q && !w.english.toLowerCase().includes(q) && !w.korean.toLowerCase().includes(q)) {
        return false;
      }
      if (filterDifficulty !== 'all' && w.difficulty !== filterDifficulty) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.english.localeCompare(b.english);
        case 'difficulty': {
          const order: Record<Difficulty, number> = { hard: 0, medium: 1, easy: 2 };
          return order[a.difficulty] - order[b.difficulty];
        }
        case 'due': {
          const aTime = a.nextReview ? new Date(a.nextReview).getTime() : 0;
          const bTime = b.nextReview ? new Date(b.nextReview).getTime() : 0;
          return aTime - bTime;
        }
        default:
          return 0;
      }
    });

  return {
    words,
    filteredWords,
    searchQuery,
    setSearchQuery,
    filterDifficulty,
    setFilterDifficulty,
    sortBy,
    setSortBy,
    addWord,
    updateWord,
    deleteWord,
    isLoaded,
  };
}
