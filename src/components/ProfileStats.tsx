'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useCountUp } from '@/components/pact-ui/useCountUp';
import StatBar from '@/components/pact-ui/StatBar';

// Below this many completed pacts, a win rate percentage is statistically
// meaningless (e.g. 1/1 reads as a misleading "100%") — show a locked
// placeholder instead, mirroring the circle leaderboard's own "unlocks
// once your circle gets moving" empty state (src/app/circles/[id]/page.tsx).
const WIN_RATE_UNLOCK_THRESHOLD = 3;

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
        {stats.pactsCompleted >= WIN_RATE_UNLOCK_THRESHOLD ? (
          <StatBar label="Win rate" percent={stats.winRate} color="var(--pact-mint)" />
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--pact-text-faint)]">
                <Lock className="h-3 w-3" />
                Win rate
              </span>
              <span className="pact-mono text-xs font-semibold text-[var(--pact-text-faint)]">
                {stats.pactsCompleted}/{WIN_RATE_UNLOCK_THRESHOLD}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--pact-surface-2)]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, (stats.pactsCompleted / WIN_RATE_UNLOCK_THRESHOLD) * 100)}%`, background: 'var(--pact-text-faint)' }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--pact-text-faint)]">
              Complete {WIN_RATE_UNLOCK_THRESHOLD - stats.pactsCompleted} more pact{WIN_RATE_UNLOCK_THRESHOLD - stats.pactsCompleted === 1 ? '' : 's'} to unlock
            </p>
          </div>
        )}
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
