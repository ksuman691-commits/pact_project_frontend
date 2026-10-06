'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface RingMember {
  userId: number | string;
  name?: string | null;
  avatarUrl?: string | null;
  /** True when this member submitted proof this week — the only signal
   * that lights their seat with a tick badge. Never total membership,
   * logins, or "active now" presence. Omit (leave undefined) rather than
   * defaulting to false when this is genuinely unknown — the caller
   * decides whether to pass `activityKnown` at all. */
  activeThisWeek: boolean;
}

interface RingProps {
  circleName: string;
  members: RingMember[];
  totalMemberCount: number;
  /** 'tile' = sized by member count (104–140px), 'detail' = fixed 200px hero. */
  size?: 'tile' | 'detail';
  /** Whether per-member weekly-activity data is actually available. When
   * false, seats render in a single neutral state with no ticks — we never
   * fabricate "nobody sent proof" from a missing field. */
  activityKnown?: boolean;
  coverPhotoUrl?: string | null;
  className?: string;
}

function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Photo layered over the initials. If the URL 404s or the signed link has
 * expired, the image removes itself and the initials underneath show —
 * never a broken-image icon. A plain <img> (not next/image) so a failed
 * load can be caught without Next's optimizer rejecting unknown hosts.
 */
function SeatPhoto({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
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
 * v2 "hand-made" ring: no activity arc (the v1 arc is removed entirely —
 * a thin track circle only). Real signal now lives on each seat: a lit
 * (blue) seat with a small tick badge means that member sent proof for a
 * pact this week; everything else stays in the plain unlit state. If
 * `activityKnown` is false, every seat renders unlit with no badge — we
 * show "N members" rather than claim the circle is quiet.
 */
export default function Ring({
  circleName,
  members,
  totalMemberCount,
  size = 'tile',
  activityKnown = true,
  coverPhotoUrl,
  className = '',
}: RingProps) {
  const isDetail = size === 'detail';
  const outer = isDetail ? 200 : Math.min(140, 104 + Math.min(totalMemberCount, 6) * 6);
  const r = outer * 0.4;
  const seatSize = isDetail ? 40 : Math.max(26, Math.round(outer * 0.22));
  const strokeWidth = isDetail ? 1.8 : 1.6;
  const cx = outer / 2;
  const cy = outer / 2;

  const activeCount = activityKnown ? members.filter((m) => m.activeThisWeek).length : 0;

  // Order so active members come first (contiguous), cap at 8 seats with a
  // "+N" overflow bubble.
  const sorted = activityKnown
    ? [...members].sort((a, b) => Number(b.activeThisWeek) - Number(a.activeThisWeek))
    : members;
  // "+N" only ever appears when the circle has more than 5 members; at 5 or
  // fewer, every member we have is a seat and no bubble is drawn.
  const maxSeats = 5;
  const visible = sorted.slice(0, maxSeats);
  const overflow = totalMemberCount > maxSeats ? totalMemberCount - visible.length : 0;
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

  const discDiameter = outer * 0.27 * 2;
  const monogramSize = outer * 0.17;
  const badgeSize = isDetail ? 18 : 14;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: outer, height: outer }}
      role="img"
      aria-label={
        activityKnown
          ? activeCount > 0
            ? `${circleName}: ${totalMemberCount} members, ${activeCount} sent proof this week`
            : `${circleName}: ${totalMemberCount} members, nobody has sent proof this week`
          : `${circleName}: ${totalMemberCount} members`
      }
    >
      <svg width={outer} height={outer} className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--hairline)" strokeWidth={strokeWidth} />
      </svg>

      {/* Center disc: monogram, or cover photo if provided */}
      <div
        className="absolute flex items-center justify-center overflow-hidden rounded-full border"
        style={{
          width: discDiameter,
          height: discDiameter,
          left: cx - discDiameter / 2,
          top: cy - discDiameter / 2,
          background: 'var(--card)',
          borderColor: 'var(--hairline)',
        }}
      >
        {coverPhotoUrl ? (
          <Image src={coverPhotoUrl} alt="" fill sizes={`${discDiameter}px`} className="object-cover" />
        ) : (
          <span
            className="font-sans"
            style={{ color: 'var(--navy)', fontSize: monogramSize, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {monogram(circleName)}
          </span>
        )}
      </div>

      {seats.map((seat: any) => {
        // Per-seat: lit only on an explicit "sent proof" (true). Unknown stays
        // a plain hollow seat even when the circle-level count isn't known.
        const lit = seat.activeThisWeek === true;
        const isOverflow = seat.userId === 'overflow';
        return (
          <div
            key={seat.key}
            className="absolute"
            style={{ width: seatSize, height: seatSize, left: seat.x, top: seat.y }}
          >
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
              style={{
                background: lit ? 'var(--navy)' : 'var(--card)',
                border: lit ? `2px solid var(--paper)` : `1.5px solid var(--seat-border)`,
              }}
              title={isOverflow ? `${overflow} more members` : seat.name || undefined}
            >
              <span
                className="font-sans font-semibold"
                style={{
                  fontSize: isDetail ? 14 : 9,
                  color: lit ? 'var(--card)' : 'var(--muted)',
                }}
              >
                {isOverflow ? seat.name : initials(seat.name)}
              </span>
              {!isOverflow && seat.avatarUrl && <SeatPhoto url={seat.avatarUrl} />}
            </div>
            {lit && (
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  right: -5,
                  bottom: -5,
                  background: 'var(--card)',
                  border: `1.5px solid var(--navy)`,
                }}
                aria-hidden="true"
              >
                <svg width={badgeSize * 0.57} height={badgeSize * 0.57} viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.2 L4.1 7.3 L8 2.8" stroke="var(--navy)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
