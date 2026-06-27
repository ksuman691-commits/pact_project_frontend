import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, Award, Flame } from 'lucide-react';

interface ProfileStatsProps {
  completed: number;
  failed: number;
  winRate: number;
  reputation: number;
  streak: number;
  totalEarned: number;
}

export default function ProfileStats({
  completed,
  failed,
  winRate,
  reputation,
  streak,
  totalEarned,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Completed */}
      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-700">Completed</p>
        </div>
        <p className="text-2xl font-black text-emerald-900">{completed}</p>
      </div>

      {/* Failed */}
      <div className="bg-red-50 rounded-xl p-3 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <p className="text-xs font-semibold text-red-700">Failed</p>
        </div>
        <p className="text-2xl font-black text-red-900">{failed}</p>
      </div>

      {/* Win Rate */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-semibold text-blue-700">Win Rate</p>
        </div>
        <p className="text-2xl font-black text-blue-900">{winRate}%</p>
      </div>

      {/* Streak */}
      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-orange-600" />
          <p className="text-xs font-semibold text-orange-700">Streak</p>
        </div>
        <p className="text-2xl font-black text-orange-900">{streak}d</p>
      </div>

      {/* Reputation */}
      <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-purple-600" />
          <p className="text-xs font-semibold text-purple-700">Reputation</p>
        </div>
        <p className="text-2xl font-black text-purple-900">{reputation}</p>
      </div>

      {/* Money Earned */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-amber-700">Total Won</p>
        </div>
        <p className="text-2xl font-black text-amber-900">${totalEarned}</p>
      </div>
    </div>
  );
}
