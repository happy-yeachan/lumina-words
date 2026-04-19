'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, CheckCircle2, AlertCircle, RotateCcw, Home } from 'lucide-react';
import type { EvaluationResult } from '@/types';
import { useRouter } from 'next/navigation';

interface ReportCardProps {
  result: EvaluationResult;
  scenarioEmoji: string;
  scenarioTitle: string;
  xpBefore: number;
  onPlayAgain: () => void;
}

// ─── Animated score circle ────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1400; // ms
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayed(Math.round(ease * score));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [score]);

  const strokeColor =
    score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        {/* Track */}
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="10"
          className="text-slate-200 dark:text-slate-700" />
        {/* Progress */}
        <motion.circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      {/* Score number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
          {displayed}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ─── Confetti burst ───────────────────────────────────────────────────────────

function useConfetti(score: number) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || score < 60) return;
    fired.current = true;
    import('canvas-confetti').then(({ default: confetti }) => {
      const count = score >= 80 ? 200 : 100;
      confetti({
        particleCount: count,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'],
        zIndex: 9999,
      });
      if (score >= 90) {
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.5 }, zIndex: 9999 }), 500);
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.5 }, zIndex: 9999 }), 700);
      }
    });
  }, [score]);
}

// ─── XP Counter ───────────────────────────────────────────────────────────────

function XPCounter({ xp }: { xp: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      setDisplayed(Math.round(ease * xp));
      if (t < 1) requestAnimationFrame(tick);
    }
    const id = setTimeout(() => requestAnimationFrame(tick), 600); // delay start
    return () => clearTimeout(id);
  }, [xp]);
  return <>{displayed}</>;
}

// ─── Main ReportCard ──────────────────────────────────────────────────────────

export function ReportCard({ result, scenarioEmoji, scenarioTitle, xpBefore, onPlayAgain }: ReportCardProps) {
  const router = useRouter();
  useConfetti(result.score);

  const grade =
    result.score >= 90 ? { label: 'Excellent!', color: 'text-emerald-600 dark:text-emerald-400' }
    : result.score >= 75 ? { label: 'Great Job!', color: 'text-blue-600 dark:text-blue-400' }
    : result.score >= 60 ? { label: 'Good Effort!', color: 'text-amber-600 dark:text-amber-400' }
    : result.score >= 40 ? { label: 'Keep Going!', color: 'text-orange-600 dark:text-orange-400' }
    : { label: 'Keep Practicing', color: 'text-red-500 dark:text-red-400' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl overflow-y-auto max-h-[92dvh] pb-safe"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="px-6 pb-8">
          {/* Scenario label */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
            {scenarioEmoji} {scenarioTitle}
          </p>

          {/* Grade title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-center text-2xl font-black mt-1 ${grade.color}`}
          >
            {grade.label}
          </motion.h2>

          {/* Score circle + XP badge */}
          <div className="flex items-center justify-center gap-8 mt-5">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
            >
              <ScoreCircle score={result.score} />
            </motion.div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 18 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/30">
                <Star size={28} className="text-white fill-white" />
              </div>
              <p className="text-xl font-black text-amber-500 mt-1.5">
                +<XPCounter xp={result.xp_earned} />
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">XP earned</p>
            </motion.div>
          </div>

          {/* Total XP progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Total XP</span>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {xpBefore} → {xpBefore + result.xp_earned}
              </span>
            </div>
            <div className="h-2 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((xpBefore + result.xp_earned) / 5000) * 100)}%` }}
                transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </motion.div>

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
          >
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.feedback}</p>
          </motion.div>

          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="mt-4"
          >
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Strengths
            </p>
            <div className="space-y-2">
              {result.strengths.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{s}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Improvements */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 }}
            className="mt-4"
          >
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              To Improve
            </p>
            <div className="space-y-2">
              {result.improvements.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{s}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-7 flex gap-3"
          >
            <button
              onClick={() => router.push('/')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all active:scale-95"
            >
              <Home size={16} />
              Home
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              New Mission
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
