// Content library for the "Create a Pact" tap-flow.
// Matches circlepact_create_pact_spec.md §3 exactly.

import type { Activity, AudienceLabel, Vibe, VibeId, VisibilityLabel } from '@/types/createPactFlow';

export const VIBES: Vibe[] = [
  { id: 'glowup', emoji: '✨', label: 'Glow Up', tagline: "Become the version of you you've been talking about." },
  { id: 'money', emoji: '💸', label: 'Money Moves', tagline: 'Get serious about your money.' },
  { id: 'dare', emoji: '🔥', label: 'Dare Yourself', tagline: 'Do something that scares you a little.' },
  { id: 'adventure', emoji: '✈️', label: 'Adventure', tagline: "Do something you'll remember." },
  { id: 'love', emoji: '❤️', label: 'Love & Life', tagline: 'Invest in the people that matter.' },
  { id: 'social', emoji: '🎉', label: 'Social', tagline: 'More people. More stories. More life.' },
  { id: 'create', emoji: '🎨', label: 'Create', tagline: 'Make something worth showing.' },
  { id: 'build', emoji: '🚀', label: 'Build', tagline: 'Turn an idea into something real.' },
  { id: 'levelup', emoji: '🧠', label: 'Level Up', tagline: 'Learn. Improve. Become dangerous.' },
  { id: 'wellbeing', emoji: '🌱', label: 'Wellbeing', tagline: 'Take care of the machine.' },
];

export const ACTIVITIES: Record<VibeId, Activity[]> = {
  glowup: [
    { emoji: '💪', label: 'Workout', unit: 'sessions', defaultTarget: 20, quickTargets: [8, 12, 20, 30] },
    { emoji: '🏃', label: 'Run', unit: 'km', defaultTarget: 50, quickTargets: [25, 50, 100, 250] },
    { emoji: '🧘', label: 'Meditate', unit: 'sessions', defaultTarget: 20, quickTargets: [7, 14, 20, 30] },
    { emoji: '🥗', label: 'No junk food', unit: 'days', defaultTarget: 30, quickTargets: [7, 14, 30, 60] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  money: [
    { emoji: '💰', label: 'Save', unit: '₹', defaultTarget: 50000, quickTargets: [10000, 25000, 50000, 100000] },
    { emoji: '🚫', label: 'No food delivery', unit: 'days', defaultTarget: 30, quickTargets: [7, 14, 30, 60] },
    { emoji: '📈', label: 'Build side income', unit: '₹', defaultTarget: 10000, quickTargets: [5000, 10000, 25000, 50000] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  dare: [
    { emoji: '🥶', label: 'Cold shower', unit: 'days', defaultTarget: 7, quickTargets: [3, 7, 14, 21] },
    { emoji: '🏃', label: 'Run a half marathon', milestone: true },
    { emoji: '🎤', label: 'Ask for the promotion', milestone: true },
    { emoji: '📹', label: 'Post my first video', milestone: true },
    { emoji: '📵', label: 'Delete Instagram', unit: 'days', defaultTarget: 30, quickTargets: [7, 14, 30, 60] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  adventure: [
    { emoji: '🗺️', label: 'Visit new places', unit: 'places', defaultTarget: 5, quickTargets: [3, 5, 10, 20] },
    { emoji: '🍽️', label: 'Try new restaurants', unit: 'restaurants', defaultTarget: 10, quickTargets: [5, 10, 15, 25] },
    { emoji: '🎒', label: 'Take a solo trip', milestone: true },
    { emoji: '🌅', label: 'Watch the sunrise', unit: 'times', defaultTarget: 5, quickTargets: [3, 5, 10, 15] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  love: [
    { emoji: '💑', label: 'Plan date nights', unit: 'dates', defaultTarget: 4, quickTargets: [2, 4, 8, 12] },
    { emoji: '📞', label: 'Call my parents', unit: 'calls', defaultTarget: 4, quickTargets: [4, 8, 12, 20] },
    { emoji: '🤝', label: 'Meet someone new', unit: 'people', defaultTarget: 4, quickTargets: [2, 4, 8, 12] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  social: [
    { emoji: '🌃', label: 'Go out', unit: 'times', defaultTarget: 4, quickTargets: [2, 4, 8, 12] },
    { emoji: '👋', label: 'Meet new people', unit: 'people', defaultTarget: 5, quickTargets: [3, 5, 10, 15] },
    { emoji: '🍷', label: 'Host dinners', unit: 'dinners', defaultTarget: 3, quickTargets: [1, 3, 5, 8] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  create: [
    { emoji: '📸', label: 'Post content', unit: 'posts', defaultTarget: 20, quickTargets: [10, 20, 30, 60] },
    { emoji: '✍️', label: 'Write', unit: 'pages', defaultTarget: 30, quickTargets: [10, 30, 50, 100] },
    { emoji: '🎨', label: 'Draw / paint', unit: 'pieces', defaultTarget: 10, quickTargets: [5, 10, 20, 30] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  build: [
    { emoji: '💻', label: 'Code', unit: 'hours', defaultTarget: 30, quickTargets: [10, 30, 60, 100] },
    { emoji: '🚀', label: 'Launch my project', milestone: true },
    { emoji: '🛠️', label: 'Ship features', unit: 'features', defaultTarget: 5, quickTargets: [3, 5, 10, 15] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  levelup: [
    { emoji: '📚', label: 'Read books', unit: 'books', defaultTarget: 5, quickTargets: [2, 5, 10, 20] },
    { emoji: '🎓', label: 'Learn a skill', unit: 'hours', defaultTarget: 20, quickTargets: [10, 20, 40, 60] },
    { emoji: '🗣️', label: 'Speak on stage', milestone: true },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
  wellbeing: [
    { emoji: '😴', label: 'Sleep early', unit: 'nights', defaultTarget: 20, quickTargets: [7, 14, 20, 30] },
    { emoji: '📓', label: 'Journal', unit: 'entries', defaultTarget: 20, quickTargets: [7, 14, 20, 30] },
    { emoji: '🚶', label: 'Walk', unit: 'km', defaultTarget: 50, quickTargets: [20, 50, 100, 150] },
    { emoji: '✏️', label: 'Something else', custom: true },
  ],
};

export const VIBE_DESCRIPTIONS: Record<VibeId, string> = {
  glowup: 'No excuses. Show up every day.',
  money: 'Watch every rupee turn into a habit.',
  dare: 'Scary is the point.',
  adventure: 'Collect moments, not things.',
  love: 'Show up for the people who show up for you.',
  social: 'More people. More stories. More life.',
  create: 'Make something worth showing.',
  build: 'Build something every day.',
  levelup: 'One step smarter, every day.',
  wellbeing: 'Take care of the machine.',
};

export const PROOF_METHODS = ['Photo', 'Video', 'Check-in', 'Activity data'] as const;
export const PROOF_FREQUENCIES = ['Every day', 'Every 2 days', 'Every week', 'At the end of the Pact'] as const;

export const AUDIENCES: {
  emoji: string;
  label: AudienceLabel;
  desc: string;
  visibility: VisibilityLabel;
}[] = [
  { emoji: '🙋', label: 'Just me', desc: 'Personal accountability', visibility: 'Only me' },
  { emoji: '👯', label: 'My Circle', desc: 'Challenge your friends', visibility: 'My Circle' },
  { emoji: '🌎', label: 'Everyone', desc: 'Let anyone join', visibility: 'Everyone' },
];

export const DURATION_PRESETS = [7, 30, 60, 90] as const;

// Generic fallback used for custom ("Something else") activities.
export const CUSTOM_ACTIVITY_DEFAULTS = {
  unit: 'times',
  defaultTarget: 10,
  quickTargets: [5, 10, 20, 30],
};
