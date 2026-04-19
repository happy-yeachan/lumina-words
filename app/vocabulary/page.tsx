'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, SlidersHorizontal, X, Download, Upload, BookOpen } from 'lucide-react';
import { useVocabulary, type SortOption } from '@/hooks/useVocabulary';
import { WordCard } from '@/components/vocabulary/WordCard';
import { AddEditWordModal } from '@/components/vocabulary/AddEditWordModal';
import { EmptyState, Skeleton, Badge } from '@/components/ui/index';
import type { Word, Difficulty } from '@/types';
import { exportData, importData } from '@/lib/storage';
import { cn } from '@/lib/utils';

const DIFFICULTIES: Array<{ value: Difficulty | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'hard', label: 'Hard' },
  { value: 'medium', label: 'Medium' },
  { value: 'easy', label: 'Easy' },
];

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical', label: 'A–Z' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'due', label: 'Due First' },
];

export default function VocabularyPage() {
  const {
    words,
    filteredWords,
    searchQuery,
    setSearchQuery,
    filterDifficulty,
    setFilterDifficulty,
    sortBy,
    setSortBy,
    addWord,
    updateWord,
    deleteWord,
    isLoaded,
  } = useVocabulary();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editWord, setEditWord] = useState<Word | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSave = (data: Parameters<typeof addWord>[0]) => {
    if (editWord) {
      updateWord({ ...editWord, ...data });
      setEditWord(null);
    } else {
      addWord(data);
    }
    setShowAddModal(false);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-words-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        importData(text);
        window.location.reload();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 space-y-3 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Vocabulary</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{words.length} words saved</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters((f) => !f)}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl transition-colors',
                showFilters
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              )}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={17} />
            </button>
            <button
              onClick={() => { setEditWord(null); setShowAddModal(true); }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2.5"
            >
              {/* Difficulty filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {DIFFICULTIES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterDifficulty(value)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                      filterDifficulty === value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SORTS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                      sortBy === value
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Import / Export */}
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download size={13} />
                  Export JSON
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Upload size={13} />
                  Import JSON
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Word List */}
      <div className="px-4 pb-4 flex-1">
        {!isLoaded ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredWords.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={32} />}
            title={words.length === 0 ? 'No words yet' : 'No results found'}
            description={
              words.length === 0
                ? 'Start building your vocabulary by adding your first word!'
                : 'Try adjusting your search or filters.'
            }
            action={
              words.length === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-colors"
                >
                  <Plus size={16} />
                  Add your first word
                </motion.button>
              ) : undefined
            }
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2.5">
              {filteredWords.map((word, index) => (
                <WordCard
                  key={word.id}
                  word={word}
                  index={index}
                  onEdit={(w) => { setEditWord(w); setShowAddModal(true); }}
                  onDelete={deleteWord}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AddEditWordModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditWord(null); }}
        onSave={handleSave}
        editWord={editWord}
      />
    </div>
  );
}
