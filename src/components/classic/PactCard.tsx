'use client'

import Link from 'next/link'
import TallyGrid, { type TallyCellStatus } from './TallyGrid'
import { getPactProgress } from '@/components/PactProgressRing'

function buildDays(total: number, completed: number, missed: number): TallyCellStatus[] {
  const days: TallyCellStatus[] = []
  for (let i = 0; i < total; i++) {
    if (i < completed) days.push('kept')
    else if (i < completed + missed) days.push('missed')
    else days.push('upcoming')
  }
  return days
}

/**
 * v2 "hand-made" pact card. Three honest variants:
 *  - ActivePactCard: the lead card — title, polaroid-style latest-proof
 *    print, status sentence, tally strokes, footer (spec section 4)
 *  - DarePactCard: a plain row (not a card) for a dare awaiting a reply
 *  - BrokenPactCard: a plain muted block, never hidden
 *
 * Every number rendered here comes from the real pact/dare object passed
 * in. Fields the current API doesn't expose yet (witness confirmation
 * counts, lifetime record) fall back to an em dash or are omitted rather
 * than being estimated or invented — see BACKEND_SPEC_*.md.
 */

function initials(name?: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

export function ActivePactCard({ pact }: { pact: any }) {
  const { total, completed, missed } = getPactProgress(pact)
  const dayNumber = Math.min(total, completed + missed + 1)
  const isGroup = !!pact.circle_name
  const ownerName = pact.creator_full_name || pact.creator_username || 'You'
  const hasProof = !!pact.proof_url
  const proofAt = pact.last_proof_at || pact.updated_at
  const missedSentence = missed === 0 ? "You haven't missed any." : missed === 1 ? "You've missed one." : `You've missed ${missed}.`

  return (
    <Link
      href={`/pacts/${pact.id}`}
      className="relative block rounded-[14px] bg-[var(--card)] px-[20px] py-[22px] pb-[18px] shadow-[0_1px_2px_rgba(60,45,20,0.08),0_14px_28px_-16px_rgba(60,45,20,0.30)]"
    >
      {hasProof && (
        <div
          className="absolute -top-4 right-[18px] w-[84px] rounded-[2px] bg-[var(--photo-frame)] px-[6px] pb-5 pt-[6px] shadow-[0_1px_2px_rgba(60,45,20,0.18),0_8px_14px_-8px_rgba(60,45,20,0.35)]"
          style={{ transform: 'rotate(3deg)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pact.proof_url} alt="Latest proof" className="h-[72px] w-[72px] object-cover" />
        </div>
      )}

      <h3 className="pr-24 text-balance text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink)]">{pact.title}</h3>
      <p className="mt-1 pr-24 text-[14px] text-[var(--muted)]">
        {pact.verification_type || pact.verification_method
          ? `${pact.frequency_label || 'Regular check-ins'}. ${pact.verification_type || pact.verification_method} proof.`
          : 'Regular check-ins.'}
      </p>

      <p className="mt-4 text-[16px] font-medium text-[var(--ink)]">
        Day {dayNumber} of {total}. {missedSentence}
      </p>

      <div className="mt-4">
        <TallyGrid days={buildDays(total, completed, missed)} />
      </div>

      <p className="mt-4 text-[14px] text-[var(--ink-soft)]">
        {hasProof
          ? `Today's proof went in${proofAt ? ` at ${new Date(proofAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}.`
          : 'No proof yet today.'}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--hairline-soft)] pt-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--navy)] text-[10px] font-semibold text-[var(--card-text)]">
              {initials(ownerName)}
            </div>
          </div>
          <span className="text-[13px] text-[var(--muted)]">
            {isGroup ? `for ${pact.circle_name}` : 'with a witness'}
          </span>
        </div>
        <span className="text-[13px] font-semibold text-[var(--navy)]">
          {pact.time_left_label || 'Next proof due soon'}
        </span>
      </div>
    </Link>
  )
}

export function BrokenPactCard({ pact }: { pact: any }) {
  const { total, completed } = getPactProgress(pact)
  return (
    <div className="px-1 py-2">
      <h3 className="text-[18px] font-semibold text-[var(--ink-soft)]">{pact.title}</h3>
      <p className="mt-1 text-[14px] text-[var(--muted)]">
        Broken on day {Math.min(total, completed + 1)}. You kept {completed} and missed the rest. It stays on your record.
      </p>
      <div className="mt-2">
        <Link
          href="/pacts/create"
          className="inline-flex h-11 items-center rounded-full border-[1.5px] border-[var(--navy)] px-4 text-[13px] font-semibold text-[var(--navy)]"
        >
          Start it again
        </Link>
      </div>
    </div>
  )
}

export function DarePactCard({ dare }: { dare: any }) {
  const windowClosed = dare.response_deadline_passed || (dare.response_due_at && new Date(dare.response_due_at) < new Date() && dare.status === 'pending')
  const senderFirst = (dare.sender_full_name || dare.sender_username || 'Someone').split(' ')[0]
  const recipientFirst = (dare.recipient_full_name || dare.recipient_username || 'they').split(' ')[0]

  return (
    <Link href={`/dares/${dare.id}`} className="block px-1 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-semibold text-[var(--card)]">
          {initials(dare.sender_full_name || dare.sender_username)}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[var(--ink)]">{senderFirst} hasn&apos;t answered your dare</p>
          <p className="text-[13px] text-[var(--muted)]">
            {dare.title} · {dare.hours_left != null ? `${dare.hours_left}h left to do it` : 'waiting on a reply'}
          </p>
        </div>
      </div>
      {windowClosed && (
        <p className="pl-[52px] pt-2 text-[14px]" style={{ color: 'var(--warn-text)' }}>
          {recipientFirst} needs witnesses to confirm and none have. The window to reply closed
          {dare.hours_since_closed ? ` ${dare.hours_since_closed}h ago.` : '.'}
        </p>
      )}
    </Link>
  )
}
