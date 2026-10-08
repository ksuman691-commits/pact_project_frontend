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
      <div className="bg-[var(--card)] rounded-3xl border border-[var(--hairline)] shadow-[0_4px_12px_rgba(23,24,29,0.08)] py-6 px-4">
        <div className="grid grid-cols-4 gap-3 divide-x divide-[var(--line)]">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center px-3 first:pl-0 last:pr-0"
            >
              {stat.icon && <p className="text-3xl mb-2">{stat.icon}</p>}
              <p className="text-3xl sm:text-4xl font-black text-[var(--ink)] leading-tight">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--muted)] font-semibold mt-2 ">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
