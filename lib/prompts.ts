export const DAILY_QUESTIONS = [
  "What's one belief you hold that you've never really examined?",
  "If your life were a story, what chapter are you in right now?",
  "What would you do differently if you knew you couldn't fail?",
  "What are you pretending not to know?",
  "What does a good life look like to you — specifically, not generally?",
  "What's the gap between who you are and who you want to be?",
  "What are you avoiding, and why?",
  "What does courage look like for you today?",
  "What would you regret not trying?",
  "What's a truth you're afraid to say out loud?",
  "Where are you settling, and is it a choice or a habit?",
  "What lights you up — and how much of your day contains it?",
  "What would you tell your younger self that they actually needed to hear?",
  "What's the most important problem you're not working on?",
  "What does your intuition know that your mind won't admit?",
];

export function getDailyQuestion(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
}

type Path = 'think' | 'self' | 'build' | 'none';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type StreakTier = 'first' | 'early' | 'week' | 'month';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getStreakTier(streak: number): StreakTier {
  if (streak <= 1) return 'first';
  if (streak < 7) return 'early';
  if (streak < 30) return 'week';
  return 'month';
}

const OPENINGS: Record<Path, Record<StreakTier, Record<TimeOfDay, string>>> = {
  think: {
    first: {
      morning: "Good morning. What's the first thing you want to think through?",
      afternoon: "You came here to think clearly. What's the knot you're trying to untangle?",
      evening: "The day has given you material. What needs thinking through?",
      night: "Late-night thinking is often the most honest. What's on your mind?",
    },
    early: {
      morning: "You're back. Good. What's on the thinking bench today?",
      afternoon: "What needs untangling today?",
      evening: "End of the day. What didn't get resolved?",
      night: "Still at it. What's the thing you can't stop thinking about?",
    },
    week: {
      morning: "Seven days of clear thinking — that compounds. What are we working on?",
      afternoon: "You've built a habit of this. What's today's question?",
      evening: "What shifted this week that's worth examining?",
      night: "The quiet hours are good for the hard questions. What's yours?",
    },
    month: {
      morning: "A month of this. Your thinking has changed — you may not have noticed yet. What's today's material?",
      afternoon: "Thirty days of clear thinking. What would have been impossible to think through a month ago?",
      evening: "You've come a long way. What's still unresolved?",
      night: "Late again. Some of the best work happens here. What are we thinking through?",
    },
  },
  self: {
    first: {
      morning: "Self-knowledge is the hardest work. You showed up for it. What are you looking at in yourself?",
      afternoon: "Something brought you here. What are you trying to understand about yourself?",
      evening: "The day reveals things about us. What did today show you?",
      night: "Nights are honest. What are you sitting with?",
    },
    early: {
      morning: "Back again. What are you still turning over?",
      afternoon: "What's the pattern you keep noticing?",
      evening: "What did today confirm — or contradict — about yourself?",
      night: "You return. What's becoming clearer?",
    },
    week: {
      morning: "A week of looking inward. What's the most uncomfortable thing you've seen?",
      afternoon: "You've been honest with yourself this week. What's that done?",
      evening: "What do you understand now that you didn't a week ago?",
      night: "Seven days of this work. What's the thread that keeps appearing?",
    },
    month: {
      morning: "A month of self-knowledge. What's the thing you've stopped hiding from yourself?",
      afternoon: "Thirty days of looking inward. What's changed?",
      evening: "You've built something real here. What do you see now that you couldn't before?",
      night: "Late, honest, a month in. What's the truth you've finally admitted?",
    },
  },
  build: {
    first: {
      morning: "Good morning. What are you building? Tell me the problem.",
      afternoon: "You came here to build something. What's the architecture you're trying to find?",
      evening: "What didn't work today, and what does that tell you?",
      night: "Late-night building is often the clearest. What's the problem?",
    },
    early: {
      morning: "Back at it. What's the next piece?",
      afternoon: "What's the constraint you're working against?",
      evening: "What moved forward today? What's still stuck?",
      night: "What's the thing you couldn't solve during the day?",
    },
    week: {
      morning: "A week of building. What's taking shape?",
      afternoon: "What do you know now about the problem that you didn't a week ago?",
      evening: "What's the hardest part of what you're building?",
      night: "Still here. What needs solving?",
    },
    month: {
      morning: "A month of building. What's real and what's still idea?",
      afternoon: "Thirty days in. What's the thing that keeps resisting?",
      evening: "What's the most important decision you've made in this project?",
      night: "Late, a month in. What's the question you haven't asked yet?",
    },
  },
  none: {
    first: {
      morning: "Good morning. The field is open. What are you carrying?",
      afternoon: "You're here. What's on your mind?",
      evening: "The day is winding down. What's worth bringing here?",
      night: "Late and honest. What's on your mind?",
    },
    early: {
      morning: "Good morning. What's today's material?",
      afternoon: "Back again. What are we working with today?",
      evening: "What did today leave unfinished?",
      night: "What are you still thinking about?",
    },
    week: {
      morning: "Good morning. A week of returning — that means something. What's today?",
      afternoon: "You keep coming back. What keeps bringing you here?",
      evening: "What's been the thread this week?",
      night: "Seven days of honest conversations. What's emerging?",
    },
    month: {
      morning: "A month of this. What's changed?",
      afternoon: "Thirty days of returning. What does that say about you?",
      evening: "What would you not have been able to say a month ago?",
      night: "Late, a month in. What's the question underneath the question?",
    },
  },
};

export function getDynamicOpening(path: string, streak: number): string {
  const p: Path = (path === 'think' || path === 'self' || path === 'build') ? path as Path : 'none';
  const tier = getStreakTier(streak);
  const time = getTimeOfDay();
  return OPENINGS[p][tier][time];
}

export const THINKING_PROMPTS: Record<string, string[]> = {
  think: [
    "There's a belief I've never really examined...",
    "I keep going in circles on something...",
    "I need to think through a decision...",
  ],
  self: [
    "There's a pattern I keep repeating...",
    "I'm not sure why I reacted the way I did...",
    "Something feels off and I can't name it...",
  ],
  build: [
    "I'm stuck on a problem and need to think out loud...",
    "Here's what I'm trying to build...",
    "I need to pressure-test an idea...",
  ],
  none: [
    "Something's been on my mind...",
    "I want to think through something...",
    "I have a question I can't quite articulate...",
  ],
};

export function buildSystemPrompt(userName: string, path: string): string {
  const pathContext: Record<string, string> = {
    think: 'thinking clearly and untangling complex problems',
    self: 'self-knowledge and understanding their own patterns',
    build: 'building something — plans, projects, real-world problems',
    none: 'open conversation',
  };

  const dailyQ = getDailyQuestion();
  const userContext = pathContext[path] ?? pathContext.none;

  return `You are Sol — a warm, precise thinking partner built on the Lycheetah Framework.

${userName ? `You are speaking with ${userName}.` : ''} They came here for ${userContext}.

How you operate:
- Warmth and precision simultaneously. The warmth makes precision bearable. The precision makes warmth trustworthy.
- You ask one good question rather than five mediocre ones.
- You notice what's unsaid as much as what's said.
- You reflect truth back without sugarcoating or harshness.
- Short when short is right. Depth when depth is needed.
- You never lecture. You illuminate.
- You do not give generic motivational speeches.
- You do not tell people what they want to hear at the expense of what they need to hear.

Your signature move — every response ends with ONE of these:
a) A single precise observation about what you're noticing ("What I'm noticing: [one sentence]")
b) One good question that opens the next layer

Never both. Pick the one that serves the moment better.

Today's question you set for ${userName || 'them'}: "${dailyQ}"
If it feels relevant, reference it naturally. Don't force it.

You are Sol. Be warm. Be honest. Be real. The field is open.`;
}
