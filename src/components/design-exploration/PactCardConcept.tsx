'use client';

import React from 'react';
import { Camera, Users, Link2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import MemberAvatarStack from '@/components/MemberAvatarStack';

export interface PactCardConceptPerson {
  name: string;
  avatarUrl?: string;
}

export type TrackRecordEntry = 'done' | 'missed' | 'none';

export interface PactCardConceptProps {
  title: string;
  category?: string;
  /** Who this pact is accountable to — a single person (1:1) or a circle (group). */
  mode: '1:1' | 'group';
  accountablePerson?: PactCardConceptPerson;
  circleName?: string;
  circleMembers?: PactCardConceptPerson[];
  circleMemberCount?: number;
  deadline: Date;
  now?: Date;
  /**
   * Oldest-to-newest record of this person's actual past attempts at this
   * pact type. An empty array is a real, valid state (brand new pact type)
   * and must render plainly, not be hidden or padded with fake data.
   */
  trackRecord: TrackRecordEntry[];
  proofStatus: 'none' | 'submitted' | 'verified';
  proofSubmittedAgo?: string;
  proofThumbnailUrl?: string;
}

function getTimeTension(deadline: Date, now: Date) {
  const diffMs = deadline.getTime() - now.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return { label: 'Deadline passed', color: 'var(--pact-text-faint)', bg: 'var(--pact-surface-2)', urgent: false };
  }
  if (hours <= 6) {
    return { label: `${Math.max(1, Math.round(hours))}h left`, color: 'var(--pact-danger)', bg: 'rgba(217,45,32,0.08)', urgent: true };
  }
  if (hours <= 36) {
    const h = Math.round(hours);
    return { label: `${h}h left`, color: 'var(--pact-gold)', bg: 'var(--status-warning-bg)', urgent: false };
  }
  const days = Math.round(hours / 24);
  return { label: `${days} day${days === 1 ? '' : 's'} left`, color: 'var(--accent-primary)', bg: 'var(--status-info-bg)', urgent: false };
}

/**
 * Standalone visual concept for a redesigned Pact Card. Not wired into any
 * data fetching or routing — a pure presentational component driven by
 * explicit props so it can be dropped into the real feed later once a
 * direction is chosen.
 *
 * Honesty constraints baked into the design itself (not just copy):
 * - An empty trackRecord renders as "No completed pacts yet" in neutral
 *   gray, never hidden and never dressed up as a positive/neutral badge.
 * - Missed attempts render as a plain hollow outline dot — visible, not
 *   disguised as "done" and not styled with alarm-red shaming.
 * - Time tension scales with real urgency (calm blue when there's time,
 *   amber as it closes in, red only in the final hours) rather than a flat
 *   "danger" treatment from the moment the pact is created.
 */
export default function PactCardConcept({
  title,
  category,
  mode,
  accountablePerson,
  circleName,
  circleMembers = [],
  circleMemberCount,
  deadline,
  now = new Date(),
  trackRecord,
  proofStatus,
  proofSubmittedAgo,
  proofThumbnailUrl,
}: PactCardConceptProps) {
  const tension = getTimeTension(deadline, now);
  const doneCount = trackRecord.filter((entry) => entry === 'done').length;
  const hasHistory = trackRecord.length > 0;

  return (
    <div
      className="pact-card rounded-3xl p-5"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      {/* Stake: who this pact is accountable to, shown visually not just as text */}
      <div className="flex items-center justify-between gap-3">
        {mode === '1:1' && accountablePerson ? (
          <div className="flex items-center gap-2">
            <Avatar name="You" size={32} />
            <Link2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
            <Avatar name={accountablePerson.name} avatarUrl={accountablePerson.avatarUrl} size={32} />
            <span className="ml-1 text-xs font-medium" style={{ color: 'var(--pact-text-dim)' }}>
              1:1 with {accountablePerson.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MemberAvatarStack
              members={circleMembers.map((m, i) => ({ userId: i, name: m.name, avatarUrl: m.avatarUrl }))}
              totalCount={circleMemberCount ?? circleMembers.length}
              size={28}
              maxVisible={4}
            />
            <div className="ml-1 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--pact-text-dim)' }}>
              <Users className="h-3.5 w-3.5" />
              <span>{circleName}</span>
            </div>
          </div>
        )}

        {/* Real but not alarmist time tension */}
        <span
          className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ color: tension.color, background: tension.bg }}
        >
          {tension.label}
        </span>
      </div>

      {/* Title */}
      <div className="mt-4">
        {category && (
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-text-faint)' }}>
            {category}
          </p>
        )}
        <h3 className="mt-0.5 text-lg font-bold leading-snug" style={{ color: 'var(--pact-text)' }}>
          {title}
        </h3>
      </div>

      {/* Real track record — shown plainly even when it's bad or empty */}
      <div className="mt-4">
        <p className="text-xs font-medium" style={{ color: 'var(--pact-text-faint)' }}>
          {hasHistory ? `${doneCount} of ${trackRecord.length} past attempts completed` : 'No completed pacts of this type yet'}
        </p>
        {hasHistory && (
          <div className="mt-2 flex items-center gap-1.5">
            {trackRecord.map((entry, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full"
                style={
                  entry === 'done'
                    ? { background: 'var(--pact-mint)' }
                    : entry === 'missed'
                      ? { background: 'transparent', border: '1.5px solid var(--pact-text-faint)' }
                      : { background: 'var(--pact-surface-3)' }
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Proof status — a visual trace, not just a checkmark */}
      <div
        className="mt-4 flex items-center gap-3 rounded-2xl p-3"
        style={{ background: 'var(--pact-surface-2)' }}
      >
        {proofStatus === 'none' ? (
          <>
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--pact-surface-3)' }}
            >
              <Camera className="h-4 w-4" style={{ color: 'var(--pact-text-faint)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--pact-text-faint)' }}>
              No proof submitted yet
            </p>
          </>
        ) : (
          <>
            <div
              className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-cover bg-center"
              style={{
                backgroundColor: 'var(--pact-surface-3)',
                backgroundImage: proofThumbnailUrl ? `url(${proofThumbnailUrl})` : undefined,
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--pact-text)' }}>
                {proofStatus === 'verified' ? 'Proof verified' : 'Proof submitted'}
              </p>
              {proofSubmittedAgo && (
                <p className="text-[11px]" style={{ color: 'var(--pact-text-faint)' }}>
                  {proofSubmittedAgo}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
