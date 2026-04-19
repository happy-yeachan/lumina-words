'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkCheck, X } from 'lucide-react';

export interface VocabToast {
  id: string;
  word: string;
  isDuplicate?: boolean;
}

interface UseToastReturn {
  toasts: VocabToast[];
  pushToast: (word: string, isDuplicate?: boolean) => void;
  dismissToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<VocabToast[]>([]);

  const pushToast = useCallback((word: string, isDuplicate = false) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, word, isDuplicate }]); // max 4 visible
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

interface ToastStackProps {
  toasts: VocabToast[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    // Portal-like: fixed, above everything, centered below the top bar
    <div
      className="fixed top-16 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={`
              pointer-events-auto
              flex items-center gap-2.5
              px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium
              max-w-xs w-full
              ${toast.isDuplicate
                ? 'bg-slate-700 dark:bg-slate-600 text-slate-100 shadow-slate-700/20'
                : 'bg-emerald-600 text-white shadow-emerald-500/25'
              }
            `}
          >
            <BookmarkCheck size={15} className="flex-shrink-0" />
            <span className="flex-1 truncate">
              {toast.isDuplicate
                ? `Already saved: "${toast.word}"`
                : <><span className="opacity-80">✨ Added to Vocab: </span><strong>{toast.word}</strong></>
              }
            </span>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss"
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
