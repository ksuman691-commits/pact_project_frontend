'use client';

export interface LedgerStat {
  /** The number to display, or null/undefined when the data isn't known
   * yet (e.g. a circle with no pacts) — rendered as an honest "—" rather
   * than 0 or a guess. */
  value: number | string | null | undefined;
  label: string;
}

/**
 * The 3-up stat row used on circle/pact detail pages. Every value must
 * come from real data — pass `null` rather than 0 when something hasn't
 * happened yet vs. genuinely isn't known.
 */
export default function StatLedger({ stats, className = '' }: { stats: LedgerStat[]; className?: string }) {
  return (
    <div
      className={`grid rounded-card border ${className}`}
      style={{
        gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
        background: 'var(--card)',
        borderColor: 'var(--hairline)',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1 py-4 px-2 text-center"
          style={i > 0 ? { borderLeft: '1px solid var(--hairline-soft)' } : undefined}
        >
          <span
            className="font-serif"
            style={{ fontSize: 28, color: stat.value === null || stat.value === undefined ? 'var(--muted)' : 'var(--ink)' }}
          >
            {stat.value === null || stat.value === undefined ? '—' : stat.value}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
