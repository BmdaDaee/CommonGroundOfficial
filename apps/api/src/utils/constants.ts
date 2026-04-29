export const MISSIONS = [
  {
    id: 'the_listening_challenge',
    title: 'The Listening Challenge',
    description: 'Partner talks, you listen for 10 minutes. No advice, no fixing, no interrupting.',
    category: 'Connection',
    xp: 50,
  },
  {
    id: 'appreciation_bomb',
    title: 'Appreciation Bomb',
    description: 'Send 5 specific, meaningful appreciations. No generics — name what they actually did.',
    category: 'Affirmation',
    xp: 35,
  },
  {
    id: 'the_unfinished_conversation',
    title: 'The Unfinished Conversation',
    description: 'Revisit a conversation you\'ve been avoiding. Set a 15-minute timer and stay in it.',
    category: 'Courage',
    xp: 75,
  },
  {
    id: 'date_night_architect',
    title: 'Date Night Architect',
    description: 'Plan a date based entirely on your partner\'s preferences, not yours.',
    category: 'Intentionality',
    xp: 60,
  },
  {
    id: 'the_repair_attempt',
    title: 'The Repair Attempt',
    description: 'Be the first to repair after a disagreement. Do it within 24 hours.',
    category: 'Repair',
    xp: 100,
  },
]

export const EXERCISES = [
  {
    id: 'vulnerability_share',
    title: 'Vulnerability Share',
    description: 'Each partner shares one thing they haven\'t said before. No fixing, just listening.',
    duration: 15,
    difficulty: 'Medium',
    xp: 50,
  },
  {
    id: 'eye_contact',
    title: '4-Minute Eye Contact',
    description: 'Maintain eye contact for 4 minutes in silence. Notice what comes up.',
    duration: 4,
    difficulty: 'Easy',
    xp: 25,
  },
  {
    id: 'appreciation_flood',
    title: 'Appreciation Flood',
    description: 'Take turns naming specific things you appreciate about each other for 6 minutes.',
    duration: 6,
    difficulty: 'Easy',
    xp: 25,
  },
  {
    id: 'hurt_and_healing',
    title: 'Hurt & Healing',
    description: 'One partner shares a hurt, the other only reflects it back. No defense.',
    duration: 20,
    difficulty: 'Hard',
    xp: 75,
  },
  {
    id: 'dream_mapping',
    title: 'Dream Mapping',
    description: 'Each partner shares their 5-year vision. Look for overlap and divergence.',
    duration: 30,
    difficulty: 'Medium',
    xp: 50,
  },
  {
    id: 'repair_practice',
    title: 'Repair Practice',
    description: 'Walk through a real disagreement using Bently\'s repair framework.',
    duration: 15,
    difficulty: 'Hard',
    xp: 75,
  },
]

export const SPARK_GAMES = [
  { id: 'truths_lies', title: '2 Truths 1 Lie', xp: 15 },
  { id: 'rate_day', title: 'Rate the Day', xp: 10 },
  { id: 'would_you_rather', title: 'Would You Rather', xp: 10 },
  { id: 'finish_sentence', title: 'Finish the Sentence', xp: 15 },
]

export const DAILY_QUESTIONS = [
  "What's one thing your partner did this week you haven't thanked them for?",
  "When did you last feel truly seen by your partner?",
  "What's a boundary you've been afraid to name?",
  "Describe a moment where you chose connection over being right.",
  "What does your partner need from you that you haven't given?",
  "What do you wish I understood about you that I keep missing?",
  "When do you feel most loved by me?",
  "If you could teleport us anywhere right now, where would we go?",
  "What's a childhood memory that shaped who you are in relationships?",
  "What's something we could do better together?",
  "How can I support you better this week?",
  "What makes you feel most secure in this relationship?",
  "What's been weighing on you that you haven't shared?",
  "How do you prefer to be touched when you need comfort?",
  "What would a perfect weekend look like to you?",
  "What are you most grateful for about us right now?",
  "What's one goal you have for our relationship this year?",
  "What does trust mean to you in this relationship?",
]

export const ZODIAC_SIGNS = [
  { sign: 'Aries', element: 'Fire', dates: 'Mar 21 - Apr 19', symbol: '♈' },
  { sign: 'Taurus', element: 'Earth', dates: 'Apr 20 - May 20', symbol: '♉' },
  { sign: 'Gemini', element: 'Air', dates: 'May 21 - Jun 20', symbol: '♊' },
  { sign: 'Cancer', element: 'Water', dates: 'Jun 21 - Jul 22', symbol: '♋' },
  { sign: 'Leo', element: 'Fire', dates: 'Jul 23 - Aug 22', symbol: '♌' },
  { sign: 'Virgo', element: 'Earth', dates: 'Aug 23 - Sep 22', symbol: '♍' },
  { sign: 'Libra', element: 'Air', dates: 'Sep 23 - Oct 22', symbol: '♎' },
  { sign: 'Scorpio', element: 'Water', dates: 'Oct 23 - Nov 21', symbol: '♏' },
  { sign: 'Sagittarius', element: 'Fire', dates: 'Nov 22 - Dec 21', symbol: '♐' },
  { sign: 'Capricorn', element: 'Earth', dates: 'Dec 22 - Jan 19', symbol: '♑' },
  { sign: 'Aquarius', element: 'Air', dates: 'Jan 20 - Feb 18', symbol: '♒' },
  { sign: 'Pisces', element: 'Water', dates: 'Feb 19 - Mar 20', symbol: '♓' },
]

export const LOVE_LANGUAGE_QUESTIONS = [
  { id: 1, optionA: 'Words of Affirmation/Hearing how much you\'re appreciated', optionB: 'Acts of Service/Having them help with chores' },
  { id: 2, optionA: 'Receiving Gifts/A thoughtful gift', optionB: 'Quality Time/Uninterrupted time together' },
  { id: 3, optionA: 'Words of Affirmation/A sincere compliment', optionB: 'Physical Touch/A back massage' },
  { id: 4, optionA: 'Acts of Service/They do chores without asking', optionB: 'Quality Time/They plan a surprise date' },
  { id: 5, optionA: 'Words of Affirmation/Written love note', optionB: 'Quality Time/Quality conversation' },
  { id: 6, optionA: 'Receiving Gifts/Receiving flowers', optionB: 'Physical Touch/Physical affection' },
  { id: 7, optionA: 'Words of Affirmation/Praise from partner', optionB: 'Acts of Service/Helping with a project' },
  { id: 8, optionA: 'Quality Time/Weekend getaway', optionB: 'Receiving Gifts/Thoughtful present' },
  { id: 9, optionA: 'Physical Touch/Holding hands', optionB: 'Words of Affirmation/Listening without judgment' },
  { id: 10, optionA: 'Receiving Gifts/Being remembered (birthday, etc.)', optionB: 'Acts of Service/Help when stressed' },
  { id: 11, optionA: 'Physical Touch/Hugs and cuddles', optionB: 'Words of Affirmation/Words of encouragement' },
  { id: 12, optionA: 'Quality Time/Phone calls to check in', optionB: 'Receiving Gifts/Small gifts' },
  { id: 13, optionA: 'Acts of Service/Acts of service', optionB: 'Quality Time/Full attention during conversation' },
  { id: 14, optionA: 'Words of Affirmation/Compliments', optionB: 'Physical Touch/Physical closeness' },
  { id: 15, optionA: 'Acts of Service/Help with their goals', optionB: 'Quality Time/Regular date nights' },
]

export const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Acts of Service',
  'Receiving Gifts',
  'Quality Time',
  'Physical Touch',
]

export const ACHIEVEMENTS = [
  { id: 'first_connection', title: 'First Connection', icon: '◆', condition: 'Sent first message' },
  { id: 'deeply_us_pioneer', title: 'DeeplyUs Pioneer', icon: '♥', condition: 'First DeeplyUs session' },
  { id: 'spark_starter', title: 'Spark Starter', icon: '⚡', condition: 'Reached Spark rank' },
  { id: 'flame_keeper', title: 'Flame Keeper', icon: '🔥', condition: 'Reached Flame rank' },
  { id: 'listener', title: 'Listener', icon: '◎', condition: 'Completed Listening Challenge' },
  { id: 'consistent', title: 'Consistent', icon: '✦', condition: '7-day streak' },
]

export const GROWTH_MODULES = [
  { id: 'feel_closer', title: 'Feel Closer', description: 'Deepen emotional connection', days: 7, xp: 100 },
  { id: 'healthy_conflict', title: 'Healthy Conflict', description: 'Learn to argue better', days: 7, xp: 100 },
  { id: 'clear_communication', title: 'Clear Communication', description: 'Fix misunderstandings at the root', days: 7, xp: 100 },
  { id: 'deeper_intimacy', title: 'Deeper Intimacy', description: 'Physical and emotional closeness', days: 7, xp: 100 },
  { id: 'trust_rebuild', title: 'Trust Rebuild', description: 'Repair your foundation together', days: 14, xp: 150 },
]

export const INTERVENTION_TYPES = [
  { id: 'SUPPORT', description: 'Witness, validate, hold space — used in vulnerable moments' },
  { id: 'REALITY_CHECK', description: 'Direct, calling in, breaking denial — used when someone is hedging' },
  { id: 'ADVISOR', description: 'Coaching, actionable, concrete — used when they\'re stuck and ready' },
  { id: 'PRESENCE', description: 'Witnessing, holding space, light touch — used when aligned' },
]

export const RANK_TIERS = [
  { tier: 'SPARK', minXP: 0, emoji: '✨' },
  { tier: 'FLAME', minXP: 500, emoji: '🔥' },
  { tier: 'CALIBRATOR', minXP: 2000, emoji: '⚖️' },
  { tier: 'INFERNO', minXP: 5000, emoji: '🌋' },
  { tier: 'SOVEREIGN', minXP: 15000, emoji: '👑' },
]
