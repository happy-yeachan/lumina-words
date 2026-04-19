'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-1
  className?: string;
  color?: string;
}

export function ProgressBar({ value, className, color = 'bg-indigo-500' }: ProgressBarProps) {
  return (
    <div className={cn('h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'default' | 'indigo';
  className?: string;
}

const BADGE_VARIANTS = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', BADGE_VARIANTS[variant], className)}>
      {children}
    </span>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl', className)} />
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">{description}</p>
      {action}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtext?: string;
}

export function StatCard({ label, value, icon, color = 'bg-indigo-500', subtext }: StatCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50"
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white', color)}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
      {subtext && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</div>}
    </motion.div>
  );
}
