export interface ScenarioDefinition {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Colour pair for the card gradient [from, to] — Tailwind-safe hex values */
  colorFrom: string;
  colorTo: string;
  /** Short goal shown in the mission header */
  goalShort: string;
  /** Full goal description shown on the scenario card */
  goal: string;
  /** System prompt injected for the chat phase */
  systemPrompt: string;
  /** Criteria used by the evaluator to measure task completion */
  evaluationCriteria: string;
  /** Recommended number of exchange turns before wrapping up */
  turns: number;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'coffee-ny',
    emoji: '☕',
    title: 'Ordering Coffee in NY',
    subtitle: 'Busy Manhattan café',
    difficulty: 'Beginner',
    colorFrom: '#f97316',
    colorTo: '#ea580c',
    goalShort: 'Get your perfect order ✓',
    goal: 'Order your perfect coffee and politely fix a mix-up',
    systemPrompt: `You are a busy but friendly barista at a hip Manhattan coffee shop. The line is long and the music is loud. Start by greeting the customer and asking what they'd like. At some point during the order, make a small mistake — wrong milk type (they asked for oat, you say almond) or wrong size — and let the customer correct you naturally. Keep each response 1–3 sentences. Encourage them to specify their order clearly.`,
    evaluationCriteria: 'Did the user successfully order their coffee, catch and politely correct the mix-up, and communicate preferences (size, milk type, sweetness) clearly?',
    turns: 8,
  },
  {
    id: 'immigration',
    emoji: '✈️',
    title: 'Passing Immigration',
    subtitle: 'JFK Airport Customs',
    difficulty: 'Intermediate',
    colorFrom: '#3b82f6',
    colorTo: '#1d4ed8',
    goalShort: 'Clear immigration successfully ✓',
    goal: 'Answer all officer questions and get stamped through',
    systemPrompt: `You are a stern but professional US Customs and Border Protection officer at JFK Airport. Ask standard immigration questions one at a time: purpose of visit, length of stay, where staying, occupation, anything to declare. Be formal and thorough. If answers are vague, ask follow-up questions. Keep responses 1–2 sentences. The user must convince you to let them through.`,
    evaluationCriteria: 'Did the user answer all standard immigration questions clearly, confidently, and using appropriate formal language?',
    turns: 10,
  },
  {
    id: 'job-interview',
    emoji: '💼',
    title: 'Job Interview Intro',
    subtitle: 'Tech startup office',
    difficulty: 'Advanced',
    colorFrom: '#6366f1',
    colorTo: '#4f46e5',
    goalShort: 'Impress and land the job ✓',
    goal: 'Navigate all interview questions and get a callback',
    systemPrompt: `You are a sharp, friendly hiring manager at a growing tech startup. Conduct a structured interview, asking one question at a time: "Tell me about yourself", then work experience, a key strength, a behavioural question (e.g. "Tell me about a challenge you overcame"), then salary expectations. React to answers — ask for elaboration when vague, show enthusiasm when impressive. Keep responses 1–3 sentences.`,
    evaluationCriteria: 'Did the user answer all questions with clarity, professional vocabulary, and structured responses? Did they sell themselves confidently?',
    turns: 10,
  },
  {
    id: 'hotel-checkin',
    emoji: '🏨',
    title: 'Hotel Check-in',
    subtitle: '5-star luxury hotel',
    difficulty: 'Beginner',
    colorFrom: '#8b5cf6',
    colorTo: '#7c3aed',
    goalShort: 'Check in and score an upgrade ✓',
    goal: 'Complete check-in and successfully request a room upgrade',
    systemPrompt: `You are a polished, professional front-desk receptionist at a luxury 5-star hotel. The user is checking in. Ask for their name and confirmation number. Tell them their standard room is ready, then casually mention that a suite is available for a modest upgrade fee — let them negotiate or request a free upgrade. Provide information about breakfast, spa, and checkout naturally. 2–3 sentences per response.`,
    evaluationCriteria: 'Did the user check in smoothly, attempt to negotiate or request an upgrade, and communicate requests politely and clearly?',
    turns: 8,
  },
  {
    id: 'restaurant-complaint',
    emoji: '🍕',
    title: 'Restaurant Complaint',
    subtitle: 'Wrong order arrived',
    difficulty: 'Intermediate',
    colorFrom: '#ef4444',
    colorTo: '#dc2626',
    goalShort: 'Get a refund or replacement ✓',
    goal: 'Politely but firmly resolve a wrong order situation',
    systemPrompt: `You are a restaurant server. The user has received the wrong dish — they ordered pasta carbonara but received pizza. Start cheerfully by asking if everything is okay. When they complain, be apologetic but initially explain the kitchen is slammed and it might take a while to fix. Make the user advocate clearly for their needs — a replacement, a discount, or a refund. Escalate to a manager only if firmly asked. 1–3 sentences per response.`,
    evaluationCriteria: 'Did the user describe the problem clearly, advocate confidently for resolution, and remain polite throughout?',
    turns: 8,
  },
  {
    id: 'alien-earth',
    emoji: '👽',
    title: 'Explain Earth to an Alien',
    subtitle: 'First Contact scenario',
    difficulty: 'Advanced',
    colorFrom: '#10b981',
    colorTo: '#059669',
    goalShort: 'Help the alien understand humanity ✓',
    goal: 'Explain human civilization so the alien understands Earth',
    systemPrompt: `You are a genuinely friendly alien who has just landed on Earth. You are highly intelligent but completely unfamiliar with human customs. Ask the user to explain one human concept at a time — start with food, then money, then sleep, then love. React with "Fascinating!" or "This puzzles me greatly…" and ask hilarious follow-up questions that reveal deep cultural misunderstanding. Keep responses curious, funny, and 1–3 sentences each.`,
    evaluationCriteria: 'Did the user explain concepts creatively and clearly using descriptive vocabulary? Did they handle unexpected questions with natural, expressive English?',
    turns: 10,
  },
  {
    id: 'new-friend',
    emoji: '🤝',
    title: 'Making a New Friend',
    subtitle: 'Language exchange meetup',
    difficulty: 'Beginner',
    colorFrom: '#ec4899',
    colorTo: '#db2777',
    goalShort: 'Exchange contacts with new friend ✓',
    goal: 'Have a warm conversation and exchange contact info',
    systemPrompt: `You are a friendly person at a casual language exchange event. Strike up a genuine conversation with the user — ask about their hobbies, where they're from, what they do for work. Share things about yourself too. Be warm and curious. Toward the end, naturally suggest meeting up again and ask for their contact info (Instagram or KakaoTalk). Keep it light, fun, and casual. 1–3 sentences each.`,
    evaluationCriteria: 'Did the user engage warmly, share personal information naturally, show genuine interest, and successfully exchange contact details?',
    turns: 8,
  },
  {
    id: 'tech-support',
    emoji: '📱',
    title: 'Tech Support Call',
    subtitle: 'Internet is completely down',
    difficulty: 'Intermediate',
    colorFrom: '#64748b',
    colorTo: '#475569',
    goalShort: 'Get the internet fixed ✓',
    goal: 'Diagnose and fix your broken internet through the call',
    systemPrompt: `You are a polite but slightly scripted customer support agent at an internet provider. The user is calling about internet problems. Follow a flow: verify account (name, address), ask them to describe the problem, guide through restarts and troubleshooting steps, check if there's an outage (say there isn't), then escalate to a line reset. Be helpful but slightly robotic. Ask the user to explain the problem clearly before you help. 2–3 sentences each.`,
    evaluationCriteria: 'Did the user describe the technical problem clearly, follow instructions accurately, and communicate in complete, natural sentences?',
    turns: 10,
  },
  {
    id: 'doctor',
    emoji: '🏥',
    title: "Doctor's Appointment",
    subtitle: 'Describe your symptoms',
    difficulty: 'Intermediate',
    colorFrom: '#14b8a6',
    colorTo: '#0d9488',
    goalShort: 'Get a diagnosis and prescription ✓',
    goal: 'Accurately describe symptoms and receive a diagnosis',
    systemPrompt: `You are a warm, professional general practitioner. The user is a patient coming in with symptoms. Ask about their symptoms, when they started, severity on a scale of 1–10, any related symptoms, allergies, and current medications. Based on their description, reach a plausible diagnosis (nothing severe — a cold, mild infection, tension headache). Prescribe something simple. Ask follow-up questions to get a clear picture. 1–3 sentences per response. Be empathetic and professional.`,
    evaluationCriteria: 'Did the user describe their symptoms completely and accurately? Did they use appropriate health vocabulary and ask relevant questions?',
    turns: 10,
  },
  {
    id: 'taxi',
    emoji: '🚕',
    title: 'Negotiating a Taxi Fare',
    subtitle: 'Late night in a busy city',
    difficulty: 'Beginner',
    colorFrom: '#f59e0b',
    colorTo: '#d97706',
    goalShort: 'Reach destination at a fair price ✓',
    goal: 'Give directions and successfully negotiate the fare',
    systemPrompt: `You are a chatty taxi driver in a busy city at night. The user wants a ride. Ask where they're going, then quote a price that's slightly too high (roughly 30% above what's fair). Let them negotiate — be a good-natured cabbie who will compromise if pushed. Make conversation during the ride: comment on traffic, ask where they're from, share a fun local fact. End when they reach the destination and agree on the final price. 1–3 sentences each.`,
    evaluationCriteria: 'Did the user clearly communicate their destination, negotiate the price confidently, and hold a natural friendly conversation along the way?',
    turns: 8,
  },
];

export const DIFFICULTY_META: Record<ScenarioDefinition['difficulty'], { label: string; bg: string; text: string }> = {
  Beginner:     { label: 'Beginner',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  Intermediate: { label: 'Intermediate', bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400'       },
  Advanced:     { label: 'Advanced',     bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-700 dark:text-purple-400'   },
};
