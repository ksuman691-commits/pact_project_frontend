'use client';

interface WeeklyStreakStripProps {
  /** ISO date strings (or Date-parseable) of real activity events (pact created/joined/voted) — same source ActivityStrip already uses. */
  activityDates: string[];
  className?: string;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Compact single-letter (M T W T F S S) view of the CURRENT week only —
 * a quick "did I show up this week" glance that sits next to the existing
 * 14-day ActivityStrip rather than replacing it. Green for a day with real
 * activity, muted/red for a day without one; future days in the week (today
 * included, if it hasn't happened yet in relative terms) are shown neutral
 * rather than red, since a day that hasn't happened isn't a miss.
 */
export default function WeeklyStreakStrip({ activityDates, className = '' }: WeeklyStreakStripProps) {
  const activeDays = new Set(
    activityDates
      .map((d) => {
        const parsed = new Date(d);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().slice(0, 10);
      })
      .filter((d): d is string => Boolean(d)),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // ISO week: Monday = 0 ... Sunday = 6.
  const isoDayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - isoDayIndex);

  const cells = DAY_LETTERS.map((letter, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const isFuture = date.getTime() > today.getTime();
    return {
      key,
      letter,
      active: activeDays.has(key),
      isFuture,
      isToday: i === isoDayIndex,
      label: date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    };
  });

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-[var(--pact-text-faint)]">This week</p>
      <div className="flex gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={cell.label}
            className={`flex size-8 flex-1 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
              cell.isToday ? 'ring-1 ring-[var(--pact-pink)] ring-offset-1 ring-offset-[var(--pact-bg)]' : ''
            }`}
            style={{
              // No dedicated green/red tokens exist in this palette (see
              // globals.css) — pact-mint and pact-danger are the closest
              // semantic equivalents already used elsewhere for "good" and
              // "bad" states.
              background: cell.isFuture
                ? 'var(--pact-surface-2)'
                : cell.active
                  ? 'var(--pact-mint)'
                  : 'var(--pact-danger)',
              color: cell.isFuture ? 'var(--pact-text-faint)' : 'var(--pact-bg)',
            }}
          >
            {cell.letter}
          </div>
        ))}
      </div>
    </div>
  );
}
