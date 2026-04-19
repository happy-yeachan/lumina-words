'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RotateCcw, Brain, ChevronRight, Zap } from 'lucide-react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { getWordsDueForReview } from '@/lib/storage';

export default function ReviewPage() {
  const { words } = useVocabulary();
  const dueWords = getWordsDueForReview();

  return (
    <div className="px-4 pt-5 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Review</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose your study mode
        </p>
      </div>

      {/* Due count banner */}
      {dueWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3"
        >
          <Zap size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-bold">{dueWords.length}</span> word{dueWords.length > 1 ? 's' : ''} due for review
          </p>
        </motion.div>
      )}

      {/* Mode cards */}
      <div className="space-y-4">
        <Link href="/review/flashcard">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <RotateCcw size={24} className="text-white" />
              </div>
              <ChevronRight size={20} className="text-indigo-200 mt-1" />
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-white">Flashcards</h2>
              <p className="text-indigo-200 text-sm mt-1">Spaced repetition for long-term memory</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {Math.min(dueWords.length, 20)} cards ready
              </span>
              <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                Smart scheduling
              </span>
            </div>
          </motion.div>
        </Link>

        <Link href="/review/quiz">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-6 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <ChevronRight size={20} className="text-purple-200 mt-1" />
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-white">Quiz Mode</h2>
              <p className="text-purple-200 text-sm mt-1">Multiple choice — test your knowledge</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                10 questions
              </span>
              <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                Score tracking
              </span>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Tips */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Study Tips</h3>
        <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">•</span>
            Review daily to build long-term memory
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">•</span>
            Rate honestly — "Hard" cards come back sooner
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">•</span>
            Read example sentences aloud for best retention
          </li>
        </ul>
      </div>
    </div>
  );
}
