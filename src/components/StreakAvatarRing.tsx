'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { getStreakTier, getTierStyle } from '@/lib/tierStyles';

interface StreakAvatarRingProps {
  /** Current streak in days. Drives which tier's ring/glow is shown. */
  streak: number;
  /**
   * When true, overrides the calm tier ring with a pulsing amber-red ring
   * regardless of tier, to signal an approaching deadline with no proof
   * submitted for the current period.
   */
  atRisk?: boolean;
  showBadge?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function StreakAvatarRing({
  streak,
  atRisk = false,
  showBadge = true,
  children,
  className = '',
}: StreakAvatarRingProps) {
  const tier = getTierStyle(getStreakTier(streak));
  const ringWidth = atRisk ? Math.max(tier.ringWidth, 3) : tier.ringWidth;
  const shimmerActive = tier.shimmer && !atRisk;

  const ringStyle: React.CSSProperties = atRisk
    ? {
        background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        padding: `${ringWidth}px`,
        boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)',
      }
    : {
        background: tier.ringGradient,
        padding: `${ringWidth}px`,
        boxShadow: tier.glowBlur > 0 ? `0 0 ${tier.glowBlur}px ${tier.glowColor}` : undefined,
      };

  return (
    <div
      className={`relative inline-flex rounded-full ${atRisk ? 'animate-tier-pulse' : ''} ${className}`.trim()}
      style={ringStyle}
    >
      <div className="rounded-full bg-white p-[1px]">{children}</div>

      {shimmerActive && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full tier-shimmer-mask">
          <div className="absolute inset-y-0 -inset-x-1/2 tier-shimmer-sweep" />
        </div>
      )}

      {showBadge && streak > 0 && (
        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(239,68,68,0.4)] ring-2 ring-white">
          <Flame className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
          {streak}
        </div>
      )}
    </div>
  );
}
