'use client';

import React from 'react';
import Avatar from '@/components/Avatar';

export interface CircleOrbitMember {
  name: string;
  avatarUrl?: string;
  /** Whether this specific member has posted real activity (proof, vote, cheer) this week. */
  activeThisWeek: boolean;
}

export interface CircleOrbitConceptProps {
  name: string;
  members: CircleOrbitMember[];
  size?: number;
}

/**
 * Standalone visual concept for a circle's identity: members placed as an
 * actual ring/orbit, with the ring's lit arc proportional to the fraction
 * of members who were ACTUALLY active this week — not total membership,
 * which would be a fake/inflated signal for a circle that's just large.
 *
 * A circle with zero activity this week renders as a calm, dim, static
 * ring — deliberately NOT styled as broken, sad, or empty-state red. A
 * circle with real activity gets a genuinely brighter, larger lit arc and
 * a subtle glow — scaled by the real fraction, so a circle with 1 of 8
 * members active looks only modestly lit, not maxed out.
 *
 * Not wired into data fetching or routing — pure presentational mockup.
 */
export default function CircleOrbitConcept({ name, members, size = 220 }: CircleOrbitConceptProps) {
  const activeCount = members.filter((m) => m.activeThisWeek).length;
  const activeFraction = members.length > 0 ? activeCount / members.length : 0;
  const isQuiet = activeCount === 0;

  const center = size / 2;
  const orbitRadius = size * 0.38;
  const avatarSize = Math.max(28, Math.round(size * 0.16));
  const ringRadius = size * 0.46;
  const strokeWidth = Math.max(3, Math.round(size * 0.018));
  const circumference = 2 * Math.PI * ringRadius;
  // The lit arc length is a direct, honest function of activeFraction — not
  // clamped to a visible minimum, so a genuinely quiet week shows almost
  // nothing lit rather than a reassuring-but-fake sliver.
  const litLength = circumference * activeFraction;
  const dashArray = `${litLength} ${circumference - litLength}`;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Base faint ring — always present, reads as the circle's "shape" even at zero activity */}
        <svg width={size} height={size} className="absolute inset-0">
          <circle
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            stroke="var(--pact-hairline)"
            strokeWidth={strokeWidth}
          />
        </svg>

        {/* Lit arc — proportional to real weekly activity, rotated to start at 12 o'clock */}
        {!isQuiet && (
          <svg width={size} height={size} className="absolute inset-0 -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke="var(--pact-pink)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              style={{
                filter: `drop-shadow(0 0 ${Math.round(4 + activeFraction * 8)}px var(--pact-shadow-violet))`,
                transition: 'stroke-dasharray 900ms ease-out',
              }}
            />
          </svg>
        )}

        {/* Member avatars placed around the orbit */}
        {members.map((member, i) => {
          const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
          const x = center + orbitRadius * Math.cos(angle) - avatarSize / 2;
          const y = center + orbitRadius * Math.sin(angle) - avatarSize / 2;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: x,
                top: y,
                opacity: member.activeThisWeek ? 1 : 0.45,
                transition: 'opacity 400ms ease',
              }}
            >
              <Avatar name={member.name} avatarUrl={member.avatarUrl} size={avatarSize} />
            </div>
          );
        })}

        {/* Center: circle name + honest activity readout, not a decorative icon */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ padding: size * 0.28 }}
        >
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--pact-text)' }}>
            {name}
          </p>
          <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--pact-text-faint)' }}>
            {isQuiet ? 'Quiet this week' : `${activeCount} of ${members.length} active this week`}
          </p>
        </div>
      </div>
    </div>
  );
}
