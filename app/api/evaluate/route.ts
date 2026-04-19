import { NextRequest, NextResponse } from 'next/server';
import type { EvaluationResult } from '@/types';

// ─── Evaluation System Prompt ─────────────────────────────────────────────────
//
// This endpoint is called once at the end of a conversation to grade the user.
// It uses the same Groq/Ollama infrastructure as the chat route.

function buildEvalPrompt(scenarioTitle: string, scenarioGoal: string, criteria: string): string {
  return `You are an expert English language evaluator for a mobile learning app.

Analyze ONLY the student's messages (role: "user") in this conversation.

Scenario: "${scenarioTitle}"
Scenario goal: "${scenarioGoal}"
Task completion criterion: "${criteria}"

CRITICAL: Return ONLY valid JSON. No markdown. No code fences. No extra text.

{"score":85,"xp_earned":850,"feedback":"...","strengths":["...","..."],"improvements":["..."]}

Scoring rubric (100 points total):
- Grammar accuracy (25 pts): correct verb tenses, sentence structure, no major errors
- Vocabulary & expression (25 pts): appropriate, varied, and natural word choices
- Task completion (25 pts): did the user achieve the scenario goal? (criterion above)
- Fluency & confidence (25 pts): natural, complete responses without excessive hesitation

xp_earned = score × 10 (integer, 0–1000)
feedback: 2–3 warm, encouraging sentences. Mention at least one specific thing done well.
strengths: exactly 2 short, specific strings describing what the user did well
improvements: exactly 1–2 short strings describing what to work on next

Edge cases:
- If the conversation has fewer than 3 user messages, score maximum 35
- If the user never engaged with the scenario goal, score task completion 0`;
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function callGroqEval(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in .env.local');

  const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.3, // lower temp for consistent grading
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

async function callOllamaEval(prompt: string): Promise<string> {
  const base = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL ?? 'llama3';

  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_predict: 400 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const data = (await res.json()) as { response: string };
  return data.response?.trim() ?? '';
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseEvalOutput(raw: string): EvaluationResult {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const p = JSON.parse(cleaned) as Partial<EvaluationResult>;
    const score = typeof p.score === 'number' ? Math.min(100, Math.max(0, Math.round(p.score))) : 50;
    return {
      score,
      xp_earned: typeof p.xp_earned === 'number' ? Math.round(p.xp_earned) : score * 10,
      feedback: typeof p.feedback === 'string' ? p.feedback : 'Great effort! Keep practicing.',
      strengths:    Array.isArray(p.strengths)    ? p.strengths.slice(0, 2)    : ['Good communication', 'Showed effort'],
      improvements: Array.isArray(p.improvements) ? p.improvements.slice(0, 2) : ['Keep practicing regularly'],
    };
  } catch {
    return {
      score: 50,
      xp_earned: 500,
      feedback: 'You completed the conversation — great effort! Keep practicing to improve.',
      strengths: ['Completed the scenario', 'Showed willingness to practice'],
      improvements: ['Try to use more varied vocabulary'],
    };
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

interface EvaluateRequestBody {
  messages: Array<{ role: string; content: string }>;
  scenarioTitle: string;
  scenarioGoal: string;
  evaluationCriteria: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvaluateRequestBody;
    const { messages, scenarioTitle, scenarioGoal, evaluationCriteria } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Build a readable transcript for the evaluator
    const transcript = messages
      .map((m) => `[${m.role === 'user' ? 'Student' : 'Partner'}]: ${m.content}`)
      .join('\n');

    const fullPrompt =
      buildEvalPrompt(scenarioTitle, scenarioGoal, evaluationCriteria) +
      '\n\nConversation transcript:\n' +
      transcript;

    const provider = (process.env.LLM_PROVIDER ?? 'groq') as 'groq' | 'ollama';
    const rawOutput = provider === 'ollama'
      ? await callOllamaEval(fullPrompt)
      : await callGroqEval(fullPrompt);

    const result = parseEvalOutput(rawOutput);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/evaluate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
