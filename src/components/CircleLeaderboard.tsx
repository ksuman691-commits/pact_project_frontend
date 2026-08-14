'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { useCountUp } from '@/components/pact-ui/useCountUp';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string;
  pactsCompleted: number;
  winRate: number;
  streak: number;
}

interface CircleLeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function CircleLeaderboard({
  entries,
  loading = false,
  onLoadMore,
  hasMore = false,
}: CircleLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'pactsCompleted' | 'winRate'>('pactsCompleted');

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'pactsCompleted':
      default:
        return b.pactsCompleted - a.pactsCompleted;
    }
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, var(--pact-gold), #f5a623)', color: '#14121F' };
    if (rank === 2) return { bg: 'var(--pact-surface-2)', color: 'var(--pact-text-dim)' };
    if (rank === 3) return { bg: 'var(--pact-surface-2)', color: 'var(--pact-gold)' };
    return null;
  };

  return (
    <div
      className="pact-card rounded-[28px] overflow-hidden"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-[var(--pact-hairline)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6" style={{ color: 'var(--pact-gold)' }} />
            <h2 className="text-2xl font-bold text-[var(--pact-text)]">Leaderboard</h2>
          </div>
          <span className="text-sm font-medium text-[var(--pact-text-faint)]">
            {entries.length} members
          </span>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'pactsCompleted', label: 'Pacts' },
            { key: 'winRate', label: 'Win Rate' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key as any)}
              className="px-4 py-2 rounded-[28px] font-medium text-sm transition"
              style={
                sortBy === tab.key
                  ? { background: 'var(--pact-violet)', color: '#ffffff' }
                  : { background: 'var(--pact-surface-2)', color: 'var(--pact-text-dim)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div className="flex flex-col gap-1 p-3">
        {sortedEntries.map((entry, idx) => {
          const badge = getRankBadge(entry.rank);
          return <LeaderboardRow key={entry.userId} entry={entry} badge={badge} index={idx} />;
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-[var(--pact-hairline)] text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 font-medium rounded-[28px] transition disabled:opacity-50"
            style={{ color: 'var(--pact-violet)' }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && !loading && (
        <div className="px-6 py-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--pact-text-faint)' }} />
          <p className="text-[var(--pact-text-dim)] font-medium">No leaderboard entries yet</p>
          <p className="text-sm text-[var(--pact-text-faint)]">Members will appear here once they start completing pacts.</p>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  badge,
  index,
}: {
  entry: LeaderboardEntry;
  badge: { bg: string; color: string } | null;
  index: number;
}) {
  const pacts = useCountUp(entry.pactsCompleted);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="pact-list-item flex items-center gap-3 px-3 py-3 rounded-2xl transition"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={badge ? { background: badge.bg, color: badge.color } : { color: 'var(--pact-text-faint)' }}
      >
        {badge ? entry.rank : `#${entry.rank}`}
      </div>

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
      >
        {entry.avatar || entry.username.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--pact-text)] truncate">@{entry.username}</p>
        <p className="text-xs text-[var(--pact-text-faint)]">Member</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[var(--pact-text)] tabular-nums">{pacts}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--pact-violet)' }} />
          <span className="text-sm font-semibold text-[var(--pact-text-dim)]">{entry.winRate}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--pact-gold)' }} />
          <span className="text-sm font-semibold text-[var(--pact-text-dim)]">{entry.streak}</span>
        </div>
      </div>
    </motion.div>
  );
}
