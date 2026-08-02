'use client';

import React from 'react';

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

export default function ProfileStats({ 
  stats,
  onPactClick,
  onFollowersClick,
  onFollowingClick
}: ProfileStatsProps) {
  const statConfigs = [
    {
      label: 'Pact',
      value: stats.pactsCreated,
      onClick: onPactClick,
    },
    {
      label: 'Followers',
      value: stats.followers ?? 0,
      onClick: onFollowersClick,
    },
    {
      label: 'Following',
      value: stats.following ?? 0,
      onClick: onFollowingClick,
    },
  ];

  return (
    <div className="flex gap-3 mb-6">
      {statConfigs.map((config, idx) => (
        <button
          key={idx}
          onClick={config.onClick}
          className="flex-1 p-4 bg-white border border-emerald-100 rounded-[24px] hover:border-emerald-300 hover:bg-[#EDE9FE] transition group"
        >
          <p className="text-2xl font-bold text-[#A78BFA] group-hover:text-emerald-700">{config.value}</p>
          <p className="text-xs font-medium text-[#6B7280] mt-1">{config.label}</p>
        </button>
      ))}
    </div>
  );
}
