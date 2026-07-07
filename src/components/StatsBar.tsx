'use client';

import React from 'react';

interface Stat {
  label: string;
  value: number | string;
  icon?: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="px-2 sm:px-4 py-3 sm:py-4 mb-4 sm:mb-6">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-slate-200 text-center hover:shadow-md transition-shadow"
          >
            {stat.icon && <p className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{stat.icon}</p>}
            <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-0.5 sm:mt-1 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
