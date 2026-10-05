'use client';

export type TallyCellStatus = 'kept' | 'missed' | 'upcoming';

interface TallyGridProps {
  /** One entry per required check-in/day of the pact, in order. */
  days: TallyCellStatus[];
  className?: string;
}

/**
 * Deterministic "pencil stroke" path for cell index i — looks hand-drawn
 * but is stable across renders (no Math.random()), per the v2 spec.
 */
function strokePath(i: number) {
  const dx = (((i * 7) % 5) - 2) * 0.9;
  const y1 = 4 + ((i * 3) % 4) * 1.3;
  const y2 = 40 - ((i * 5) % 4) * 1.3;
  const bow = (((i * 11) % 5) - 2) * 0.7;
  return `M${12 - dx / 2},${y1} Q${12 + bow},22 ${12 + dx / 2},${y2}`;
}

/**
 * v2 tally strokes replace the v1 solid/hatched day grid: marks that look
 * like they were made in a notebook. Kept = a blue pencil stroke, missed =
 * an open circle (never hidden), still-to-come = faint dashed dots. The
 * tally and legend below are both computed directly from `days`.
 */
export default function TallyGrid({ days, className = '' }: TallyGridProps) {
  const kept = days.filter((d) => d === 'kept').length;
  const missed = days.filter((d) => d === 'missed').length;
  const upcoming = days.filter((d) => d === 'upcoming').length;

  const rows: TallyCellStatus[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  return (
    <div className={className}>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-1.5">
            <span className="w-[30px] shrink-0 text-[11px]" style={{ color: 'var(--dash)' }}>
              wk {rowIdx + 1}
            </span>
            <div className="grid flex-1 grid-cols-7 gap-1.5">
              {row.map((status, i) => {
                const idx = rowIdx * 7 + i;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 24 44"
                    className="h-10 w-full"
                    role="img"
                    aria-label={`Day ${idx + 1}: ${status}`}
                  >
                    {status === 'missed' ? (
                      <circle cx={12} cy={22} r={5.5} fill="none" stroke="var(--muted)" strokeWidth={1.6} />
                    ) : status === 'kept' ? (
                      <path d={strokePath(idx)} fill="none" stroke="var(--navy)" strokeWidth={3.4} strokeLinecap="round" />
                    ) : (
                      <path
                        d={strokePath(idx)}
                        fill="none"
                        stroke="var(--dash)"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeDasharray="0.1 6"
                      />
                    )}
                  </svg>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3.5 pl-[38px] text-[12px]" style={{ color: 'var(--muted)' }}>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M1,8 Q8,2 15,8" fill="none" stroke="var(--navy)" strokeWidth={2.4} strokeLinecap="round" />
          </svg>
          Done ({kept})
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle cx={6} cy={6} r={4} fill="none" stroke="var(--muted)" strokeWidth={1.4} />
          </svg>
          Missed ({missed})
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M1,8 Q8,2 15,8" fill="none" stroke="var(--dash)" strokeWidth={2} strokeDasharray="0.1 4" strokeLinecap="round" />
          </svg>
          Still to come ({upcoming})
        </span>
      </div>
    </div>
  );
}
