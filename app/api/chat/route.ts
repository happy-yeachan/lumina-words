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
{"reply":"...","translation":"...","corrections":[]}

Rules for "reply":
- 1 to 3 short, natural, conversational sentences.
- Warm and encouraging tone, like a close friend texting.
- Never mention you are an AI unless directly asked.
- Match and stay within the current roleplay scenario.
- Encourage the user to keep responding.

Rules for "translation":
- Translate your "reply" into natural, conversational Korean (한국어).
- This is for the learner to understand your response.
- Translate ONLY your reply, not anything else.
- ⚠️  STRICTLY use pure Korean (한글) only. NEVER use Hanja (漢字/Chinese characters).
- Write the way a friendly Korean person would text — casual, warm, and easy to read.
- Do NOT use formal or academic language.

Rules for "corrections" "explanation" field:
- Write in natural, conversational Korean that a language learner can easily understand.
- ⚠️  STRICTLY use pure Korean (한글) only. NEVER write Hanja or Chinese characters.
- Keep it short and friendly — like a helpful friend explaining, not a textbook.
- Example of GOOD explanation: "'buy'의 과거형은 불규칙 동사라서 'bought'를 써요."
- Example of BAD explanation (Hanja): "긍정의意思이고..." ← NEVER do this.

Rules for "corrections":
- ⚠️  ONLY evaluate the user's MOST RECENT message marked [EVALUATE THIS MESSAGE].
- DO NOT evaluate previous messages in the conversation history.
- DO NOT evaluate your own responses.
- DO NOT invent corrections for things the user did not write.
- Only flag a clear grammatical or vocabulary error that actually appears word-for-word in [EVALUATE THIS MESSAGE].
- Each correction must have exactly these three keys:
    "original"    — the exact wrong phrase copied from [EVALUATE THIS MESSAGE]
    "better"      — the correct or more natural English expression
    "explanation" — a concise explanation written in Korean (한국어)
- Maximum 2 corrections per reply.
- If there are no errors, use an empty array: []

Example of a valid response (no errors):
{"reply":"That sounds amazing! What did you like most about it?","translation":"정말 멋지네요! 가장 좋았던 게 뭐예요?","corrections":[]}

Example of a valid response (one error):
{"reply":"Nice! It sounds like you had a great time.","translation":"좋아요! 정말 즐거운 시간을 보내셨군요.","corrections":[{"original":"I buyed a new bag","better":"I bought a new bag","explanation":"'buy'의 과거형은 불규칙 동사로 'bought'를 사용해요."}]}`;

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

function parseAiOutput(raw: string, lastUserMessage: string): ChatApiResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<ChatApiResponse>;

    const reply = typeof parsed.reply === 'string' && parsed.reply.length > 0
      ? parsed.reply
      : raw;

    // Filter corrections: only keep ones whose "original" text actually appears
    // in the user's latest message (case-insensitive). This is a client-side
    // safeguard against the LLM hallucinating corrections from old messages.
    const rawCorrections = Array.isArray(parsed.corrections) ? parsed.corrections : [];
    const corrections = rawCorrections.filter(
      (c): c is Correction =>
        typeof c?.original === 'string' &&
        typeof c?.better === 'string' &&
        typeof c?.explanation === 'string' &&
        lastUserMessage.toLowerCase().includes(c.original.toLowerCase()),
    );

    return {
      reply,
      translation: typeof parsed.translation === 'string' ? parsed.translation : '',
      corrections,
    };
  } catch {
    return { reply: raw, translation: '', corrections: [] };
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
      max_tokens: 450,
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

    // Extract the last user message so we can (a) inject it explicitly into the
    // system prompt and (b) use it for client-side correction validation.
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    // Build system content: inject scenario + pin the exact message to grade.
    // This is the primary fix for correction hallucination — the LLM is told
    // exactly which text to evaluate and must not touch anything else.
    const systemContent = [
      SYSTEM_PROMPT,
      scenario ? `\nCurrent roleplay scenario: ${scenario}. Stay in this scenario.` : '',
      lastUserMessage
        ? `\n\n[EVALUATE THIS MESSAGE] — the ONLY text you may write corrections for:\n"${lastUserMessage}"`
        : '',
    ].join('');

    const fullMessages: Message[] = [
      { role: 'system', content: systemContent },
      ...messages.slice(-12),
    ];

    const rawOutput =
      PROVIDER === 'ollama'
        ? await callOllama(fullMessages)
        : await callGroq(fullMessages);

    // Pass lastUserMessage so the parser can cross-check corrections.
    const parsed = parseAiOutput(rawOutput, lastUserMessage);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
