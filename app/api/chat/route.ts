import { NextRequest, NextResponse } from 'next/server';
import type { Correction, ChatApiResponse } from '@/types';

// ─── Configuration ────────────────────────────────────────────────────────────
//
// Set the following in .env.local:
//
//   LLM_PROVIDER=groq          # "groq" or "ollama"
//
//   # For Groq (free tier — https://console.groq.com)
//   GROQ_API_KEY=gsk_xxxxxxxxxxxx
//   GROQ_MODEL=llama-3.1-8b-instant
//
//   # For Ollama (local Docker, zero-cost)
//   OLLAMA_URL=http://localhost:11434
//   OLLAMA_MODEL=llama3
//
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER = (process.env.LLM_PROVIDER ?? 'groq') as 'groq' | 'ollama';

// ─── Structured Response Format ───────────────────────────────────────────────
//
// The AI always returns a JSON object — never plain text.
// This lets the client extract corrections without brittle regex parsing.
//
// Schema:
// {
//   "reply": "conversational response (1–3 sentences)",
//   "corrections": [
//     {
//       "original": "what the user said incorrectly",
//       "better":   "the correct / more natural expression",
//       "explanation": "한국어로 간단한 설명"
//     }
//   ]
// }

const SYSTEM_PROMPT = `You are a friendly, native English conversation partner helping a Korean learner practice natural English.

CRITICAL RULE: You MUST respond with a single valid JSON object and NOTHING else.
No markdown. No code fences. No extra text before or after the JSON.

JSON schema (always use this exact shape):
{"reply":"...","corrections":[]}

Rules for "reply":
- 1 to 3 short, natural, conversational sentences.
- Warm and encouraging tone, like a close friend texting.
- Never mention you are an AI unless directly asked.
- Match and stay within the current roleplay scenario.
- Encourage the user to keep responding.

Rules for "corrections":
- ONLY add a correction if the user made a clear grammatical or vocabulary error.
- Each item must have exactly these three keys:
    "original"    — the exact wrong phrase the user wrote
    "better"      — the correct or more natural English expression
    "explanation" — a concise explanation written in Korean (한국어)
- Maximum 2 corrections per reply.
- If there are no errors, use an empty array: []

Example of a valid response (no errors):
{"reply":"That sounds amazing! What did you like most about it?","corrections":[]}

Example of a valid response (one error):
{"reply":"Nice! It sounds like you had a great time.","corrections":[{"original":"I buyed a new bag","better":"I bought a new bag","explanation":"'buy'의 과거형은 불규칙 동사로 'bought'를 사용해요."}]}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: Message[];
  scenario?: string;
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────
// LLMs occasionally wrap output in markdown code fences — strip defensively.

function parseAiOutput(raw: string): ChatApiResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<ChatApiResponse>;
    return {
      reply: typeof parsed.reply === 'string' && parsed.reply.length > 0
        ? parsed.reply
        : raw, // fallback: treat entire output as reply
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections.filter(
            (c): c is Correction =>
              typeof c?.original === 'string' &&
              typeof c?.better === 'string' &&
              typeof c?.explanation === 'string'
          )
        : [],
    };
  } catch {
    // LLM ignored format instructions — graceful degradation, no corrections
    return { reply: raw, corrections: [] };
  }
}

// ─── Groq Handler ─────────────────────────────────────────────────────────────

async function callGroq(messages: Message[]): Promise<string> {
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
      messages,
      max_tokens: 300,
      temperature: 0.75,
      // Ask Groq to enforce JSON output at the API level where supported
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Ollama Handler ───────────────────────────────────────────────────────────

async function callOllama(messages: Message[]): Promise<string> {
  const base = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL ?? 'llama3';

  const prompt =
    messages
      .map((m) => {
        if (m.role === 'system') return `[System]: ${m.content}`;
        if (m.role === 'user') return `User: ${m.content}`;
        return `Assistant: ${m.content}`;
      })
      .join('\n') + '\nAssistant:';

  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json', // Ollama native JSON mode
      options: { temperature: 0.75, num_predict: 300 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response?.trim() ?? '';
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function GET() {
  const provider = process.env.LLM_PROVIDER ?? 'groq';
  const configured =
    provider === 'ollama'
      ? !!process.env.OLLAMA_URL
      : !!process.env.GROQ_API_KEY;

  return NextResponse.json({ configured, provider });
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, scenario } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const systemContent = scenario
      ? `${SYSTEM_PROMPT}\n\nCurrent roleplay scenario: ${scenario}. Stay in this scenario.`
      : SYSTEM_PROMPT;

    const fullMessages: Message[] = [
      { role: 'system', content: systemContent },
      ...messages.slice(-12),
    ];

    const rawOutput =
      PROVIDER === 'ollama'
        ? await callOllama(fullMessages)
        : await callGroq(fullMessages);

    const parsed = parseAiOutput(rawOutput);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
