import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, Award, Flame } from 'lucide-react';

interface ProfileStatsProps {
  completed: number;
  failed: number;
  winRate: number;
  reputation: number;
  streak: number;
}

export default function ProfileStats({
  completed,
  failed,
  winRate,
  reputation,
  streak,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Completed */}
      <div className="bg-card rounded-md p-3 border border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-navy" />
          <p className="text-xs font-semibold text-[var(--navy)]">Completed</p>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">{completed}</p>
      </div>

      {/* Failed */}
      <div className="bg-[var(--warn-bg)] rounded-md p-3 border border-[var(--line)]">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-[var(--warn-text)]" />
          <p className="text-xs font-semibold text-[var(--warn-text)]">Failed</p>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">{failed}</p>
      </div>

      {/* Win Rate */}
      <div className="bg-[var(--card)] rounded-md p-3 border border-[var(--line)]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[var(--navy)]" />
          <p className="text-xs font-semibold text-[var(--navy)]">Win Rate</p>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">{winRate}%</p>
      </div>

      {/* Streak */}
      <div className="bg-[var(--warn-bg)] rounded-md p-3 border border-[var(--line)]">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-[var(--warn-text)]" />
          <p className="text-xs font-semibold text-[var(--warn-text)]">Streak</p>
        </div>
        <p className="text-2xl font-black text-[var(--ink)]">{streak}d</p>
      </div>

      {/* Reputation */}
      <div className="bg-card-muted rounded-md p-3 border border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-ink" />
          <p className="text-xs font-semibold text-ink">Reputation</p>
        </div>
        <p className="text-2xl font-black text-ink">{reputation}</p>
      </div>
    </div>
  );
}
