'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import type { AppSettings } from '@/types';

export function useTheme() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const s = getSettings();
    setSettings(s);

    const apply = (theme: 'light' | 'dark') => {
      setResolvedTheme(theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };

    if (s.darkMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      apply(s.darkMode);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = prev.darkMode === 'dark' ? 'light' : 'dark';
      const updated = { ...prev, darkMode: next as AppSettings['darkMode'] };
      saveSettings(updated);
      document.documentElement.classList.toggle('dark', next === 'dark');
      setResolvedTheme(next);
      return updated;
    });
  }, []);

  return { resolvedTheme, settings, toggleTheme };
}
