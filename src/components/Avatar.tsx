'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export interface AvatarRingConfig {
  /**
   * Progress percent (0-100) drawn as a thin arc on top of the decorative
   * ring — e.g. streak days vs a 30-day goal. Omit to show the decorative
   * ring/glow only, with no progress arc.
   */
  percent?: number;
  /**
   * Overrides the ring/glow with a pulsing amber-red treatment to signal an
   * approaching deadline with no proof submitted yet. The progress arc is
   * suppressed in this state.
   */
  atRisk?: boolean;
}

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  /** Diameter of the avatar circle itself, in px (ring adds its own space around this). */
  size?: number;
  /**
   * Shows the decorative animated ring: a slowly rotating multi-hue conic
   * gradient band, plus a separately-timed breathing glow underneath. Pass
   * an object to also draw a progress arc and/or the at-risk state.
   */
  ring?: boolean | AvatarRingConfig;
  className?: string;
  imgSizes?: string;
}

function getInitials(name?: string | null) {
  const safeName = (name || 'User').trim();
  if (!safeName) return 'U';

  return safeName
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Single source of truth for rendering a user avatar (image or initials
 * fallback) across the app — feed header, pact creator, circle member
 * lists, and profile. The animated ring is an opt-in prop rather than a
 * separate wrapper component, so any call site can turn it on once it has
 * the relevant streak/progress data.
 */
export default function Avatar({
  name,
  avatarUrl,
  size = 48,
  ring,
  className = '',
  imgSizes,
}: AvatarProps) {
  const initials = getInitials(name);
  // Presigned S3 URLs (see queryClient's refetchInterval comment) expire
  // after ~1 hour; between that expiry and the next scheduled refetch, an
  // <img>/Image src pointing at one 403s. Rather than leaving the browser's
  // broken-image icon on screen, fall back to the initials placeholder —
  // reset whenever a new avatarUrl comes in (e.g. after the refetch lands).
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);
  const showImage = Boolean(avatarUrl) && !imgFailed;
  const ringConfig: AvatarRingConfig | null = ring ? (typeof ring === 'object' ? ring : {}) : null;
  const atRisk = ringConfig?.atRisk ?? false;
  const hasPercent = typeof ringConfig?.percent === 'number' && !atRisk;
  const targetPercent = hasPercent ? Math.max(0, Math.min(100, ringConfig!.percent as number)) : 0;

  // Animate the progress arc filling in from 0 on mount rather than
  // snapping straight to its final value.
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    if (!hasPercent) return;
    const frame = requestAnimationFrame(() => setAnimatedPercent(targetPercent));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPercent, targetPercent]);

  const avatarCore = (
    <div
      className="relative overflow-hidden rounded-full bg-slate-900 text-white flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
    >
      {showImage ? (
        <Image
          src={avatarUrl as string}
          alt={name || 'Avatar'}
          fill
          sizes={imgSizes || `${size}px`}
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (!ringConfig) {
    return <div className={className}>{avatarCore}</div>;
  }

  const ringBand = Math.max(3, Math.round(size * 0.07));
  const outerSize = size + ringBand * 4;
  const arcStroke = Math.max(2, Math.round(size * 0.045));
  const arcRadius = outerSize / 2 - arcStroke;
  const circumference = 2 * Math.PI * arcRadius;
  const arcOffset = circumference * (1 - animatedPercent / 100);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: outerSize, height: outerSize }}>
      {/* Layer 1: soft breathing glow, independently timed from the ring rotation. */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-full blur-md ${atRisk ? '' : 'avatar-ring-breathe'}`}
        style={{
          background: atRisk
            ? 'radial-gradient(circle, rgba(239,68,68,0.55), transparent 70%)'
            : 'radial-gradient(circle, rgba(255,79,135,0.4), rgba(139,107,255,0.4) 55%, transparent 75%)',
        }}
      />

      {/* Layer 2: rotating multi-hue conic-gradient ring band. */}
      <div
        className={`absolute rounded-full ${atRisk ? 'animate-tier-pulse' : 'avatar-ring-spin'}`}
        style={{
          inset: ringBand,
          background: atRisk
            ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
            : 'conic-gradient(from 0deg, var(--pact-pink), var(--pact-gold), var(--pact-mint), var(--pact-violet), var(--pact-pink))',
          padding: ringBand,
        }}
      >
        <div className="h-full w-full rounded-full" style={{ background: 'var(--pact-bg, #ffffff)' }} />
      </div>

      {/* Layer 3: optional literal progress arc (e.g. streak vs goal), animates in on mount. */}
      {hasPercent && (
        <svg
          width={outerSize}
          height={outerSize}
          className="pointer-events-none absolute inset-0 -rotate-90"
        >
          <circle
            cx={outerSize / 2}
            cy={outerSize / 2}
            r={arcRadius}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={arcStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={arcOffset}
            style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
          />
        </svg>
      )}

      {/* Center content, above all ring layers. */}
      <div className="relative">{avatarCore}</div>
    </div>
  );
}
