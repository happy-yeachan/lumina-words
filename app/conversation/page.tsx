'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, RotateCcw,
  Volume2, AlertCircle, WifiOff, CheckCheck,
  Flag, Target, Loader2,
} from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast, ToastStack } from '@/components/ui/Toast';
import { speak, cn, generateId } from '@/lib/utils';
import { getWords, addWord as saveWordToStorage, getUserProgress, addXP } from '@/lib/storage';
import type { Word, Correction, ChatApiResponse, EvaluationResult } from '@/types';
import { SCENARIOS, type ScenarioDefinition } from '@/lib/scenarios';
import { ScenarioSelector } from '@/components/conversation/ScenarioSelector';
import { ReportCard } from '@/components/conversation/ReportCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  corrections: Correction[];
}

type Phase = 'selecting' | 'chatting' | 'evaluating' | 'report';

// ─── Session Persistence ──────────────────────────────────────────────────────
// Survives tab switches, stays until the user explicitly starts a new mission.

const SESSION_KEY = 'lumina_chat_session';

interface PersistedSession {
  scenarioId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO string
    corrections: Correction[];
  }>;
}

function loadSession(): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function saveSession(scenarioId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const data: PersistedSession = {
      scenarioId,
      messages: messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* storage full — ignore */ }
}

function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getOpeningMessage(scenario: ScenarioDefinition): string {
  const openers: Record<string, string> = {
    'coffee-ny':            "Hey! Welcome in. What can I get started for you today?",
    'immigration':          "Passport and customs declaration form, please. What's the purpose of your visit?",
    'job-interview':        "Thanks for coming in! Great to meet you. So — tell me a bit about yourself.",
    'hotel-checkin':        "Good evening and welcome! Do you have a reservation with us tonight?",
    'restaurant-complaint': "Good evening! How is everything tasting so far?",
    'alien-earth':          "Greetings, Earth creature! I have landed on your planet. I am puzzled by a substance on your table... you call it 'food'?",
    'new-friend':           "Hey! This is a fun event, right? Have you been to one of these before?",
    'tech-support':         "Thank you for calling support. My name is Alex. Can I get your account email to pull up your file?",
    'doctor':               "Good morning! Come in, have a seat. So, what brings you in today?",
    'taxi':                 "Hey! Where to? Hop in!",
  };
  return openers[scenario.id] ?? `Hello! Ready to practice? Let's start — I'm your ${scenario.title} partner.`;
}

// ─── Auto-save Corrections ────────────────────────────────────────────────────

interface SaveResult { word: string; wasDuplicate: boolean; }

function autoSaveCorrection(correction: Correction): SaveResult {
  const existing = getWords();
  const isDuplicate = existing.some(
    (w) => w.english.toLowerCase().trim() === correction.better.toLowerCase().trim()
  );
  if (!isDuplicate) {
    const newWord: Word = {
      id: generateId(),
      english: correction.better,
      korean: `${correction.explanation} (원문: "${correction.original}")`,
      exampleEnglish: '', exampleKorean: '',
      difficulty: 'medium',
      tags: ['conversation', 'auto-saved'],
      createdAt: new Date().toISOString(),
      lastReviewed: null, nextReview: null,
      reviewCount: 0, easeFactor: 2.5, interval: 1, streak: 0,
    };
    saveWordToStorage(newWord);
  }
  return { word: correction.better, wasDuplicate: isDuplicate };
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white text-xs font-bold">AI</span>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl rounded-bl-lg px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Correction Card ──────────────────────────────────────────────────────────

function CorrectionCard({ correction }: { correction: Correction }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-3.5 py-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💡</span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Grammar Tip
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">✕</span>
            <p className="text-xs text-red-700 dark:text-red-400 line-through leading-snug">
              &ldquo;{correction.original}&rdquo;
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 text-xs mt-0.5 flex-shrink-0">✓</span>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 leading-snug">
              &ldquo;{correction.better}&rdquo;
            </p>
          </div>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug pl-4">
          {correction.explanation}
        </p>
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-amber-200 dark:border-amber-700/40">
          <CheckCheck size={11} className="text-emerald-500 flex-shrink-0" />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Automatically saved to your word list
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn('flex items-end gap-2 px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mb-1">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}
      <div className={cn('flex flex-col gap-1.5 max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'px-4 py-2.5 shadow-sm',
          isUser
            ? 'bg-indigo-600 text-white rounded-3xl rounded-br-lg'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50 rounded-3xl rounded-bl-lg'
        )}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        {!isUser && message.corrections.length > 0 && (
          <div className="space-y-2 w-full">
            {message.corrections.map((c, i) => <CorrectionCard key={i} correction={c} />)}
          </div>
        )}
        <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button
              onClick={() => speak(message.content)}
              aria-label="Listen to message"
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <Volume2 size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mission Header ───────────────────────────────────────────────────────────

function MissionHeader({ scenario, messageCount, onFinish }: {
  scenario: ScenarioDefinition;
  messageCount: number;
  onFinish: () => void;
}) {
  const userTurns = Math.max(0, Math.floor(messageCount / 2));
  const progress = Math.min(1, userTurns / scenario.turns);

  return (
    <div
      className="flex-shrink-0 px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-700/50"
      style={{ background: `linear-gradient(135deg, ${scenario.colorFrom}18, ${scenario.colorTo}18)` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{scenario.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{scenario.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Target size={10} className="text-indigo-500 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{scenario.goalShort}</p>
            </div>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onFinish}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${scenario.colorFrom}, ${scenario.colorTo})` }}
        >
          <Flag size={12} />
          Finish
        </motion.button>
      </div>
      <div className="mt-2 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: scenario.colorFrom }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 text-right">
        {userTurns}/{scenario.turns} turns
      </p>
    </div>
  );
}

// ─── Evaluating Screen ────────────────────────────────────────────────────────

function EvaluatingScreen({ scenario }: { scenario: ScenarioDefinition }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${scenario.colorFrom}, ${scenario.colorTo})` }}
      >
        <Loader2 size={28} className="text-white" />
      </motion.div>
      <div className="text-center">
        <p className="font-bold text-slate-900 dark:text-white">Grading your performance…</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The AI is reviewing your conversation</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: scenario.colorFrom }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const [phase, setPhase] = useState<Phase>('selecting');
  const [scenario, setScenario] = useState<ScenarioDefinition | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [reportCard, setReportCard] = useState<EvaluationResult | null>(null);
  const [xpSnapshot, setXpSnapshot] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toasts, pushToast, dismissToast } = useToast();

  const {
    status: speechStatus,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (session?.scenarioId && session.messages.length > 0) {
      const sc = SCENARIOS.find((s) => s.id === session.scenarioId);
      if (sc) {
        const restored: ChatMessage[] = session.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setScenario(sc);
        setMessages(restored);
        setPhase('chatting');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist session whenever messages change ───────────────────────────────
  useEffect(() => {
    if (phase === 'evaluating' || phase === 'report') return;
    if (phase === 'selecting' || !scenario) { clearSession(); return; }
    if (messages.length > 0) saveSession(scenario.id, messages);
  }, [messages, scenario, phase]);

  // ── Health check ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/chat')
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setIsConfigured(d.configured === true))
      .catch(() => setIsConfigured(false));
  }, []);

  // ── Sync speech → input ───────────────────────────────────────────────────
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    // small timeout lets the DOM paint before scrolling
    const id = setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
    return () => clearTimeout(id);
  }, [messages, isThinking, phase]);

  // ── Start a mission ───────────────────────────────────────────────────────

  const handleStartMission = useCallback((s: ScenarioDefinition) => {
    const opener: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: getOpeningMessage(s),
      timestamp: new Date(),
      corrections: [],
    };
    setScenario(s);
    setMessages([opener]);
    setApiError(null);
    setPhase('chatting');
    saveSession(s.id, [opener]);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking || !scenario) return;

    setInput('');
    resetTranscript();
    setApiError(null);
    stopListening();

    const userMsg: ChatMessage = {
      id: generateId(), role: 'user',
      content: trimmed, timestamp: new Date(), corrections: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, scenario: scenario.systemPrompt }),
      });

      const data = (await res.json()) as ChatApiResponse & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Server error ${res.status}`);

      const aiMsg: ChatMessage = {
        id: generateId(), role: 'assistant',
        content: data.reply ?? '', timestamp: new Date(),
        corrections: data.corrections ?? [],
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (aiMsg.corrections.length > 0) {
        setTimeout(() => {
          for (const c of aiMsg.corrections) {
            const { word, wasDuplicate } = autoSaveCorrection(c);
            pushToast(word, wasDuplicate);
          }
        }, 0);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, messages, scenario, resetTranscript, stopListening, pushToast]);

  // ── Finish & evaluate ─────────────────────────────────────────────────────

  const handleFinish = useCallback(async () => {
    if (!scenario) return;

    // Need at least one user message for a meaningful evaluation.
    // If the user clicks Finish too early, show a nudge instead of silently blocking.
    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    if (userMessageCount === 0) {
      setApiError('Send at least one message before finishing the session!');
      return;
    }

    const progress = getUserProgress();
    setXpSnapshot(progress.totalXP);
    setPhase('evaluating');

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          scenarioTitle: scenario.title,
          scenarioGoal: scenario.goal,
          evaluationCriteria: scenario.evaluationCriteria,
        }),
      });

      const result = (await res.json()) as EvaluationResult & { error?: string };
      if (!res.ok || result.error) throw new Error(result.error ?? 'Evaluation failed');

      addXP(result.xp_earned);
      clearSession();
      setReportCard(result);
      setPhase('report');
    } catch {
      const fallback: EvaluationResult = {
        score: 60, xp_earned: 600,
        feedback: 'You completed the session — great practice! Keep going.',
        strengths: ['Completed the mission', 'Practiced real English'],
        improvements: ['Try to use more varied vocabulary'],
      };
      addXP(fallback.xp_earned);
      clearSession();
      setReportCard(fallback);
      setPhase('report');
    }
  }, [scenario, messages]);

  // ── Input handlers ────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleMicToggle = () => {
    if (speechStatus === 'listening') {
      stopListening();
      if (transcript.trim()) sendMessage(transcript);
    } else {
      resetTranscript();
      setInput('');
      startListening();
    }
  };

  const isListening  = speechStatus === 'listening';
  const isRequesting = speechStatus === 'requesting';
  const displayedInput = isListening && interimTranscript ? interimTranscript : input;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast stack — above everything */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Report Card overlay */}
      <AnimatePresence>
        {phase === 'report' && reportCard && scenario && (
          <ReportCard
            result={reportCard}
            scenarioEmoji={scenario.emoji}
            scenarioTitle={scenario.title}
            xpBefore={xpSnapshot}
            onPlayAgain={() => {
              clearSession();
              setPhase('selecting');
              setScenario(null);
              setMessages([]);
              setReportCard(null);
            }}
          />
        )}
      </AnimatePresence>

      {/*
        Fixed container precisely between the sticky TopBar (h-14 = 56px)
        and the fixed BottomNav (~60px + device safe-area-inset-bottom).
        This is the only reliable cross-device approach for a chat UI layout.
      */}
      <div
        className="fixed inset-x-0 mx-auto max-w-lg top-14 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 z-10"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }}
      >
        <AnimatePresence mode="wait">

          {/* ══ PHASE: selecting ══════════════════════════════════════════════ */}
          {phase === 'selecting' && (
            <motion.div
              key="selecting"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col flex-1 min-h-0 h-full"
            >
              <ScenarioSelector onStart={handleStartMission} />
            </motion.div>
          )}

          {/* ══ PHASE: chatting / evaluating ══════════════════════════════════ */}
          {(phase === 'chatting' || phase === 'evaluating') && scenario && (
            <motion.div
              key="chatting"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col flex-1 min-h-0 h-full"
            >
              {/* Mission header */}
              <MissionHeader
                scenario={scenario}
                messageCount={messages.length}
                onFinish={handleFinish}
              />

              {/* Error / config banners */}
              <AnimatePresence>
                {(apiError || speechError) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex-shrink-0"
                  >
                    <div className="mx-3 mt-2 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300 flex-1">{apiError ?? speechError}</p>
                      <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">✕</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isConfigured === false && (
                <div className="mx-3 mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 flex-shrink-0">
                  <WifiOff size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    No LLM configured. Add your{' '}
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">GROQ_API_KEY</code>
                    {' '}to{' '}
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">.env.local</code>
                    {' '}to enable AI responses.
                  </p>
                </div>
              )}

              {/* Evaluating loader */}
              {phase === 'evaluating' ? (
                <EvaluatingScreen scenario={scenario} />
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pt-4 pb-3 space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                        >
                          <TypingIndicator />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ── Input bar ───────────────────────────────────────────── */}
                  {/*
                    Floating bar: white/glass surface with upward shadow.
                    No extra bottom padding needed — the fixed container's bottom
                    edge is already positioned above the BottomNav.
                  */}
                  <div className="flex-shrink-0 bg-white/90 dark:bg-slate-900/92 backdrop-blur-md px-4 pt-3 pb-5 shadow-[0_-6px_24px_-4px_rgba(0,0,0,0.09)] dark:shadow-[0_-6px_24px_-4px_rgba(0,0,0,0.32)]">
                    {/* Listening indicator */}
                    <AnimatePresence>
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2 mb-2.5"
                        >
                          <motion.div
                            className="w-2 h-2 rounded-full bg-red-500"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Listening…</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {interimTranscript ? `"${interimTranscript}"` : 'Speak now'}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                      {/* Reset */}
                      <button
                        onClick={() => {
                          if (!scenario) return;
                          const opener: ChatMessage = {
                            id: generateId(), role: 'assistant',
                            content: getOpeningMessage(scenario),
                            timestamp: new Date(), corrections: [],
                          };
                          setMessages([opener]);
                          setApiError(null);
                          saveSession(scenario.id, [opener]);
                        }}
                        aria-label="Reset conversation"
                        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                      >
                        <RotateCcw size={18} />
                      </button>

                      {/* Text input */}
                      <input
                        ref={inputRef}
                        type="text"
                        value={displayedInput}
                        onChange={(e) => { if (!isListening) setInput(e.target.value); }}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          isListening  ? 'Listening…' :
                          isRequesting ? 'Requesting mic…' :
                          'Type or speak in English…'
                        }
                        readOnly={isListening}
                        className={cn(
                          'flex-1 px-4 py-2.5 rounded-full text-sm transition-all',
                          'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
                          isListening && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 italic'
                        )}
                      />

                      {/* Mic */}
                      {isSpeechSupported && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={handleMicToggle}
                          disabled={isRequesting}
                          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                          className={cn(
                            'w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all shadow-sm',
                            isListening  ? 'bg-red-500 text-white shadow-red-500/30 shadow-md' :
                            isRequesting ? 'bg-amber-500 text-white animate-pulse' :
                                           'bg-indigo-600 text-white hover:bg-indigo-700'
                          )}
                        >
                          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </motion.button>
                      )}

                      {/* Send */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isThinking}
                        aria-label="Send message"
                        className={cn(
                          'w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all',
                          input.trim() && !isThinking
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                        )}
                      >
                        <Send size={17} />
                      </motion.button>
                    </div>

                    {!isSpeechSupported && (
                      <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Voice input requires Chrome or Safari
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
