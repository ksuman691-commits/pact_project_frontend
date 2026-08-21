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
  value: number | string;
  onClick?: () => void;
}) {
  const numeric = typeof value === 'number' ? value : undefined;
  const animated = numeric !== undefined ? useCountUp(numeric) : value;
  const isButton = typeof onClick === 'function';
  const Tag = isButton ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`flex-1 px-3 py-3 text-center transition${isButton ? ' hover:bg-[var(--pact-surface-2)]' : ''}`}
    >
      <p className="text-lg font-black text-[var(--pact-text)]">{animated}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">{label}</p>
    </Tag>
  );
}

export default function ProfileStats({
  stats,
  onPactClick,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  const completed = useCountUp(stats.pactsCompleted);
  return (
    <div className="mb-6 space-y-4">
      {/* Hero number — same "label + big number + supporting line" header
          treatment used on Circles/Pacts/Dares, so Profile reads as the
          same visual language instead of the older stat-row-first layout. */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Profile</p>
        <div className="mt-2 flex items-center gap-4">
          <span className="pact-mono text-6xl font-black leading-none tracking-[-0.07em] text-[var(--pact-text)]">
            {completed}
          </span>
          <span className="text-balance text-lg font-medium leading-[1.15] tracking-[-0.02em] text-[var(--pact-text-muted)]">
            Pacts completed<br />and counting
          </span>
        </div>
      </div>

      {/* Unified stat row — each stat is a real action where one applies,
          matching the Dares/Circles/Pacts pattern instead of the old
          separated stat-row card. */}
      <div className="flex items-stretch divide-x divide-[var(--pact-hairline)] rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)]">
        <StatTile label="Pacts" value={stats.pactsCreated} onClick={onPactClick} />
        <StatTile label="Followers" value={stats.followers ?? 0} onClick={onFollowersClick} />
        <StatTile label="Following" value={stats.following ?? 0} onClick={onFollowingClick} />
        <StatTile label="Streak" value={`${stats.currentStreak}d`} />
      </div>

      {/* Win rate — kept as its own supporting card since it needs the
          locked/unlocked treatment; not part of the unified row above. */}
      <div className="pact-card grid grid-cols-1 gap-4 rounded-2xl p-4">
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
            <div className="relative h-2 w-full overflow-hidden rounded-full border border-dashed bg-[var(--pact-surface-2)]" style={{ borderColor: 'var(--pact-hairline)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, (stats.pactsCompleted / WIN_RATE_UNLOCK_THRESHOLD) * 100)}%`, background: 'repeating-linear-gradient(135deg, var(--pact-text-faint) 0 4px, transparent 4px 8px)' }}
              />
              <Lock className="absolute right-1/2 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 text-[var(--pact-text-faint)]" />
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--pact-text-faint)]">
              Complete {WIN_RATE_UNLOCK_THRESHOLD - stats.pactsCompleted} more pact{WIN_RATE_UNLOCK_THRESHOLD - stats.pactsCompleted === 1 ? '' : 's'} to unlock
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
