'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SessionCompleteProps {
  correct: number;
  total: number;
  mode: 'flashcard' | 'quiz';
  onRestart?: () => void;
}

function Confetti() {
  const items = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ y: -20, x: `${item.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 720 }}
          transition={{ duration: 2.5, delay: item.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, width: item.size, height: item.size, backgroundColor: item.color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export function SessionComplete({ correct, total, mode, onRestart }: SessionCompleteProps) {
  const router = useRouter();
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getMessage = () => {
    if (percent === 100) return { title: 'Perfect! 🎉', sub: 'You nailed every single one!' };
    if (percent >= 80) return { title: 'Excellent! 🌟', sub: 'You\'re on a roll!' };
    if (percent >= 60) return { title: 'Good job! 👍', sub: 'Keep practicing to improve.' };
    return { title: 'Keep going! 💪', sub: 'Practice makes perfect.' };
  };

  const { title, sub } = getMessage();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
      {percent >= 60 && <Confetti />}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl"
      >
        <Trophy size={40} className="text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{sub}</p>
      </motion.div>

      {/* Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 w-full max-w-xs"
      >
        <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{percent}%</div>
        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {correct} / {total} {mode === 'quiz' ? 'correct answers' : 'words reviewed'}
        </div>

        {/* Bar */}
        <div className="mt-4 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              percent >= 80 ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-500' : 'bg-red-500'
            )}
          />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 w-full max-w-xs"
      >
        {onRestart && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="flex-1 py-3 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Again
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/')}
          className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Home size={16} />
          Home
        </motion.button>
      </motion.div>
    </div>
  );
}
