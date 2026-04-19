'use client';

import { useState, useEffect } from 'react';
import { getStats, getWords, updateStreak, getSettings } from '@/lib/storage';
import type { AppStats } from '@/types';

export function useStats() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = () => {
    const rawStats = getStats();
    const words = getWords();
    const settings = getSettings();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const reviewDueCount = words.filter((w) => {
      if (!w.nextReview) return true;
      return new Date(w.nextReview) <= now;
    }).length;

    // Count words added today
    const wordsLearnedToday = words.filter(
      (w) => w.createdAt.split('T')[0] === today
    ).length;

    // Check if we should update the streak
    const updatedStats = {
      ...rawStats,
      totalWords: words.length,
      reviewDueCount,
      wordsLearnedToday,
      dailyGoal: settings.dailyGoal,
    };

    setStats(updatedStats);
    setIsLoaded(true);
  };

  useEffect(() => {
    refresh();
    // Refresh every minute to keep due counts accurate
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const markStudied = () => {
    const updated = updateStreak();
    setStats((prev) => prev ? { ...prev, ...updated } : updated);
  };

  return { stats, isLoaded, refresh, markStudied };
}
