'use client';

import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { AchievementRarity, getRarityTier, getTierStyle } from '@/lib/tierStyles';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  progress?: number; // 0-100 for locked achievements
  unlockedAt?: string;
}

interface AchievementsBadgesProps {
  achievements: Achievement[];
}

const rarityTextConfig: Record<AchievementRarity, string> = {
  common: 'text-[var(--pact-text-faint)]',
  rare: 'text-[var(--pact-gold)]',
  epic: 'text-[var(--pact-pink)]',
  legendary: 'text-[var(--pact-gold)]',
};

// Higher tiers render visually heavier — bigger icon, not just a different color.
const iconSizeConfig: Record<AchievementRarity, string> = {
  common: 'text-4xl',
  rare: 'text-4xl',
  epic: 'text-5xl',
  legendary: 'text-6xl',
};

function getRingStyle(rarity: AchievementRarity, locked: boolean): React.CSSProperties {
  const tier = getTierStyle(getRarityTier(rarity));
  return {
    background: tier.ringGradient,
    padding: `${tier.ringWidth}px`,
    boxShadow: !locked && tier.glowBlur > 0 ? `0 0 ${tier.glowBlur}px ${tier.glowColor}` : undefined,
  };
}

export default function AchievementsBadges({ achievements }: AchievementsBadgesProps) {
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-8">
      {/* Unlocked Achievements */}
      <div>
        <h3 className="text-lg font-bold text-[var(--pact-text)] mb-4">Unlocked ({unlockedAchievements.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {unlockedAchievements.map((achievement) => {
            const textClass = rarityTextConfig[achievement.rarity];
            const tier = getTierStyle(getRarityTier(achievement.rarity));
            return (
              <div
                key={achievement.id}
                className="pact-btn-glow relative rounded-3xl transition cursor-pointer group"
                style={getRingStyle(achievement.rarity, false)}
              >
                <div className="pact-card p-4 rounded-[22px] text-center h-full">
                  <div className={`${iconSizeConfig[achievement.rarity]} mb-2`}>{achievement.icon}</div>
                  <p className="text-xs font-bold text-[var(--pact-text)]">{achievement.name}</p>
                  <p className="text-xs text-[var(--pact-text-faint)] mt-1">{achievement.description}</p>

                  {/* Rarity Badge */}
                  <div
                    className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${textClass}`}
                    style={{ background: 'var(--pact-surface-2)' }}
                  >
                    {achievement.rarity}
                  </div>

                  {/* Unlock Date */}
                  {achievement.unlockedAt && (
                    <p className="text-xs text-[var(--pact-text-faint)] mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {tier.shimmer && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl opacity-40 mix-blend-overlay">
                    <div className="absolute inset-y-0 -inset-x-1/2 tier-shimmer-sweep" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-[var(--pact-text)] mb-4">Locked ({lockedAchievements.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {lockedAchievements.map((achievement) => {
              return (
                <div
                  key={achievement.id}
                  className="rounded-3xl transition opacity-60 hover:opacity-80"
                  style={getRingStyle(achievement.rarity, true)}
                  title={achievement.description}
                >
                  <div className="pact-card p-4 rounded-[22px] text-center">
                    <div className="relative">
                      <div className={`${iconSizeConfig[achievement.rarity]} mb-2 blur-sm`}>{achievement.icon}</div>
                      <Lock className="absolute top-0 right-0 w-5 h-5 text-[var(--pact-text-faint)]" />
                    </div>
                    <p className="text-xs font-bold text-[var(--pact-text-dim)]">{achievement.name}</p>

                    {/* Progress Bar */}
                    {achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full h-2 rounded-full" style={{ background: 'var(--pact-surface-2)' }}>
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${achievement.progress}%`,
                              background: 'linear-gradient(90deg, var(--pact-pink), var(--pact-violet))',
                            }}
                          />
                        </div>
                        <p className="text-xs text-[var(--pact-text-faint)] mt-1">{achievement.progress}%</p>
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div
                      className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium capitalize text-[var(--pact-text-faint)]"
                      style={{ background: 'var(--pact-surface-2)' }}
                    >
                      {achievement.rarity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-[var(--pact-text-faint)] mx-auto mb-4" />
          <p className="text-[var(--pact-text-dim)] font-medium">No achievements yet</p>
          <p className="text-[var(--pact-text-faint)] text-sm">Start creating and completing pacts to unlock achievements</p>
        </div>
      )}
    </div>
  );
}
