'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RotateCcw } from 'lucide-react';
import type { Word } from '@/types';
import { speak, cn } from '@/lib/utils';

interface FlashCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: 'hard' | 'good' | 'easy') => void;
}

export function FlashCard({ word, isFlipped, onFlip, onRate }: FlashCardProps) {
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4">
      {/* Card */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={onFlip}
        role="button"
        aria-label={isFlipped ? 'Show front' : 'Tap to reveal answer'}
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
          className="relative w-full"
        >
          {/* Front */}
          <div
            className="backface-hidden w-full min-h-[240px] bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center p-8 gap-4"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-xs uppercase tracking-widest text-indigo-400 dark:text-indigo-500 font-semibold">English</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center leading-tight">
              {word.english}
            </h2>
            <button
              onClick={(e) => { e.stopPropagation(); speak(word.english); }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <Volume2 size={16} />
              Pronounce
            </button>
            <div className="absolute bottom-5 flex items-center gap-2 text-xs text-slate-300 dark:text-slate-600">
              <RotateCcw size={12} />
              <span>Tap to reveal</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 min-h-[240px] bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 gap-3"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">Korean</div>
            <h2 className="text-2xl font-bold text-white text-center leading-tight">
              {word.korean}
            </h2>
            {word.exampleEnglish && (
              <div className="mt-2 text-center">
                <p className="text-sm text-indigo-100 italic">&ldquo;{word.exampleEnglish}&rdquo;</p>
                {word.exampleKorean && (
                  <p className="text-xs text-indigo-200 mt-1">{word.exampleKorean}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only show when flipped */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-3 w-full"
          >
            {[
              { label: 'Hard', value: 'hard' as const, color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', emoji: '😓' },
              { label: 'Good', value: 'good' as const, color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', emoji: '🙂' },
              { label: 'Easy', value: 'easy' as const, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', emoji: '🚀' },
            ].map(({ label, value, color, emoji }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.93 }}
                onClick={() => onRate(value)}
                className={cn(
                  'flex-1 py-3 rounded-2xl font-semibold text-sm border-2 transition-colors flex flex-col items-center gap-1',
                  color
                )}
              >
                <span className="text-lg">{emoji}</span>
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isFlipped && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onFlip}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
        >
          Reveal Answer
        </motion.button>
      )}
    </div>
  );
}
