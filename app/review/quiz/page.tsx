'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/hooks/useReview';
import { useVocabulary } from '@/hooks/useVocabulary';
import { QuizCard } from '@/components/review/QuizCard';
import { SessionComplete } from '@/components/review/SessionComplete';
import { ProgressBar, EmptyState } from '@/components/ui/index';
import type { QuizDirection } from '@/types';
import { cn } from '@/lib/utils';

export default function QuizPage() {
  const router = useRouter();
  const { words, isLoaded } = useVocabulary();
  const [direction, setDirection] = useState<QuizDirection>('en-to-kr');
  const [started, setStarted] = useState(false);
  const [key, setKey] = useState(0);

  if (!started) {
    return (
      <div className="px-4 pt-5 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/review')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Mode</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose direction</p>
          </div>
        </div>

        <div className="space-y-3">
          {([
            { value: 'en-to-kr' as const, label: 'English → Korean', desc: 'See English, choose Korean meaning' },
            { value: 'kr-to-en' as const, label: 'Korean → English', desc: 'See Korean, choose English word' },
          ]).map(({ value, label, desc }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDirection(value)}
              className={cn(
                'w-full text-left p-5 rounded-2xl border-2 transition-all',
                direction === value
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              )}
            >
              <div className={cn('font-semibold text-sm', direction === value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white')}>
                {label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</div>
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setStarted(true); setKey((k) => k + 1); }}
          disabled={words.length < 4}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Brain size={18} />
          {words.length < 4 ? 'Add at least 4 words to start' : 'Start Quiz'}
        </motion.button>

        {words.length < 4 && (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            You have {words.length} word{words.length !== 1 ? 's' : ''}. You need at least 4 for a quiz.
          </p>
        )}
      </div>
    );
  }

  return (
    <QuizSession
      key={key}
      words={words}
      isLoaded={isLoaded}
      direction={direction}
      onBack={() => setStarted(false)}
      onRestart={() => { setKey((k) => k + 1); }}
    />
  );
}

function QuizSession({
  words,
  isLoaded,
  direction,
  onBack,
  onRestart,
}: {
  words: ReturnType<typeof useVocabulary>['words'];
  isLoaded: boolean;
  direction: QuizDirection;
  onBack: () => void;
  onRestart: () => void;
}) {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedIndex,
    answered,
    score,
    isComplete,
    select,
    next,
    progress,
  } = useQuiz(words, direction);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="px-4 pt-4">
        <SessionComplete
          correct={score}
          total={totalQuestions}
          mode="quiz"
          onRestart={onRestart}
        />
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <EmptyState
        icon={<Brain size={32} />}
        title="Not enough words"
        description="Add at least 4 words to start a quiz."
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {currentIndex + 1} / {totalQuestions}
            </span>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Score: {score}
            </div>
          </div>
          <div className="w-9" />
        </div>
        <ProgressBar value={progress} color="bg-purple-500" />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center pt-2">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full"
            >
              <QuizCard
                question={currentQuestion}
                selectedIndex={selectedIndex}
                answered={answered}
                onSelect={select}
                onNext={next}
                isLast={currentIndex + 1 === totalQuestions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
