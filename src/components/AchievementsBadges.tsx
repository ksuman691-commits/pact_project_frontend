'use client';

import React from 'react';
import { Lock, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number; // 0-100 for locked achievements
  unlockedAt?: string;
}

interface AchievementsBadgesProps {
  achievements: Achievement[];
}

const rarityConfig: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  epic: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  legendary: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
};

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
            const config = rarityConfig[achievement.rarity];
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 text-center transition hover:shadow-lg cursor-pointer group ${config.bg} ${config.border}`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="text-xs font-bold text-gray-900">{achievement.name}</p>
                <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>

                {/* Rarity Badge */}
                <div className="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-white/50 text-gray-700 capitalize">
                  {achievement.rarity}
                </div>

                {/* Unlock Date */}
                {achievement.unlockedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
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
              const config = rarityConfig[achievement.rarity];
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 text-center transition opacity-60 hover:opacity-80 ${config.bg} ${config.border}`}
                  title={achievement.description}
                >
                  <div className="relative">
                    <div className="text-4xl mb-2 blur-sm">{achievement.icon}</div>
                    <Lock className="absolute top-0 right-0 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-600">{achievement.name}</p>

                  {/* Progress Bar */}
                  {achievement.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
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
