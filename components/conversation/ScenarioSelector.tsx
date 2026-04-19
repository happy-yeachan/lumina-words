'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { SCENARIOS, DIFFICULTY_META, type ScenarioDefinition } from '@/lib/scenarios';
import { cn } from '@/lib/utils';

interface ScenarioSelectorProps {
  onStart: (scenario: ScenarioDefinition) => void;
}

export function ScenarioSelector({ onStart }: ScenarioSelectorProps) {
  const [filter, setFilter] = useState<ScenarioDefinition['difficulty'] | 'All'>('All');
  // Brief visual "tap" state — shows ring flash before navigating
  const [tappedId, setTappedId] = useState<string | null>(null);

  const visible = filter === 'All' ? SCENARIOS : SCENARIOS.filter((s) => s.difficulty === filter);

  const handleCardTap = (scenario: ScenarioDefinition) => {
    if (tappedId) return; // prevent double-tap
    setTappedId(scenario.id);
    // Tiny delay so the tap ring is visible before the phase transition
    setTimeout(() => onStart(scenario), 180);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Choose Your Mission</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Tap a scenario to start instantly
        </p>

        {/* Difficulty filter pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                filter === d
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable grid — no sticky bottom button needed */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        <motion.div layout className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {visible.map((scenario, i) => {
              const isTapped = tappedId === scenario.id;
              const diff = DIFFICULTY_META[scenario.difficulty];

              return (
                <motion.button
                  key={scenario.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleCardTap(scenario)}
                  disabled={!!tappedId}
                  className={cn(
                    'relative rounded-2xl overflow-hidden text-left transition-all',
                    'ring-2',
                    isTapped
                      ? 'ring-white shadow-xl shadow-black/25 scale-[1.03]'
                      : 'ring-transparent shadow-md hover:shadow-lg'
                  )}
                  style={{ background: `linear-gradient(145deg, ${scenario.colorFrom}, ${scenario.colorTo})` }}
                >
                  {/* Tap confirmation checkmark */}
                  <AnimatePresence>
                    {isTapped && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center z-10 shadow-sm"
                      >
                        <span className="text-sm">✓</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card content */}
                  <div className="p-4 pb-3">
                    <div className="text-4xl mb-3">{scenario.emoji}</div>
                    <p className="font-bold text-white text-sm leading-tight">{scenario.title}</p>
                    <p className="text-white/70 text-xs mt-0.5 leading-snug">{scenario.subtitle}</p>
                    <div className="mt-2.5">
                      <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {diff.label}
                      </span>
                    </div>
                  </div>

                  {/* Goal strip */}
                  <div className="bg-black/20 px-3 py-2">
                    <div className="flex items-start gap-1.5">
                      <Target size={10} className="text-white/70 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-white/80 leading-snug line-clamp-2">{scenario.goal}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
