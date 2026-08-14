'use client';

import { useCountUp } from './useCountUp';

interface StatBarProps {
  label: string;
  /** Value from 0-100 representing percentage fill. */
  percent: number;
  /** Optional raw value to display instead of the percent (e.g. "12/20"). */
  displayValue?: string;
  color?: string;
  className?: string;
}

/**
 * Animated horizontal progress bar with a count-up percentage. Used for
 * win-rate, streak-to-next-tier, and category breakdowns.
 */
export default function StatBar({
  label,
  percent,
  displayValue,
  color = 'var(--pact-violet)',
  className = '',
}: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const animated = useCountUp(clamped);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--pact-text-dim)]">{label}</span>
        <span className="pact-mono text-xs font-semibold text-[var(--pact-text)]">
          {displayValue ?? `${animated}%`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--pact-surface-2)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            background: color,
            boxShadow: clamped > 0 ? `0 0 8px ${color}` : undefined,
          }}
        />
      </div>
    </div>
  );
}
