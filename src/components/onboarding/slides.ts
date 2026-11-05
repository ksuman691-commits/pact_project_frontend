import { Target, Camera, Users, LucideIcon } from 'lucide-react';

export interface OnboardingSlide {
  icon: LucideIcon;
  emoji: string;
  headline: string;
  body: string;
  /** Single accent color driving this slide's badge glow + active dot. */
  accent: string;
}

/**
 * The three onboarding beats, matching how CirclePact works today (rewritten 5 Nov):
 * say it, show it, your circle keeps you honest. No money at stake and no voting on proof.
 */
export const onboardingSlides: OnboardingSlide[] = [
  {
    icon: Target,
    emoji: '🎯',
    headline: 'Say it.',
    body: 'Turn something you keep meaning to do into a pact: "Run 5 km every morning for 30 days." Start small; 7 days is plenty.',
    accent: 'var(--pact-pink)',
  },
  {
    icon: Camera,
    emoji: '📸',
    headline: 'Show it.',
    body: 'Post a photo or a 15-second video each day you do it. One missed day a week is a rest day, so a bad day doesn\'t undo your streak.',
    accent: 'var(--pact-gold)',
  },
  {
    icon: Users,
    emoji: '🤝',
    headline: 'Your circle keeps you honest.',
    body: 'Friends see your days, cheer you on and nudge you when you slip. Your CP Score starts at 75 and moves with what you actually do.',
    accent: 'var(--pact-mint)',
  },
];
