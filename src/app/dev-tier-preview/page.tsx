'use client';

import StreakAvatarRing from '@/components/StreakAvatarRing';
import AchievementsBadges from '@/components/AchievementsBadges';

export default function DevTierPreview() {
  return (
    <div className="min-h-screen bg-slate-100 p-10 space-y-10">
      <div>
        <h2 className="font-bold mb-4">Streak rings</h2>
        <div className="flex gap-8 items-end">
          {[0, 3, 10, 45].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <StreakAvatarRing streak={s}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-[#A78BFA] flex items-center justify-center text-2xl font-bold text-white">
                  A
                </div>
              </StreakAvatarRing>
              <span className="text-xs">streak {s}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <StreakAvatarRing streak={10} atRisk>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-[#A78BFA] flex items-center justify-center text-2xl font-bold text-white">
                A
              </div>
            </StreakAvatarRing>
            <span className="text-xs">at risk</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-bold mb-4">Achievements</h2>
        <AchievementsBadges
          achievements={[
            { id: '1', name: 'First Pact', description: 'x', icon: '🎯', rarity: 'common', unlocked: true, unlockedAt: new Date().toISOString() },
            { id: '2', name: 'On Fire', description: 'x', icon: '🔥', rarity: 'rare', unlocked: true, unlockedAt: new Date().toISOString() },
            { id: '3', name: 'Trusted', description: 'x', icon: '⭐', rarity: 'epic', unlocked: true, unlockedAt: new Date().toISOString() },
            { id: '4', name: 'Legendary', description: 'x', icon: '👑', rarity: 'legendary', unlocked: true, unlockedAt: new Date().toISOString() },
            { id: '5', name: 'Locked epic', description: 'x', icon: '⭐', rarity: 'epic', unlocked: false, progress: 40 },
            { id: '6', name: 'Locked legend', description: 'x', icon: '👑', rarity: 'legendary', unlocked: false, progress: 10 },
          ]}
        />
      </div>
    </div>
  );
}
