'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getTimeRing } from '@/lib/dareCountdown';

function getInitials(name?: string | null) {
  const safeName = (name || 'User').trim();
  if (!safeName) return 'U';
  return safeName
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

interface DareTimeRingProps {
  name?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  /** The relevant deadline for this dare — respond_by while pending, complete_by once accepted. */
  target?: string | null;
  /** Anchors the ring's "full circle" state so the arc drains over the real window instead of jumping to a sliver. */
  windowStart?: string | null;
  size?: number;
  /** Shows the "Xh left" label under the avatar. Defaults to true. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Avatar wrapped in a draining countdown ring — a full muted track with a
 * colored arc for time remaining, like a countdown clock face. Initials/
 * photo stay fully visible in the center; the ring wraps around the
 * avatar rather than covering it. Color and the label beneath both follow
 * the same red (<6h) / gold (<24h) / violet (24h+) urgency tiers.
 */
export default function DareTimeRing({
  name,
  avatarUrl,
  username,
  target,
  windowStart,
  size = 56,
  showLabel = true,
  className = '',
}: DareTimeRingProps) {
  const ring = getTimeRing(target, windowStart);
  const strokeWidth = Math.max(3, Math.round(size * 0.07));
  const outerSize = size + strokeWidth * 3;
  const radius = (outerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = outerSize / 2;
  const arcLength = circumference * ring.percentRemaining;

  const avatarCore = (
    <div
      className="relative overflow-hidden rounded-full bg-slate-900 text-white flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name || 'Avatar'} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );

  const content = (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: outerSize, height: outerSize }}>
        <svg width={outerSize} height={outerSize} viewBox={`0 0 ${outerSize} ${outerSize}`} className="absolute -rotate-90" aria-hidden="true">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--pact-surface-2)" strokeWidth={strokeWidth} />
          {ring.percentRemaining > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            />
          )}
        </svg>
        <div className="relative">{avatarCore}</div>
      </div>
      {showLabel && (
        <span className="mt-1 text-[10px] font-bold" style={{ color: ring.color }}>
          {ring.label}
        </span>
      )}
    </div>
  );

  if (!username) return content;

  return (
    <Link href={`/profile/${username}`} aria-label={`Open @${username}'s profile`} className="transition-opacity hover:opacity-85" onClick={(e) => e.stopPropagation()}>
      {content}
    </Link>
  );
}
