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
    <div className="px-4 py-6 mx-2 sm:mx-0 mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="grid grid-cols-4 gap-4 divide-x divide-slate-200">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="text-center px-2 first:pl-0 last:pr-0"
          >
            {stat.icon && <p className="text-2xl mb-2">{stat.icon}</p>}
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stat.value}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-2 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
