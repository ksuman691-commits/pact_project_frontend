/**
 * Shared "tier" visual language used by both the streak avatar ring
 * (based on `currentStreak` days) and achievement rarity badges
 * (based on `rarity`). Both features resolve to one of the same four
 * TierKey values so they read as a single consistent design system.
 */

export type TierKey = 'none' | 'building' | 'strong' | 'peak';

export interface TierStyle {
  key: TierKey;
  label: string;
  /** Flat palette color used for the ring band. */
  ringColor: string;
  /** Ring band thickness in px. */
  ringWidth: number;
  /** rgba color used for the outer glow box-shadow. */
  glowColor: string;
  /** Glow blur radius in px. 0 means no glow. */
  glowBlur: number;
  /** Whether this tier gets the slow shimmer/sheen sweep animation. */
  shimmer: boolean;
}

export const TIER_STYLES: Record<TierKey, TierStyle> = {
  none: {
    key: 'none',
    label: 'None',
    ringColor: 'var(--dash)',
    ringWidth: 2,
    glowColor: 'transparent',
    glowBlur: 0,
    shimmer: false,
  },
  building: {
    key: 'building',
    label: 'Building',
    ringColor: 'var(--tan)',
    ringWidth: 1,
    glowColor: 'transparent',
    glowBlur: 0,
    shimmer: false,
  },
  strong: {
    key: 'strong',
    label: 'Strong',
    ringColor: 'var(--navy-hover)',
    ringWidth: 3,
    glowColor: 'transparent',
    glowBlur: 14,
    shimmer: false,
  },
  peak: {
    key: 'peak',
    label: 'Peak',
    ringColor: 'var(--navy)',
    ringWidth: 3,
    glowColor: 'transparent',
    glowBlur: 20,
    shimmer: true,
  },
};

export function getTierStyle(key: TierKey): TierStyle {
  return TIER_STYLES[key];
}

/** Maps a streak day count to a tier. */
export function getStreakTier(streakDays: number): TierKey {
  if (streakDays >= 30) return 'peak';
  if (streakDays >= 7) return 'strong';
  if (streakDays >= 1) return 'building';
  return 'none';
}

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Maps an achievement rarity to the same tier scale used by streaks. */
export function getRarityTier(rarity: AchievementRarity): TierKey {
  switch (rarity) {
    case 'legendary':
      return 'peak';
    case 'epic':
      return 'strong';
    case 'rare':
      return 'building';
    default:
      return 'none';
  }
}
