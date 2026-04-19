'use client';

import { useState, useEffect } from 'react';
import { Volume2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import type { Word, Difficulty } from '@/types';
import { speak, cn } from '@/lib/utils';

interface WordFormData {
  english: string;
  korean: string;
  exampleEnglish: string;
  exampleKorean: string;
  difficulty: Difficulty;
  tags: string;
}

const DEFAULT_FORM: WordFormData = {
  english: '',
  korean: '',
  exampleEnglish: '',
  exampleKorean: '',
  difficulty: 'medium',
  tags: '',
};

interface AddEditWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Word, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'reviewCount' | 'easeFactor' | 'interval' | 'streak'>) => void;
  editWord?: Word | null;
}

export function AddEditWordModal({ isOpen, onClose, onSave, editWord }: AddEditWordModalProps) {
  const [form, setForm] = useState<WordFormData>(DEFAULT_FORM);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<WordFormData>>({});

  useEffect(() => {
    if (editWord) {
      setForm({
        english: editWord.english,
        korean: editWord.korean,
        exampleEnglish: editWord.exampleEnglish,
        exampleKorean: editWord.exampleKorean,
        difficulty: editWord.difficulty,
        tags: editWord.tags.join(', '),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
    setSaved(false);
  }, [editWord, isOpen]);

  const validate = (): boolean => {
    const errs: Partial<WordFormData> = {};
    if (!form.english.trim()) errs.english = 'Required';
    if (!form.korean.trim()) errs.korean = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      english: form.english.trim(),
      korean: form.korean.trim(),
      exampleEnglish: form.exampleEnglish.trim(),
      exampleKorean: form.exampleKorean.trim(),
      difficulty: form.difficulty,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const field = (
    name: keyof WordFormData,
    label: string,
    placeholder: string,
    options?: { multiline?: boolean; required?: boolean }
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
        {label}
        {options?.required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {options?.multiline ? (
        <textarea
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          rows={2}
          className={cn(
            'w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border transition-colors resize-none',
            'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
            errors[name]
              ? 'border-red-400 dark:border-red-500'
              : 'border-slate-200 dark:border-slate-700'
          )}
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={form[name]}
            onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border transition-colors',
              'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
              errors[name]
                ? 'border-red-400 dark:border-red-500'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {name === 'english' && form.english && (
            <button
              type="button"
              onClick={() => speak(form.english)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
              aria-label="Pronounce"
            >
              <Volume2 size={16} />
            </button>
          )}
        </div>
      )}
      {errors[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700' },
    { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editWord ? 'Edit Word' : 'Add New Word'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {field('english', 'English Word / Phrase', 'e.g. serendipity', { required: true })}
        {field('korean', 'Korean Translation', 'e.g. 우연한 행운', { required: true })}
        {field('exampleEnglish', 'Example Sentence', 'e.g. It was a serendipitous meeting.', { multiline: true })}
        {field('exampleKorean', 'Example Translation', 'e.g. 그것은 우연한 만남이었다.', { multiline: true })}

        {/* Difficulty */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, difficulty: value }))}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                  form.difficulty === value ? color : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {field('tags', 'Tags (optional)', 'e.g. business, idiom, phrasal-verb')}

        {/* Submit */}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full py-3.5 rounded-2xl font-semibold text-sm transition-colors mt-2',
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          )}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Saved!
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {editWord ? 'Update Word' : 'Save Word'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </Modal>
  );
}
