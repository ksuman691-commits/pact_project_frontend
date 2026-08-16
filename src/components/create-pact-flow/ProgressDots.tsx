'use client';

import React from 'react';

interface ProgressDotsProps {
  current: number;
  total: number;
}

/** Small pill-shaped dots — never "1 of 7" text. */
export default function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      {Array.from({ length: total + 1 }).map((_, i) => {
        const active = i === current;
        const past = i < current;
        return (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-200"
            style={{
              width: active ? '20px' : '6px',
              background: active
                ? 'var(--flow-accent)'
                : past
                  ? 'var(--flow-accent-2)'
                  : 'var(--pact-hairline)',
            }}
          />
        );
      })}
    </div>
  );
}
