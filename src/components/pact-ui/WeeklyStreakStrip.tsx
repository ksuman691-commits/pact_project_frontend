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
      <p className="mb-2 text-xs text-[var(--muted)]">This week</p>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={cell.label}
            aria-label={`${cell.label}: ${cell.isFuture ? 'upcoming' : cell.active ? 'showed up' : 'no activity'}`}
            className="flex h-8 items-center justify-center rounded-[3px] text-[11px]"
            style={{
              // Past days with no activity are plain outlines, not "missed":
              // no activity is not the same as a broken commitment.
              background: cell.active ? 'var(--navy)' : 'transparent',
              border: cell.active
                ? `1px solid var(--navy)`
                : cell.isFuture
                  ? '1px dashed var(--dash)'
                  : '1px solid var(--hairline)',
              color: cell.active ? 'var(--card)' : 'var(--muted)',
              outline: cell.isToday ? '1.5px solid var(--ink)' : undefined,
              outlineOffset: cell.isToday ? 1 : undefined,
            }}
          >
            {cell.letter}
          </div>
        ))}
      </div>
    </div>
  );
}
