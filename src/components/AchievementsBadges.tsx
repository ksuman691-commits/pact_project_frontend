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

const rarityBgConfig: Record<AchievementRarity, { bg: string; text: string }> = {
  common: { bg: 'bg-gray-50', text: 'text-gray-700' },
  rare: { bg: 'bg-amber-50', text: 'text-amber-700' },
  epic: { bg: 'bg-orange-50', text: 'text-orange-700' },
  legendary: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">Unlocked ({unlockedAchievements.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {unlockedAchievements.map((achievement) => {
            const config = rarityBgConfig[achievement.rarity];
            const tier = getTierStyle(getRarityTier(achievement.rarity));
            return (
              <div
                key={achievement.id}
                className="relative rounded-[24px] transition hover:shadow-lg cursor-pointer group"
                style={getRingStyle(achievement.rarity, false)}
              >
                <div className={`p-4 rounded-[22px] text-center h-full ${config.bg}`}>
                  <div className={`${iconSizeConfig[achievement.rarity]} mb-2`}>{achievement.icon}</div>
                  <p className="text-xs font-bold text-gray-900">{achievement.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>

                  {/* Rarity Badge */}
                  <div className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-white/50 capitalize ${config.text}`}>
                    {achievement.rarity}
                  </div>

                  {/* Unlock Date */}
                  {achievement.unlockedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {tier.shimmer && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px] opacity-40 mix-blend-overlay">
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Locked ({lockedAchievements.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {lockedAchievements.map((achievement) => {
              const config = rarityBgConfig[achievement.rarity];
              return (
                <div
                  key={achievement.id}
                  className="rounded-[24px] transition opacity-60 hover:opacity-80"
                  style={getRingStyle(achievement.rarity, true)}
                  title={achievement.description}
                >
                  <div className={`p-4 rounded-[22px] text-center ${config.bg}`}>
                    <div className="relative">
                      <div className={`${iconSizeConfig[achievement.rarity]} mb-2 blur-sm`}>{achievement.icon}</div>
                      <Lock className="absolute top-0 right-0 w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-600">{achievement.name}</p>

                    {/* Progress Bar */}
                    {achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-[#A78BFA] h-2 rounded-full transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{achievement.progress}%</p>
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-200/50 text-gray-600 capitalize">
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
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No achievements yet</p>
          <p className="text-gray-400 text-sm">Start creating and completing pacts to unlock achievements</p>
        </div>
      )}
    </div>
  );
}
