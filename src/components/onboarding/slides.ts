import { Target, Users, Flame, LucideIcon } from 'lucide-react';

export interface OnboardingSlide {
  icon: LucideIcon;
  emoji: string;
  headline: string;
  body: string;
  /** Single accent color driving this slide's badge glow + active dot. */
  accent: string;
}

/**
 * The three onboarding beats — commit to it, get verified, build your streak.
 * CirclePact has no wagering or financial-stakes mechanic — accountability
 * comes from your Circle seeing your progress and proof, not money at risk.
 */
export const onboardingSlides: OnboardingSlide[] = [
  {
    icon: Target,
    emoji: '🎯',
    headline: 'Make it a Pact.',
    body: 'Turn a goal — a savings target, a workout streak, anything — into a Pact with a deadline, so it actually holds you to it.',
    accent: 'var(--pact-pink)',
  },
  {
    icon: Users,
    emoji: '🖐️',
    headline: 'Your Circle keeps you honest.',
    body: 'People you trust vote Believe or Doubt on your proof. No self-grading — verification comes from your Circle.',
    accent: 'var(--pact-gold)',
  },
  {
    icon: Flame,
    emoji: '🔥',
    headline: 'Show up. Build your streak.',
    body: 'Follow through and your reputation grows. Your streak builds with every Pact you keep, cheered on by the people who believed in you.',
    accent: 'var(--pact-mint)',
  },
];
