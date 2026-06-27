import React from 'react';
import { Users, Target, TrendingUp, Zap } from 'lucide-react';
import PremiumCard from './PremiumCard';

interface CircleStatsProps {
  memberCount: number;
  activePacts: number;
  totalWins: number;
  avgWinRate: number;
}

export default function CircleStats({
  memberCount,
  activePacts,
  totalWins,
  avgWinRate,
}: CircleStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Members */}
      <PremiumCard glass className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">Members</span>
        </div>
        <p className="text-3xl font-black text-blue-900">{memberCount}</p>
      </PremiumCard>

      {/* Active Pacts */}
      <PremiumCard glass className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 border-purple-200">
        <div className="flex items-start justify-between mb-2">
          <Target className="w-5 h-5 text-purple-600" />
          <span className="text-xs font-bold text-purple-700">Active</span>
        </div>
        <p className="text-3xl font-black text-purple-900">{activePacts}</p>
      </PremiumCard>

      {/* Total Wins */}
      <PremiumCard glass className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 border-emerald-200">
        <div className="flex items-start justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">Wins</span>
        </div>
        <p className="text-3xl font-black text-emerald-900">{totalWins}</p>
      </PremiumCard>

      {/* Avg Win Rate */}
      <PremiumCard glass className="bg-gradient-to-br from-amber-50/80 to-amber-100/80 border-amber-200">
        <div className="flex items-start justify-between mb-2">
          <Zap className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Win Rate</span>
        </div>
        <p className="text-3xl font-black text-amber-900">{avgWinRate}%</p>
      </PremiumCard>
    </div>
  );
}
