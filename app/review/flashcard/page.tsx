'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFlashcards } from '@/hooks/useReview';
import { useVocabulary } from '@/hooks/useVocabulary';
import { FlashCard } from '@/components/review/FlashCard';
import { SessionComplete } from '@/components/review/SessionComplete';
import { ProgressBar, EmptyState } from '@/components/ui/index';

export default function FlashcardPage() {
  const router = useRouter();
  const { words, isLoaded } = useVocabulary();
  const [key, setKey] = useState(0);

  return (
    <FlashcardSession
      key={key}
      words={words}
      isLoaded={isLoaded}
      onRestart={() => setKey((k) => k + 1)}
      onBack={() => router.push('/review')}
    />
  );
}

function FlashcardSession({
  words,
  isLoaded,
  onRestart,
  onBack,
}: {
  words: ReturnType<typeof useVocabulary>['words'];
  isLoaded: boolean;
  onRestart: () => void;
  onBack: () => void;
}) {
  const {
    currentWord,
    currentIndex,
    totalWords,
    isFlipped,
    flip,
    rate,
    isComplete,
    correctCount,
    progress,
  } = useFlashcards(words);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="px-4 pt-4">
        <SessionComplete
          correct={correctCount}
          total={totalWords}
          mode="flashcard"
          onRestart={onRestart}
        />
      </div>
    );
  }

  if (totalWords === 0) {
    return (
      <div className="px-4 pt-4">
        <EmptyState
          icon={<RotateCcw size={32} />}
          title="All caught up!"
          description="No words are due for review right now. Add more words or check back later."
          action={
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold"
            >
              Back to Review
            </button>
          }
        />
      </div>
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
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {totalWords}
          </span>
          <div className="w-9" />
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center pt-4">
        <AnimatePresence mode="wait">
          {currentWord && (
            <motion.div
              key={currentWord.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full"
            >
              <FlashCard
                word={currentWord}
                isFlipped={isFlipped}
                onFlip={flip}
                onRate={rate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
