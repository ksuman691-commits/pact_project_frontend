'use client';

import React, { useState } from 'react';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string;
  pactsCompleted: number;
  winRate: number;
  rewardsEarned: number;
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
  const [sortBy, setSortBy] = useState<'pactsCompleted' | 'winRate' | 'rewards'>('pactsCompleted');

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'rewards':
        return b.rewardsEarned - a.rewardsEarned;
      case 'pactsCompleted':
      default:
        return b.pactsCompleted - a.pactsCompleted;
    }
  });

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {entries.length} members
          </span>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'pactsCompleted', label: 'Pacts', icon: '📋' },
            { key: 'winRate', label: 'Win Rate', icon: '🎯' },
            { key: 'rewards', label: 'Rewards', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                sortBy === tab.key
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                Pacts
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                Win Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                Rewards
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry, idx) => (
              <tr
                key={entry.userId}
                className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                  idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-50' : idx === 2 ? 'bg-orange-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getMedalEmoji(entry.rank) || `#${entry.rank}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {entry.avatar || entry.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">@{entry.username}</p>
                      <p className="text-xs text-gray-600">Member</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-gray-900">{entry.pactsCompleted}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-900">{entry.winRate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-emerald-600">
                    ₹{entry.rewardsEarned.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-gray-900">{entry.streak}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-100 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && !loading && (
        <div className="px-6 py-12 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No leaderboard entries yet</p>
          <p className="text-sm text-gray-500">Members will appear here once they start completing pacts.</p>
        </div>
      )}
    </div>
  );
}
