'use client';

import React from 'react';
import { useCountUp } from '@/components/pact-ui/useCountUp';
import StatBar from '@/components/pact-ui/StatBar';

interface ProfileStatsProps {
  stats: {
    pactsCreated: number;
    pactsCompleted: number;
    winRate: number;
    currentStreak: number;
    reputation: number;
    followers?: number;
    following?: number;
  };
  onPactClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

function StatTile({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const animated = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className="flex-1 px-4 py-4 text-left transition hover:bg-[var(--pact-surface-2)]"
    >
      <p className="pact-mono text-2xl font-bold text-[var(--pact-text)]">{animated}</p>
      <p className="mt-1 text-xs font-medium text-[var(--pact-text-faint)]">{label}</p>
    </button>
  );
}

export default function ProfileStats({
  stats,
  onPactClick,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="pact-card flex divide-x overflow-hidden rounded-2xl" style={{ borderColor: 'var(--pact-hairline)' }}>
        <StatTile label="Pacts" value={stats.pactsCreated} onClick={onPactClick} />
        <StatTile label="Followers" value={stats.followers ?? 0} onClick={onFollowersClick} />
        <StatTile label="Following" value={stats.following ?? 0} onClick={onFollowingClick} />
      </div>
      <div className="pact-card grid grid-cols-2 gap-4 rounded-2xl p-4">
        <StatBar label="Win rate" percent={stats.winRate} color="var(--pact-mint)" />
        <StatBar
          label="Streak"
          percent={Math.min(100, (stats.currentStreak / 30) * 100)}
          displayValue={`${stats.currentStreak}d`}
          color="var(--pact-gold)"
        />
      </div>
    </div>
  );
}
