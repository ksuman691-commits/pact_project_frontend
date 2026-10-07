'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface OnboardingBadgeProps {
  icon: LucideIcon;
  accent: string;
}

/**
 * Large circular icon badge for each onboarding slide, using a flat navy ring.
 */
export default function OnboardingBadge({ icon: Icon, accent }: OnboardingBadgeProps) {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-full"
        style={{ background: 'var(--navy)', padding: 3 }}
      >
        <div className="h-full w-full rounded-full" style={{ background: 'var(--pact-bg)' }} />
      </div>
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: 'var(--pact-surface-raised)', border: '1px solid var(--pact-hairline)' }}
      >
        <Icon className="h-10 w-10" style={{ color: accent }} strokeWidth={1.75} />
      </div>
    </div>
  );
}
