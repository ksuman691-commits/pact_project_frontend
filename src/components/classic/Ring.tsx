'use client';

import Image from 'next/image';

export interface RingMember {
  userId: number | string;
  name?: string | null;
  avatarUrl?: string | null;
  /** True when this member submitted proof this week — the only signal
   * that lights their seat and contributes to the arc. Never total
   * membership, logins, or "active now" presence. */
  activeThisWeek: boolean;
}

interface RingProps {
  circleName: string;
  members: RingMember[];
  totalMemberCount: number;
  /** 'tile' = 120px (list cards), 'detail' = 240px (circle detail hero). */
  size?: 'tile' | 'detail';
  coverPhotoUrl?: string | null;
  className?: string;
}

function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function initials(name?: string | null) {
  const safe = (name || 'U').trim();
  if (!safe) return 'U';
  return safe
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * "A circle should feel like a circle": members placed as seats on a ring
 * around a monogram disc. The lit arc length and lit-seat count are both
 * driven by the same real signal — members who showed proof *this week* —
 * never total membership. Zero active members draws no arc at all (a
 * round linecap on a zero-length dash would otherwise paint a fake dot).
 */
export default function Ring({
  circleName,
  members,
  totalMemberCount,
  size = 'tile',
  coverPhotoUrl,
  className = '',
}: RingProps) {
  const isDetail = size === 'detail';
  const outer = isDetail ? 240 : 120;
  const r = isDetail ? 100 : 48;
  const seatSize = isDetail ? 40 : 24;
  const strokeWidth = isDetail ? 3 : 2;
  const cx = outer / 2;
  const cy = outer / 2;
  const circumference = 2 * Math.PI * r;

  const activeCount = members.filter((m) => m.activeThisWeek).length;
  const arcFraction = totalMemberCount > 0 ? activeCount / totalMemberCount : 0;
  const arcLength = circumference * arcFraction;

  // Order so active members come first (contiguous with the lit arc),
  // cap displayed seats at 8 with a "+N" overflow bubble.
  const sorted = [...members].sort((a, b) => Number(b.activeThisWeek) - Number(a.activeThisWeek));
  const maxSeats = 8;
  const visible = sorted.slice(0, maxSeats);
  const overflow = Math.max(0, totalMemberCount - visible.length);
  const seatCount = visible.length + (overflow > 0 ? 1 : 0);

  const seats = visible.map((m, i) => {
    const angle = seatCount > 0 ? (i / seatCount) * 2 * Math.PI : 0;
    const x = cx + r * Math.sin(angle) - seatSize / 2;
    const y = cy - r * Math.cos(angle) - seatSize / 2;
    return { ...m, x, y, key: m.userId };
  });

  if (overflow > 0) {
    const angle = (visible.length / seatCount) * 2 * Math.PI;
    const x = cx + r * Math.sin(angle) - seatSize / 2;
    const y = cy - r * Math.cos(angle) - seatSize / 2;
    seats.push({
      userId: 'overflow',
      name: `+${overflow}`,
      avatarUrl: null,
      activeThisWeek: false,
      x,
      y,
      key: 'overflow',
    } as RingMember & { x: number; y: number; key: string });
  }

  const discSize = isDetail ? outer - r * 2 + seatSize - 4 : outer - r * 2 + seatSize - 4;
  const discDiameter = isDetail ? 150 : 72;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: outer, height: outer }}
      role="img"
      aria-label={
        activeCount > 0
          ? `${circleName}: ${totalMemberCount} members, ${activeCount} showed up this week`
          : `${circleName}: ${totalMemberCount} members, quiet this week`
      }
    >
      <svg width={outer} height={outer} className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--hairline)" strokeWidth={strokeWidth} />
        {arcLength > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--navy)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </svg>

      {/* Center disc: monogram, or cover photo if provided */}
      <div
        className="absolute flex items-center justify-center overflow-hidden rounded-full border"
        style={{
          width: discDiameter,
          height: discDiameter,
          left: cx - discDiameter / 2,
          top: cy - discDiameter / 2,
          background: isDetail ? 'var(--card)' : 'var(--paper)',
          borderColor: 'var(--hairline)',
        }}
      >
        {coverPhotoUrl ? (
          <Image src={coverPhotoUrl} alt="" fill sizes={`${discDiameter}px`} className="object-cover" />
        ) : (
          <span
            className="font-serif"
            style={{ color: 'var(--navy)', fontSize: isDetail ? 44 : 22, fontWeight: 500 }}
          >
            {monogram(circleName)}
          </span>
        )}
      </div>

      {seats.map((seat: any) => {
        const lit = seat.activeThisWeek;
        const isOverflow = seat.userId === 'overflow';
        return (
          <div
            key={seat.key}
            className="absolute flex items-center justify-center overflow-hidden rounded-full"
            style={{
              width: seatSize,
              height: seatSize,
              left: seat.x,
              top: seat.y,
              background: lit ? 'var(--navy)' : 'var(--card)',
              border: lit
                ? `${isDetail ? 3 : 2}px solid ${isDetail ? 'var(--paper)' : 'var(--card)'}`
                : `1.5px solid var(--seat-border)`,
            }}
            title={isOverflow ? `${overflow} more members` : seat.name || undefined}
          >
            {!isOverflow && seat.avatarUrl ? (
              <Image
                src={seat.avatarUrl}
                alt={seat.name || ''}
                fill
                sizes={`${seatSize}px`}
                className="object-cover"
              />
            ) : (
              <span
                className="font-sans font-semibold"
                style={{
                  fontSize: isDetail ? 14 : 9,
                  color: lit ? 'var(--card)' : 'var(--muted)',
                }}
              >
                {isOverflow ? seat.name : initials(seat.name)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
