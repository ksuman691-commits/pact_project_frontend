'use client';

import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './StreakHeatmap.css';

interface StreakHeatmapProps {
  /** ISO timestamps (or Date-parseable strings) of every proof upload for this pact. */
  proofDates: string[];
  /** Pact start date — anchors the left edge of the heatmap. */
  startDate: string | Date;
  /** Pact end date, or today if the pact is still running — anchors the right edge. */
  endDate?: string | Date;
}

/**
 * GitHub-style contribution heatmap of proof-upload dates for a single pact.
 * Counts proofs per calendar day (multiple same-day proofs still show as one
 * intensity step up, matching how "days done" is already counted elsewhere
 * on this page via day_number rather than raw proof rows).
 */
export default function StreakHeatmap({ proofDates, startDate, endDate }: StreakHeatmapProps) {
  const values = useMemo(() => {
    const counts = new Map<string, number>();
    for (const raw of proofDates) {
      if (!raw) continue;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = parsed.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
  }, [proofDates]);

  const start = useMemo(() => new Date(startDate), [startDate]);
  const end = useMemo(() => (endDate ? new Date(endDate) : new Date()), [endDate]);

  return (
    <div className="streak-heatmap">
      <CalendarHeatmap
        startDate={start}
        endDate={end}
        values={values}
        showWeekdayLabels
        classForValue={(value) => {
          if (!value || !value.count) return 'streak-scale-0';
          if (value.count === 1) return 'streak-scale-1';
          if (value.count === 2) return 'streak-scale-2';
          return 'streak-scale-3';
        }}
        titleForValue={(value) => {
          if (!value?.date) return 'No proof';
          const label = new Date(value.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const count = value.count || 0;
          return `${label}: ${count} ${count === 1 ? 'proof' : 'proofs'}`;
        }}
      />
      <div className="streak-heatmap-legend">
        <span>Less</span>
        <span className="streak-legend-swatch streak-scale-0" />
        <span className="streak-legend-swatch streak-scale-1" />
        <span className="streak-legend-swatch streak-scale-2" />
        <span className="streak-legend-swatch streak-scale-3" />
        <span>More</span>
      </div>
    </div>
  );
}
