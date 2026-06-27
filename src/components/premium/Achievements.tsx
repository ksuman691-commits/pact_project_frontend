import React from 'react';
import { Trophy, Zap, Target, Heart, TrendingUp, Award } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number; // 0-100
  unlockedAt?: string;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900">Achievements</h3>
        <span className="text-sm font-semibold text-emerald-600">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-xl p-4 flex flex-col items-center text-center transition-all ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200'
                : 'bg-slate-50 border border-slate-200 opacity-50'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                achievement.unlocked
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {achievement.icon}
            </div>

            <h4 className="text-xs font-bold text-slate-900">{achievement.title}</h4>

            {achievement.progress !== undefined && !achievement.unlocked && (
              <div className="w-full mt-2">
                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{achievement.progress}%</p>
              </div>
            )}

            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-xs text-amber-700 mt-2">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
