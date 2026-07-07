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
    <div className="px-4 py-4 mb-6">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 text-center hover:shadow-md transition-shadow"
          >
            {stat.icon && <p className="text-2xl mb-1">{stat.icon}</p>}
            <p className="text-2xl font-bold text-slate-900">
              {stat.value}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-1 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
