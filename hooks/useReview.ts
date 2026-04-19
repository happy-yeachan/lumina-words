'use client';

import { useState, useCallback } from 'react';
import type { Word, FlashcardResult, QuizQuestion, QuizDirection } from '@/types';
import { applySpacedRepetition, getWordsForSession, generateQuizDistractors } from '@/lib/spacedRepetition';
import { updateWord, addSession, updateStreak } from '@/lib/storage';
import { generateId, shuffle } from '@/lib/utils';

// ─── Flashcard Hook ───────────────────────────────────────────────────────────

export function useFlashcards(words: Word[]) {
  const sessionWords = getWordsForSession(words, 20);
  const [queue, setQueue] = useState<Word[]>(sessionWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [isComplete, setIsComplete] = useState(sessionWords.length === 0);
  const [startTime] = useState(Date.now());

  const currentWord = queue[currentIndex] ?? null;
  const progress = sessionWords.length > 0 ? currentIndex / sessionWords.length : 0;

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const rate = useCallback(
    (rating: FlashcardResult['rating']) => {
      if (!currentWord) return;

      const result: FlashcardResult = {
        wordId: currentWord.id,
        rating,
        timestamp: new Date().toISOString(),
      };

      const updatedWord = applySpacedRepetition(currentWord, result);
      updateWord(updatedWord);

      const newResults = [...results, result];
      setResults(newResults);
      setIsFlipped(false);

      if (currentIndex + 1 >= queue.length) {
        // Session complete
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const correct = newResults.filter((r) => r.rating !== 'hard').length;
        addSession({
          id: generateId(),
          date: new Date().toISOString(),
          wordsReviewed: newResults.length,
          correctCount: correct,
          mode: 'flashcard',
          duration,
        });
        updateStreak();
        setIsComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentWord, currentIndex, queue.length, results, startTime]
  );

  const correctCount = results.filter((r) => r.rating !== 'hard').length;

  return {
    currentWord,
    currentIndex,
    totalWords: sessionWords.length,
    isFlipped,
    flip,
    rate,
    isComplete,
    results,
    correctCount,
    progress,
  };
}

// ─── Quiz Hook ────────────────────────────────────────────────────────────────

export function useQuiz(words: Word[], direction: QuizDirection = 'en-to-kr') {
  const sessionWords = shuffle(getWordsForSession(words, 10));

  const buildQuestions = (wordList: Word[]): QuizQuestion[] =>
    wordList.map((word) => {
      const options = generateQuizDistractors(word, words, direction);
      const correct = direction === 'en-to-kr' ? word.korean : word.english;
      return {
        word,
        options,
        correctIndex: options.indexOf(correct),
        direction,
      };
    });

  const [questions] = useState<QuizQuestion[]>(buildQuestions(sessionWords));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(questions.length === 0);
  const [answered, setAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex] ?? null;

  const select = useCallback(
    (index: number) => {
      if (answered || !currentQuestion) return;
      setSelectedIndex(index);
      setAnswered(true);

      const isCorrect = index === currentQuestion.correctIndex;
      if (isCorrect) {
        setScore((s) => s + 1);
        // Update word on correct answer
        const result: FlashcardResult = {
          wordId: currentQuestion.word.id,
          rating: 'good',
          timestamp: new Date().toISOString(),
        };
        updateWord(applySpacedRepetition(currentQuestion.word, result));
      }
    },
    [answered, currentQuestion]
  );

  const next = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      addSession({
        id: generateId(),
        date: new Date().toISOString(),
        wordsReviewed: questions.length,
        correctCount: score + (selectedIndex === currentQuestion?.correctIndex ? 1 : 0),
        mode: 'quiz',
        duration,
      });
      updateStreak();
      setIsComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setAnswered(false);
    }
  }, [currentIndex, questions.length, score, selectedIndex, currentQuestion, startTime]);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    selectedIndex,
    answered,
    score,
    isComplete,
    select,
    next,
    progress: questions.length > 0 ? currentIndex / questions.length : 0,
  };
}
