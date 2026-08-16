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
 * The three onboarding beats — stake it, get verified, get rewarded. Mirrors
 * the shorthand pitch already used on the register page's marketing rail,
 * but as full-bleed swipeable moments instead of a static bullet list.
 */
export const onboardingSlides: OnboardingSlide[] = [
  {
    icon: Target,
    emoji: '🎯',
    headline: 'Put real stakes on it.',
    body: 'Turn a goal into a Pact, stake money on finishing it, and give yourself a reason that actually holds.',
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
    headline: 'Win money. Build your streak.',
    body: 'Follow through and your stake grows. Your streak and reputation build with every Pact you keep.',
    accent: 'var(--pact-mint)',
  },
];
