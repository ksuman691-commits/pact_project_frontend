'use client';

import { Lock } from 'lucide-react';

const INK = '#17181D';
const MUTED = '#5A5C63';

const KIND: Record<string, string> = {
  fitness: 'Fitness',
  study: 'Study',
  reading: 'Reading',
  coding: 'Coding',
  startup: 'Startup',
  creator: 'Creating',
  habits: 'Habits',
  social: 'Social',
};

/**
 * "3 followers-only pacts · Follow Priya to see them": what following unlocks.
 * Only a count and the kinds of pact, never titles or photos (those are for followers).
 */
export default function FollowersOnlyTeaser({
  count,
  categories,
  firstName,
  requested,
  busy,
  onFollow,
}: {
  count: number;
  categories: string[];
  firstName: string;
  requested: boolean;
  busy: boolean;
  onFollow: () => void;
}) {
  if (count <= 0) return null;
  const kinds = categories.map((c) => KIND[c] ?? c.charAt(0).toUpperCase() + c.slice(1));
  return (
    <section
      className="flex flex-col gap-3 rounded-[22px] p-4"
      style={{ background: '#FBF8F1', border: '1.5px dashed #C9BFAA' }}
      aria-label={`${count} followers-only ${count === 1 ? 'pact' : 'pacts'}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--navy)', color: '#FFFFFF' }}>
          <Lock className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-extrabold leading-tight" style={{ color: INK }}>
            {count} followers-only {count === 1 ? 'pact' : 'pacts'}
          </span>
          <span className="mt-1 block text-[13px] leading-snug" style={{ color: MUTED }}>
            {requested ? `Requested. You'll see ${count === 1 ? 'it' : 'them'} when ${firstName} accepts.` : `Follow ${firstName} to watch ${count === 1 ? 'it' : 'them'} day by day.`}
          </span>
        </span>
      </div>
      {kinds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {kinds.map((kind) => (
            <span key={kind} className="rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: '#FFFFFF', color: INK, border: '1px solid #DCD3C1' }}>
              {kind}
            </span>
          ))}
        </div>
      )}
      {!requested && (
        <button
          type="button"
          onClick={onFollow}
          disabled={busy}
          className="h-11 rounded-full text-[15px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--navy)' }}
        >
          Follow {firstName}
        </button>
      )}
    </section>
  );
}
