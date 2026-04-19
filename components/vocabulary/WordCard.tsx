'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Word } from '@/types';
import { Badge } from '@/components/ui/index';
import { formatDate, formatDueDate, speak, cn } from '@/lib/utils';

interface WordCardProps {
  word: Word;
  onEdit: (word: Word) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export function WordCard({ word, onEdit, onDelete, index = 0 }: WordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(word.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  const isDue = !word.nextReview || new Date(word.nextReview) <= new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      layout
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden"
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Difficulty dot */}
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
          word.difficulty === 'easy' ? 'bg-emerald-500' :
          word.difficulty === 'medium' ? 'bg-amber-500' : 'bg-red-500'
        )} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {word.english}
            </span>
            {isDue && (
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                Review due
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 truncate">{word.korean}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => speak(word.english)}
            aria-label={`Pronounce ${word.english}`}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <Volume2 size={15} />
          </button>
          <button
            onClick={() => onEdit(word)}
            aria-label="Edit word"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete word"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
              confirmDelete
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500'
            )}
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
              {word.exampleEnglish && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Example</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">&ldquo;{word.exampleEnglish}&rdquo;</p>
                  {word.exampleKorean && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{word.exampleKorean}</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={word.difficulty}>{word.difficulty}</Badge>
                {word.tags.map((tag) => (
                  <Badge key={tag} variant="default">#{tag}</Badge>
                ))}
              </div>

              <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span>Added: {formatDate(word.createdAt)}</span>
                <span>Reviewed: {word.reviewCount}×</span>
                <span>{formatDueDate(word.nextReview)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
