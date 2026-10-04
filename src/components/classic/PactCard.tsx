'use client'

import Link from 'next/link'
import TallyGrid, { type TallyCellStatus } from './TallyGrid'
import CircleChip, { PersonalPactLabel } from './CircleChip'
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
 * v2 pact surfaces. Three honest variants:
 *  - ActivePactCard: the lead card (the only bordered/shadowed card)
 *  - DarePactCard: a plain row for a dare that has gone unanswered
 *  - BrokenPactCard / FinishedPactRow: plain blocks, never hidden
 *
 * Every number comes from the pact/dare object. Fields the API does not
 * expose (witness view counts, next-proof deadline) are omitted instead of
 * estimated — see BACKEND_SPEC_*.md.
 */

function initials(name?: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

function isToday(value?: string | null) {
  if (!value) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
}

function hoursFrom(iso?: string | null) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.round((t - Date.now()) / 3600000)
}

function describeHours(hours: number) {
  const n = Math.abs(hours)
  if (n >= 48) return `${Math.round(n / 24)} days`
  return `${n} h`
}

export function ActivePactCard({ pact }: { pact: any }) {
  const { total, completed, missed } = getPactProgress(pact)
  const dayNumber = Math.min(total, completed + missed + 1)
  const isGroup = !!pact.circle_name
  const ownerName = pact.creator_full_name || pact.creator_username || 'You'
  const proofAt: string | undefined = pact.last_proof_at
  const proofToday = isToday(proofAt)
  const missedSentence = missed === 0 ? "You haven't missed any." : missed === 1 ? "You've missed one." : `You've missed ${missed}.`
  const method = pact.verification_type || pact.verification_method
  const subtitle = method ? `${pact.frequency_label || 'Check in regularly'}. ${String(method).charAt(0).toUpperCase()}${String(method).slice(1)} proof.` : null

  return (
    <Link
      href={`/pacts/${pact.id}`}
      className="relative block rounded-[14px] bg-[var(--card)] px-5 pb-[18px] pt-[22px] shadow-[0_1px_2px_rgba(60,45,20,0.08),0_14px_28px_-16px_rgba(60,45,20,0.30)]"
    >
      {pact.proof_url && (
        <div
          className="absolute -top-4 right-[18px] w-[84px] bg-[var(--photo-frame)] px-1.5 pb-5 pt-1.5 shadow-[0_1px_2px_rgba(60,45,20,0.18),0_8px_14px_-8px_rgba(60,45,20,0.35)]"
          style={{ transform: 'rotate(3deg)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pact.proof_url} alt="Latest proof" className="h-[72px] w-[72px] object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {isGroup ? (
          <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="lead" />
        ) : (
          <PersonalPactLabel />
        )}

        <div>
          <h3 className="pr-24 text-balance text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink)]">{pact.title}</h3>
          {subtitle && <p className="mt-1.5 pr-24 text-[14px] text-[var(--muted)]">{subtitle}</p>}
        </div>

        <p className="text-[16px] font-medium text-[var(--ink)]">
          Day {dayNumber} of {total}. {missedSentence}
        </p>

        <TallyGrid days={buildDays(total, completed, missed)} />

        <p className="text-[14px] text-[var(--ink-soft)]">
          {proofToday
            ? `Today's proof went in at ${new Date(proofAt!).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}.`
            : 'No proof yet today.'}
        </p>

        {(Array.isArray(pact.witnesses) && pact.witnesses.length > 0) || pact.time_left_label ? (
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
            {Array.isArray(pact.witnesses) && pact.witnesses.length > 0 ? (
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex shrink-0 -space-x-2">
                  {pact.witnesses.slice(0, 3).map((w: any, i: number) => (
                    <div
                      key={w.user_id ?? w.id ?? i}
                      className="flex h-[26px] w-[26px] items-center justify-center overflow-hidden rounded-full border-[1.5px] text-[10px] font-semibold"
                      style={
                        i === 0
                          ? { background: 'var(--navy)', borderColor: 'var(--card)', color: 'var(--card)' }
                          : i === 1
                            ? { background: 'var(--ink)', borderColor: 'var(--card)', color: 'var(--card)' }
                            : { background: 'var(--card)', borderColor: 'var(--seat-border)', color: 'var(--muted)' }
                      }
                    >
                      {initials(w.full_name || w.username)}
                    </div>
                  ))}
                </div>
                <span className="truncate text-[13px] text-[var(--muted)]">
                  {pact.witnesses.length} witness{pact.witnesses.length === 1 ? '' : 'es'}
                </span>
              </div>
            ) : (
              <span />
            )}
            {pact.time_left_label && <span className="shrink-0 pl-3 text-[13px] font-semibold text-[var(--navy)]">{pact.time_left_label}</span>}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

export function BrokenPactCard({ pact }: { pact: any }) {
  const { total, completed } = getPactProgress(pact)
  const brokenDay = Math.min(total, completed + 1)
  return (
    <div className="px-1 py-2">
      {pact.circle_name && <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="muted" />}
      <h3 className="text-[18px] font-semibold text-[var(--ink-soft)]">{pact.title}</h3>
      <p className="mt-1 text-[14px] text-[var(--muted)]">
        Broken on day {brokenDay}. You kept {completed} and missed the rest. It stays on your record.
      </p>
      <Link
        href="/pacts/create"
        className="mt-3 inline-flex h-11 items-center rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)]"
      >
        Start it again
      </Link>
    </div>
  )
}

export function FinishedPactRow({ pact }: { pact: any }) {
  const { total, completed } = getPactProgress(pact)
  return (
    <Link href={`/pacts/${pact.id}`} className="block px-1 py-2">
      {pact.circle_name && (
        <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="muted" className="mb-1" />
      )}
      <h3 className="text-[18px] font-semibold text-[var(--ink)]">{pact.title}</h3>
      <p className="mt-1 text-[14px] text-[var(--muted)]">
        Finished. You kept {Math.min(completed, total)} of {total} days.
      </p>
    </Link>
  )
}

/**
 * A dare the viewer sent that has gone unanswered. Only the true parts of
 * the sentence are rendered: the witness line appears only when the
 * response window has actually closed.
 */
export function DarePactCard({ dare }: { dare: any }) {
  const recipient = dare.recipients?.[0]
  const recipientName: string =
    recipient?.full_name || recipient?.username || recipient?.user?.full_name || recipient?.user?.username || ''
  const first = recipientName ? recipientName.split(' ')[0] : 'They'
  const respondHours = hoursFrom(dare.respond_by)
  const completeHours = hoursFrom(dare.complete_by)
  const windowClosed = respondHours !== null && respondHours < 0

  return (
    <Link href={`/dares/${dare.id}`} className="block px-1 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-semibold text-[var(--card)]">
          {initials(recipientName || dare.title)}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[var(--ink)]">{first} hasn&apos;t answered your dare</p>
          <p className="text-[13px] text-[var(--muted)]">
            {dare.title}
            {completeHours !== null && completeHours > 0 ? ` · ${describeHours(completeHours)} left to do it` : ''}
          </p>
        </div>
      </div>
      {windowClosed && (
        <p className="pl-[52px] pt-2 text-[14px] text-[var(--warn-text)]">
          The window to reply closed {describeHours(respondHours!)} ago.
        </p>
      )}
    </Link>
  )
}
