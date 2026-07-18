'use client';

import React from 'react';

interface ProfileStatsProps {
  stats: {
    pactsCreated: number;
    pactsCompleted: number;
    winRate: number;
    currentStreak: number;
    totalEarned: number;
    reputation: number;
    followers?: number;
    following?: number;
  };
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  const statConfigs = [
    {
      label: 'Pact',
      value: stats.pactsCreated,
    },
    {
      label: 'Followers',
      value: stats.followers ?? 0,
    },
    {
      label: 'Following',
      value: stats.following ?? 0,
    },
  ];

  return (
    <div className="flex justify-around gap-4 mb-8 bg-white rounded-2xl border border-gray-100 p-6">
      {statConfigs.map((config, idx) => (
        <div key={idx} className="flex-1 text-center">
          <p className="text-3xl font-bold text-slate-950">{config.value}</p>
          <p className="text-sm font-medium text-slate-500 mt-1">{config.label}</p>
        </div>
      ))}
    </div>
  );
}
