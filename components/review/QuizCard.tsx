'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, X } from 'lucide-react';
import type { QuizQuestion } from '@/types';
import { speak, cn } from '@/lib/utils';

interface QuizCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
  isLast?: boolean;
}

export function QuizCard({
  question,
  selectedIndex,
  answered,
  onSelect,
  onNext,
  isLast,
}: QuizCardProps) {
  const prompt =
    question.direction === 'en-to-kr'
      ? question.word.english
      : question.word.korean;

  const promptLabel = question.direction === 'en-to-kr' ? 'English' : 'Korean';

  return (
    <div className="flex flex-col gap-5 w-full max-w-sm mx-auto px-4">
      {/* Prompt Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-7 text-center shadow-xl">
        <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold mb-3">{promptLabel}</p>
        <h2 className="text-2xl font-bold text-white">{prompt}</h2>
        {question.direction === 'en-to-kr' && (
          <button
            onClick={() => speak(prompt)}
            className="mt-3 flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors mx-auto"
          >
            <Volume2 size={15} />
            Pronounce
          </button>
        )}
        {question.word.exampleEnglish && (
          <p className="text-sm text-indigo-200 italic mt-3">
            &ldquo;{question.word.exampleEnglish}&rdquo;
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isCorrect = idx === question.correctIndex;
          const isSelected = idx === selectedIndex;

          let state: 'default' | 'correct' | 'wrong' | 'reveal' = 'default';
          if (answered) {
            if (isSelected && isCorrect) state = 'correct';
            else if (isSelected && !isCorrect) state = 'wrong';
            else if (!isSelected && isCorrect) state = 'reveal';
          }

          return (
            <motion.button
              key={idx}
              whileTap={!answered ? { scale: 0.97 } : {}}
              onClick={() => !answered && onSelect(idx)}
              className={cn(
                'w-full px-4 py-3.5 rounded-2xl text-left font-medium text-sm transition-all border-2 flex items-center justify-between gap-3',
                state === 'default' && 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
                state === 'correct' && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300',
                state === 'wrong' && 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300',
                state === 'reveal' && 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400 opacity-80'
              )}
            >
              <span>{option}</span>
              <AnimatePresence>
                {answered && (isCorrect || isSelected) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                      isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    )}
                  >
                    {isCorrect ? <Check size={13} /> : <X size={13} />}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      <AnimatePresence>
        {answered && (
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            {isLast ? 'See Results' : 'Next Question →'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
