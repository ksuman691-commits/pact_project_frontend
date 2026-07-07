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
    <div className="max-w-md mx-auto px-4 py-6 mb-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm py-6 px-4">
        <div className="grid grid-cols-4 gap-3 divide-x divide-slate-200">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center px-3 first:pl-0 last:pr-0"
            >
              {stat.icon && <p className="text-3xl mb-2">{stat.icon}</p>}
              <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
