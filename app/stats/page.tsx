'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Flame, BookOpen, CheckCircle, Clock, Target } from 'lucide-react';
import { getStats, getWords, getSettings, saveSettings } from '@/lib/storage';
import type { AppStats, AppSettings } from '@/types';
import { getWeekDates, cn } from '@/lib/utils';

interface ExtendedStats extends AppStats {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  avgAccuracy: number;
  totalStudyTime: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<ExtendedStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [weekActivity, setWeekActivity] = useState<Record<string, number>>({});
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    const rawStats = getStats();
    const words = getWords();
    const s = getSettings();
    setSettings(s);
    setGoalInput(String(s.dailyGoal));

    const easyCount = words.filter((w) => w.difficulty === 'easy').length;
    const mediumCount = words.filter((w) => w.difficulty === 'medium').length;
    const hardCount = words.filter((w) => w.difficulty === 'hard').length;

    const sessions = rawStats.sessions || [];
    const totalCorrect = sessions.reduce((a, s) => a + s.correctCount, 0);
    const totalReviewed = sessions.reduce((a, s) => a + s.wordsReviewed, 0);
    const avgAccuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;
    const totalStudyTime = sessions.reduce((a, s) => a + s.duration, 0);

    const activity: Record<string, number> = {};
    sessions.forEach((session) => {
      const day = session.date.split('T')[0];
      activity[day] = (activity[day] || 0) + session.wordsReviewed;
    });
    setWeekActivity(activity);

    setStats({
      ...rawStats,
      totalWords: words.length,
      easyCount,
      mediumCount,
      hardCount,
      avgAccuracy,
      totalStudyTime,
    });
  }, []);

  const saveGoal = () => {
    const goal = parseInt(goalInput, 10);
    if (!isNaN(goal) && goal > 0 && settings) {
      const updated = { ...settings, dailyGoal: goal };
      saveSettings(updated);
      setSettings(updated);
    }
    setEditingGoal(false);
  };

  const weekDates = getWeekDates();
  const maxActivity = Math.max(...weekDates.map((d) => weekActivity[d] || 0), 1);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Statistics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your learning journey</p>
      </div>

      {/* Main stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { label: 'Total Words', value: stats?.totalWords ?? 0, icon: <BookOpen size={18} />, color: 'bg-indigo-500' },
          { label: 'Day Streak', value: stats?.currentStreak ?? 0, icon: <Flame size={18} />, color: 'bg-orange-500' },
          { label: 'Total Reviews', value: stats?.totalReviews ?? 0, icon: <CheckCircle size={18} />, color: 'bg-emerald-500' },
          { label: 'Accuracy', value: `${stats?.avgAccuracy ?? 0}%`, icon: <BarChart2 size={18} />, color: 'bg-purple-500' },
        ].map(({ label, value, icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white', color)}>
              {icon}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Study time */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-4"
      >
        <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {formatTime(stats?.totalStudyTime ?? 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total study time</div>
        </div>
      </motion.div>

      {/* Difficulty breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50"
      >
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Word Difficulty</h3>
        <div className="space-y-3">
          {[
            { label: 'Easy', count: stats?.easyCount ?? 0, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Medium', count: stats?.mediumCount ?? 0, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
            { label: 'Hard', count: stats?.hardCount ?? 0, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
          ].map(({ label, count, color, textColor }) => {
            const total = (stats?.totalWords ?? 0) || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn('font-medium', textColor)}>{label}</span>
                  <span className="text-slate-500 dark:text-slate-400">{count} words ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    className={cn('h-full rounded-full', color)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Weekly activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50"
      >
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">7-Day Activity</h3>
        <div className="flex items-end justify-between gap-2 h-20">
          {weekDates.map((date) => {
            const activity = weekActivity[date] || 0;
            const height = activity > 0 ? Math.max(12, (activity / maxActivity) * 72) : 6;
            const isToday = date === new Date().toISOString().split('T')[0];
            const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="flex-1 flex flex-col justify-end w-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'w-full rounded-full',
                      isToday ? 'bg-indigo-600' : activity > 0 ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700'
                    )}
                  />
                </div>
                <span className={cn('text-[10px] font-medium', isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>
                  {dayName.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Target size={18} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Goal</h3>
          </div>
          <button
            onClick={() => setEditingGoal((e) => !e)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium"
          >
            {editingGoal ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingGoal ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              min={1}
              max={100}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            <button
              onClick={saveGoal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              Save
            </button>
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {settings?.dailyGoal ?? 10}
              <span className="text-base font-normal text-slate-400 ml-1">words/day</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Today:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {stats?.wordsLearnedToday ?? 0} / {settings?.dailyGoal ?? 10}
              </span>
            </div>
            {/* Progress */}
            <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, ((stats?.wordsLearnedToday ?? 0) / (settings?.dailyGoal ?? 10)) * 100)}%`
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Sessions */}
      {stats?.sessions && stats.sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {[...stats.sessions].reverse().slice(0, 5).map((session) => {
              const acc = session.wordsReviewed > 0
                ? Math.round((session.correctCount / session.wordsReviewed) * 100)
                : 0;
              return (
                <div key={session.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                      {session.mode} — {session.wordsReviewed} words
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(session.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    acc >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    acc >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {acc}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
