'use client';

import React from 'react';
import { Target, CheckCircle, TrendingUp, Flame, DollarSign, Star } from 'lucide-react';

interface ProfileStatsProps {
  stats: {
    pactsCreated: number;
    pactsCompleted: number;
    winRate: number;
    currentStreak: number;
    totalEarned: number;
    reputation: number;
  };
}

const statConfigs = [
  {
    label: 'Pacts Created',
    value: 'pactsCreated',
    icon: Target,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    label: 'Completed',
    value: 'pactsCompleted',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-100',
  },
  {
    label: 'Win Rate',
    value: 'winRate',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-100',
    suffix: '%',
  },
  {
    label: 'Current Streak',
    value: 'currentStreak',
    icon: Flame,
    color: 'text-orange-600 bg-orange-100',
  },
  {
    label: 'Total Earned',
    value: 'totalEarned',
    icon: DollarSign,
    color: 'text-green-600 bg-green-100',
    prefix: '₹',
  },
  {
    label: 'Reputation',
    value: 'reputation',
    icon: Star,
    color: 'text-yellow-600 bg-yellow-100',
  },
];

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {statConfigs.map((config) => {
        const Icon = config.icon;
        const value = stats[config.value as keyof typeof stats];
        
        return (
          <div
            key={config.value}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
          >
            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-gray-600 text-xs font-medium mb-1">{config.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {config.prefix && <span>{config.prefix}</span>}
              {value}
              {config.suffix && <span>{config.suffix}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
