'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface OnboardingBadgeProps {
  icon: LucideIcon;
  accent: string;
}

/**
 * Large circular icon badge for each onboarding slide — a breathing glow
 * plus a slowly spinning single-color ring band, the same two-layer
 * technique as Avatar's decorative ring, but single-hue per slide (rather
 * than the rainbow conic used on Avatar/BottomNav) so each slide reads as
 * its own moment tied to that slide's accent color instead of reusing the
 * app's rainbow motif verbatim.
 */
export default function OnboardingBadge({ icon: Icon, accent }: OnboardingBadgeProps) {
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <div
        aria-hidden="true"
        className="avatar-ring-breathe pointer-events-none absolute inset-0 rounded-full blur-xl"
        style={{ background: accent, opacity: 0.35 }}
      />
      <div
        aria-hidden="true"
        className="avatar-ring-spin pointer-events-none absolute inset-3 rounded-full"
        style={{ background: `conic-gradient(from 0deg, ${accent}, transparent 70%, ${accent})`, padding: 3 }}
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
