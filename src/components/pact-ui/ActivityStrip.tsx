'use client';

interface ActivityStripProps {
  /** ISO date strings (or Date-parseable) of real activity events (pact created/joined/voted). */
  activityDates: string[];
  days?: number;
  className?: string;
}

/**
 * Horizontal strip of the last N days as small bars — lit up on days the
 * user had real pact activity (created/joined/voted), dim otherwise.
 */
export default function ActivityStrip({ activityDates, days = 14, className = '' }: ActivityStripProps) {
  const activeDays = new Set(
    activityDates
      .map((d) => {
        const parsed = new Date(d);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().slice(0, 10);
      })
      .filter((d): d is string => Boolean(d))
  );

  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      active: activeDays.has(key),
      isToday: i === days - 1,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-[var(--pact-text-faint)]">Last {days} days</p>
      <div className="flex items-end gap-1">
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={cell.label}
            className={`h-6 flex-1 rounded-sm transition-colors ${cell.isToday ? 'ring-1 ring-[var(--pact-pink)]' : ''}`}
            style={{
              background: cell.active
                ? 'linear-gradient(180deg, var(--pact-pink), var(--pact-violet))'
                : 'var(--pact-surface-2)',
              boxShadow: cell.active ? '0 0 6px var(--pact-shadow-violet)' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
