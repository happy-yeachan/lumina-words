'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RotateCcw, BookOpen, Flame, Target, Zap, Brain, TrendingUp, Star,
} from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { StatCard, Skeleton } from '@/components/ui/index';
import { AddEditWordModal } from '@/components/vocabulary/AddEditWordModal';
import { useVocabulary } from '@/hooks/useVocabulary';
import { getWeekDates } from '@/lib/utils';
import { getStats, getUserProgress } from '@/lib/storage';
import { seedSampleData } from '@/lib/seed';

const GREETING_MESSAGES = [
  'Ready to learn?',
  'Let\'s build your vocabulary!',
  'Time to shine! ✨',
  'Every word counts.',
  'Knowledge grows daily.',
];

export default function HomePage() {
  const { stats, isLoaded } = useStats();
  const { addWord } = useVocabulary();
  const [showAddModal, setShowAddModal] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [weekActivity, setWeekActivity] = useState<Record<string, number>>({});
  const [userProgress, setUserProgress] = useState({ totalXP: 0, level: 1, sessionsCompleted: 0 });

  useEffect(() => {
    // Randomise greeting and time-of-day only on the client to avoid hydration mismatch
    setGreeting(GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)]);
    setTimeOfDay(getTimeOfDay());
    seedSampleData();
    const s = getStats();
    const activity: Record<string, number> = {};
    s.sessions?.forEach((session) => {
      const day = session.date.split('T')[0];
      activity[day] = (activity[day] || 0) + session.wordsReviewed;
    });
    setWeekActivity(activity);
    setUserProgress(getUserProgress());
  }, []);

  const weekDates = getWeekDates();
  const maxActivity = Math.max(...weekDates.map((d) => weekActivity[d] || 0), 1);

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold text-white mb-4">Good {timeOfDay} 👋</h1>

          {/* Streak + Today stats */}
          {isLoaded ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2.5">
                <Flame size={18} className="text-orange-300" />
                <div>
                  <div className="text-lg font-bold text-white leading-none">
                    {stats?.currentStreak ?? 0}
                  </div>
                  <div className="text-xs text-indigo-200">day streak</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2.5">
                <Target size={18} className="text-emerald-300" />
                <div>
                  <div className="text-lg font-bold text-white leading-none">
                    {stats?.wordsLearnedToday ?? 0}
                  </div>
                  <div className="text-xs text-indigo-200">today</div>
                </div>
              </div>
              {userProgress.totalXP > 0 && (
                <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2.5">
                  <Star size={18} className="text-amber-300 fill-amber-300" />
                  <div>
                    <div className="text-lg font-bold text-white leading-none">
                      Lv.{userProgress.level}
                    </div>
                    <div className="text-xs text-indigo-200">{userProgress.totalXP} XP</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Skeleton className="h-16 w-28 rounded-2xl bg-white/10" />
              <Skeleton className="h-16 w-28 rounded-2xl bg-white/10" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      {isLoaded ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatCard
            label="Total Words"
            value={stats?.totalWords ?? 0}
            icon={<BookOpen size={18} />}
            color="bg-indigo-500"
          />
          <StatCard
            label="Due Now"
            value={stats?.reviewDueCount ?? 0}
            icon={<Zap size={18} />}
            color={stats?.reviewDueCount ? 'bg-amber-500' : 'bg-slate-400'}
          />
          <StatCard
            label="Best Streak"
            value={stats?.longestStreak ?? 0}
            icon={<TrendingUp size={18} />}
            color="bg-purple-500"
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Quick Actions
        </h2>
        <div className="space-y-2.5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Plus size={22} />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">Add New Word</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Expand your vocabulary</div>
            </div>
          </motion.button>

          <Link href="/review/flashcard">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                <RotateCcw size={22} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Start Review</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stats?.reviewDueCount ? `${stats.reviewDueCount} words due` : 'Practice with flashcards'}
                </div>
              </div>
              {stats?.reviewDueCount ? (
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {Math.min(stats.reviewDueCount, 99)}
                </span>
              ) : null}
            </motion.div>
          </Link>

          <Link href="/review/quiz">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <Brain size={22} />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Quiz Mode</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Test your knowledge</div>
              </div>
            </motion.div>
          </Link>

          <Link href="/conversation">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-4 shadow-sm border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-indigo-500/30 transition-shadow">
                <span className="text-xl">🎭</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Scenario Missions</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Practice real conversations & earn XP</div>
              </div>
              {userProgress.sessionsCompleted > 0 && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Lv.{userProgress.level}
                </span>
              )}
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Weekly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">This Week</h2>
        <div className="flex items-end justify-between gap-1.5 h-16">
          {weekDates.map((date) => {
            const activity = weekActivity[date] || 0;
            const height = activity > 0 ? Math.max(16, (activity / maxActivity) * 60) : 6;
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-full overflow-hidden" style={{ height: 60 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                    className={`w-full rounded-full self-end ${
                      isToday ? 'bg-indigo-600' : activity > 0 ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                    style={{ marginTop: 'auto' }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AddEditWordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(data) => { addWord(data); setShowAddModal(false); }}
      />
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
