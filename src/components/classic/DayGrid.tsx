'use client';

export type DayCellStatus = 'kept' | 'missed' | 'upcoming';

interface DayGridProps {
  /** One entry per required check-in/day of the pact, in order. */
  days: DayCellStatus[];
  className?: string;
}

/**
 * Honest day-by-day pact progress: kept days fill solid, missed days are
 * hatched (not hidden or softened), upcoming days are dashed. Tally line
 * below is computed directly from `days` — never a separately-sourced
 * number that could drift from what's drawn above it.
 */
export default function DayGrid({ days, className = '' }: DayGridProps) {
  const kept = days.filter((d) => d === 'kept').length;
  const missed = days.filter((d) => d === 'missed').length;
  const upcoming = days.filter((d) => d === 'upcoming').length;

  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((status, i) => (
          <div
            key={i}
            role="img"
            aria-label={`Day ${i + 1}: ${status}`}
            className="h-7 rounded-thumb"
            style={
              status === 'kept'
                ? { background: 'var(--navy)' }
                : status === 'missed'
                  ? {
                      border: '1.5px solid var(--missed-border)',
                      backgroundImage:
                        'repeating-linear-gradient(135deg, transparent 0 5px, var(--missed-stripe) 5px 6.5px)',
                    }
                  : { border: '1px dashed var(--dash)' }
            }
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{kept}</span> kept
        <span className="inline-block" style={{ width: 14 }} />
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{missed}</span> missed
        <span className="inline-block" style={{ width: 14 }} />
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{upcoming}</span> to go
      </p>
    </div>
  );
}
