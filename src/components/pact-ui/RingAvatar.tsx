'use client';

import React from 'react';

interface RingAvatarProps {
  /** Progress percent (0-100) drawn as an SVG ring around the avatar. */
  percent?: number;
  size?: number;
  strokeWidth?: number;
  /** CSS color/gradient stop for the progress ring. */
  color?: string;
  /** Optional glow color (rgba) applied as a drop-shadow on the ring. */
  glowColor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Avatar wrapped in an SVG progress ring — used for "streak vs personal
 * best" and similar radial-progress avatar treatments. Distinct from
 * StreakAvatarRing (tier-gradient decorative ring); this one draws an
 * accurate percentage arc.
 */
export default function RingAvatar({
  percent = 100,
  size = 80,
  strokeWidth = 3,
  color = 'var(--pact-violet)',
  glowColor,
  children,
  className = '',
}: RingAvatarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        style={glowColor ? { filter: `drop-shadow(0 0 6px ${glowColor})` } : undefined}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--pact-hairline)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div className="rounded-full" style={{ width: size - strokeWidth * 3, height: size - strokeWidth * 3 }}>
        {children}
      </div>
    </div>
  );
}
