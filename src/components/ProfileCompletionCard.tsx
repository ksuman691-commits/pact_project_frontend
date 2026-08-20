'use client';

import { Check } from 'lucide-react';
import type { ProfileChecklistItem } from '@/hooks/useProfileCompletion';

interface ProfileCompletionCardProps {
  percent: number;
  checklist: ProfileChecklistItem[];
}

/**
 * New-user variant of the profile-completion nudge (see useProfileCompletion).
 * Shows a completion ring + the full checklist. Only rendered by the caller
 * while percent < 100 and the account is < 7 days old — it disappears on its
 * own once every item is done, and each row updates live as items complete.
 */
export default function ProfileCompletionCard({ percent, checklist }: ProfileCompletionCardProps) {
  // Ring drawn with a conic-gradient mask rather than SVG — simpler to keep
  // in sync with the flow gradient (pink → violet) used elsewhere for CTAs.
  const ringStyle = {
    background: `conic-gradient(var(--pact-pink) ${percent}%, var(--pact-surface-2) ${percent}% 100%)`,
  };

  return (
    <div className="pact-card rounded-[28px] px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={ringStyle}>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: 'var(--pact-bg)', color: 'var(--pact-text)' }}
          >
            {percent}%
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--pact-text)]">Finish setting up your profile</p>
          <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">A few quick steps to get the most out of CirclePact</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
              style={
                item.done
                  ? { background: 'var(--pact-mint)' }
                  : { border: '1.5px solid var(--pact-hairline)', background: 'transparent' }
              }
            >
              {item.done && <Check className="h-3 w-3" strokeWidth={3} style={{ color: 'var(--pact-bg)' }} />}
            </span>
            <span
              className="text-sm"
              style={{
                color: item.done ? 'var(--pact-text-faint)' : 'var(--pact-text-dim)',
                textDecoration: item.done ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
