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
      <PremiumCard glass className="bg-gradient-to-br   border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <Users className="w-5 h-5 text-[var(--navy)]" />
          <span className="text-xs font-bold text-[var(--navy)]">Members</span>
        </div>
        <p className="text-3xl font-black text-[var(--ink)]">{memberCount}</p>
      </PremiumCard>

      {/* Active Pacts */}
      <PremiumCard glass className="bg-gradient-to-br   border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <Target className="w-5 h-5 text-[var(--navy)]" />
          <span className="text-xs font-bold text-[var(--navy)]">Active</span>
        </div>
        <p className="text-3xl font-black text-[var(--ink)]">{activePacts}</p>
      </PremiumCard>

      {/* Total Wins */}
      <PremiumCard glass className="bg-gradient-to-br   border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-[#A78BFA]" />
          <span className="text-xs font-bold text-[var(--navy)]">Wins</span>
        </div>
        <p className="text-3xl font-black text-[var(--ink)]">{totalWins}</p>
      </PremiumCard>

      {/* Avg Win Rate */}
      <PremiumCard glass className="bg-gradient-to-br   border-[var(--line)]">
        <div className="flex items-start justify-between mb-2">
          <Zap className="w-5 h-5 text-[var(--warn-text)]" />
          <span className="text-xs font-bold text-[var(--warn-text)]">Win Rate</span>
        </div>
        <p className="text-3xl font-black text-[var(--ink)]">{avgWinRate}%</p>
      </PremiumCard>
    </div>
  );
}
