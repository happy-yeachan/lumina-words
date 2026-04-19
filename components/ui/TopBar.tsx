'use client';

import { Moon, Sun, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useStats } from '@/hooks/useStats';
import { useState, useEffect } from 'react';
import { getUserProgress, getLevel } from '@/lib/storage';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function TopBar({ title, rightAction }: TopBarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { stats } = useStats();
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    const p = getUserProgress();
    setTotalXP(p.totalXP);
  }, []);

  const level = getLevel(totalXP);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl safe-area-pt">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
            {title ?? 'Lumina Words'}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {rightAction}

          {/* XP Level badge */}
          {totalXP > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-bold"
            >
              <Zap size={12} className="text-amber-500 fill-amber-400" />
              <span>Lv.{level}</span>
            </motion.div>
          )}

          {/* Streak */}
          {stats && stats.currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              <Flame size={13} />
              <span>{stats.currentStreak}</span>
            </motion.div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <motion.div
              key={resolvedTheme}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </button>
        </div>
      </div>
    </header>
  );
}

