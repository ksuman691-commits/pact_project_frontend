'use client';

import React from 'react';
import { Target, CheckCircle, TrendingUp, Flame, DollarSign, Star } from 'lucide-react';
import { realMoneyFeatures } from '@/config/features';

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

const baseStatConfigs = [
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
  // Total Earned only shown if real money features enabled
  ...(realMoneyFeatures.showWalletBalance ? [
    {
      label: 'Total Earned',
      value: 'totalEarned',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
      prefix: '₹',
    },
  ] : []),
  {
    label: 'Reputation',
    value: 'reputation',
    icon: Star,
    color: 'text-yellow-600 bg-yellow-100',
  },
];

const statConfigs = baseStatConfigs;

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-flow-col auto-cols-[minmax(11rem,1fr)] gap-4 overflow-x-auto pb-2 mb-8 md:grid md:grid-cols-5 md:overflow-visible md:auto-cols-auto">
      {statConfigs.map((config) => {
        const Icon = config.icon;
        const value = stats[config.value as keyof typeof stats];
        const formattedValue = `${config.prefix || ''}${value}${config.suffix || ''}`;
        
        return (
          <div
            key={config.value}
            className="min-w-[11rem] rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-sm">
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Live
              </span>
            </div>
            <p className="text-4xl font-black leading-none tracking-tight text-slate-950 sm:text-[2.6rem]">
              {formattedValue}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">{config.label}</p>
          </div>
        );
      })}
    </div>
  );
}
