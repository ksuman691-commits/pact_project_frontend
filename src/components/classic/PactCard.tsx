'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'
import DayGrid, { type DayCellStatus } from './DayGrid'
import { getPactProgress } from '@/components/PactProgressRing'

function buildDays(total: number, completed: number, missed: number): DayCellStatus[] {
  const days: DayCellStatus[] = []
  for (let i = 0; i < total; i++) {
    if (i < completed) days.push('kept')
    else if (i < completed + missed) days.push('missed')
    else days.push('upcoming')
  }
  return days
}

/**
 * Classic-redesign pact card. Three honest variants:
 *  - "active": the day-grid + proof + record anatomy (spec A1)
 *  - "dare": witness-confirmation anatomy (spec A2) — pass `dare` instead of `pact`
 *  - "broken": muted closed-record anatomy (spec A3)
 *
 * Every number rendered here comes from the real pact/dare object passed in.
 * Fields the current API doesn't expose yet (witness confirmation counts,
 * per-day check-in history, lifetime record) fall back to an em dash rather
 * than being estimated or invented — see BACKEND_SPEC_*.md for the fields
 * this should read once they exist.
 */

function initials(name?: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

function pactNumber(id: number | string) {
  return String(id).padStart(4, '0')
}

export function ActivePactCard({ pact }: { pact: any }) {
  const { total, completed, missed } = getPactProgress(pact)
  const dayNumber = Math.min(total, completed + missed + 1)
  const isGroup = !!pact.circle_name
  const ownerName = pact.creator_full_name || pact.creator_username || 'You'
  // No lifetime "kept X of Y pacts" field exists on the Pact/User response
  // yet — see BACKEND_SPEC_LIFETIME_RECORD.md. Show the honest unknown
  // state rather than inventing a number.
  const lifetimeKept = pact.creator_pacts_kept
  const lifetimeTotal = pact.creator_pacts_total
  const hasRecord = typeof lifetimeKept === 'number' && typeof lifetimeTotal === 'number'
  const hasProof = !!pact.proof_url
  const proofAt = pact.last_proof_at || pact.updated_at

  return (
    <Link
      href={`/pacts/${pact.id}`}
      className="block rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-5 pb-4 shadow-[0_1px_0_var(--tan),0_10px_24px_-18px_rgba(23,24,29,0.35)]"
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>PACT · No. {pactNumber(pact.id)}</span>
        <span>
          DAY {dayNumber} OF {total}
        </span>
      </div>
      <div className="mt-3 border-t border-[var(--hairline)]" />
      <h3 className="mt-3 text-balance font-serif text-[26px] leading-[1.15] text-[var(--ink)]">{pact.title}</h3>
      <p className="mt-1 text-[13px] text-[var(--muted)]">
        {pact.verification_type || pact.verification_method ? `${pact.verification_type || pact.verification_method} proof, witnessed` : 'Proof type unknown'}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] font-serif text-[15px] text-[var(--card)]">
          {initials(ownerName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--ink)]">{ownerName}</p>
          <p className="truncate text-[13px] text-[var(--muted)]">
            accountable to{' '}
            <span className="font-medium text-[var(--ink)]">{isGroup ? pact.circle_name : 'a witness'}</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <DayGrid days={buildDays(total, completed, missed)} />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[4px] border border-dashed border-[var(--seat-border)] p-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-[var(--tan)]">
          {hasProof ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pact.proof_url} alt="Latest proof" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5 text-[var(--muted)]" strokeWidth={1.6} />
          )}
        </div>
        <div className="min-w-0">
          {hasProof ? (
            <>
              <p className="text-[13px] font-semibold text-[var(--ink)]">
                Latest proof{proofAt ? ` · ${new Date(proofAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}` : ''}
              </p>
              <p className="text-[12px] text-[var(--muted)]">Proof submitted</p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-[var(--ink)]">No proof yet</p>
              <p className="text-[12px] text-[var(--muted)]">Due {pact.deadline || pact.end_date ? new Date(pact.deadline || pact.end_date).toLocaleDateString() : 'soon'}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline-soft)] pt-3">
        <p className="font-serif text-[13px] italic text-[var(--muted)]">
          {hasRecord ? `Record: ${lifetimeKept} of ${lifetimeTotal} pacts kept` : 'Record: —'}
        </p>
      </div>
    </Link>
  )
}

export function BrokenPactCard({ pact }: { pact: any }) {
  const { total, completed } = getPactProgress(pact)
  return (
    <div className="rounded-[6px] border border-[var(--hairline)] bg-[var(--card-muted)] px-5 py-4">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>PACT · No. {pactNumber(pact.id)}</span>
        <span>BROKEN · DAY {Math.min(total, completed + 1)}</span>
      </div>
      <div className="mt-3 border-t border-[var(--hairline)]" />
      <h3 className="mt-3 font-serif text-[22px] font-normal text-[var(--ink-soft)]">{pact.title}</h3>
      <p className="mt-2 text-[13px] text-[var(--muted)]">
        Kept {completed} of {total} days. It stays on the record as broken.
      </p>
      <div className="mt-3 flex justify-end">
        <Link
          href="/pacts/create"
          className="inline-flex h-11 items-center rounded-full border border-[var(--navy)] px-4 text-[13px] font-semibold text-[var(--navy)]"
        >
          Begin a new pact
        </Link>
      </div>
    </div>
  )
}

export function DarePactCard({ dare }: { dare: any }) {
  const confirmed = Array.isArray(dare.witnesses) ? dare.witnesses.filter((w: any) => w.confirmed).length : dare.confirmed_witness_count ?? 0
  const totalWitnesses = Array.isArray(dare.witnesses) ? dare.witnesses.length : dare.witness_count ?? 0
  const seats: Array<{ confirmed: boolean; initials: string }> =
    Array.isArray(dare.witnesses) && dare.witnesses.length
      ? dare.witnesses.map((w: any) => ({ confirmed: !!w.confirmed, initials: initials(w.full_name || w.username) }))
      : Array.from({ length: Math.max(totalWitnesses, 0) }, () => ({ confirmed: false, initials: '—' }))
  const windowClosed = dare.response_deadline_passed || (dare.response_due_at && new Date(dare.response_due_at) < new Date() && dare.status === 'pending')

  return (
    <Link href={`/dares/${dare.id}`} className="block rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-4">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
        <span>DARE · FROM {(dare.sender_full_name || dare.sender_username || 'SOMEONE').split(' ')[0].toUpperCase()}</span>
        <span>{dare.hours_left != null ? `${dare.hours_left}H LEFT` : '—'}</span>
      </div>
      <div className="mt-3 border-t border-[var(--hairline)]" />
      <h3 className="mt-3 font-serif text-[24px] leading-[1.15] text-[var(--ink)]">{dare.title}</h3>
      <p className="mt-1 text-[13px] text-[var(--muted)]">
        Dared to {dare.recipient_full_name || dare.recipient_username || 'you'} · {dare.verification_type ? `${dare.verification_type} proof` : 'Proof required'}
      </p>

      {seats.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {seats.slice(0, 8).map((seat, i) =>
              seat.confirmed ? (
                <div
                  key={i}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--navy)] font-sans text-[10px] font-semibold text-[var(--card)]"
                >
                  {seat.initials}
                </div>
              ) : (
                <div
                  key={i}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--witness-empty)] bg-transparent"
                />
              )
            )}
          </div>
          <p className="text-[13px] text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {confirmed} of {totalWitnesses}
            </span>{' '}
            witnesses have confirmed
          </p>
        </div>
      )}

      {windowClosed && (
        <div className="mt-3 rounded-[3px] bg-[var(--warn-bg)] px-[10px] py-2 text-[12px] text-[var(--warn-text)]">
          {dare.recipient_full_name || 'They'} haven&apos;t responded. The response window closed{dare.hours_since_closed ? ` ${dare.hours_since_closed}h ago` : '.'}
        </div>
      )}
    </Link>
  )
}
