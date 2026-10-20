'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Plus } from 'lucide-react'
import { STORIES_ENABLED } from '@/lib/stories'
import { useTodayMoments } from '@/hooks/useTodayMoments'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import { RingFace } from '@/components/stories/StoryRing'
import type { MomentPerson } from '@/hooks/useMomentPeople'

function endsInLabel(pact: any): string | null {
  const raw = pact?.end_date || pact?.deadline
  if (!raw) return null
  const end = new Date(raw).getTime()
  if (Number.isNaN(end)) return null
  const hours = Math.floor((end - Date.now()) / 3_600_000)
  if (hours < 0) return null
  if (hours < 1) return 'Ends within the hour'
  if (hours < 24) return `Ends in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = Math.round(hours / 24)
  return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`
}

const card = 'flex items-center gap-3 rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-3'

/**
 * One calm "what do I do now" row under the Moments rail: the most urgent
 * active pact that has no moment from the viewer yet, with a Check in action.
 */
export default function TodayCheckInRow({ onCreatePact, peers = [] }: { onCreatePact?: () => void; peers?: MomentPerson[] }) {
  const router = useRouter()
  const { activePacts, pendingPact, allDone, isLoading } = useTodayMoments()
  const [capturePact, setCapturePact] = useState<any | null>(null)

  const checkIn = (pact: any) => {
    if (STORIES_ENABLED) setCapturePact(pact)
    else router.push(`/pacts/${pact.id}`)
  }

  const hasActive = activePacts.length > 0
  const circleName = pendingPact?.circle_name || pendingPact?.circle || null
  const meta = pendingPact ? [circleName, endsInLabel(pendingPact)].filter(Boolean).join(' · ') : ''
  // Social nudge: who in this pact's circle has already posted today. Shown
  // as a fact ("Suman and 2 others posted"), never as a guilt trip.
  const circlePeers = pendingPact?.circle_id != null ? peers.filter((p) => p.circleId === Number(pendingPact.circle_id)) : []
  const firstPeer = circlePeers[0]?.name?.split(' ')[0] || 'Someone'
  const socialLine =
    circlePeers.length === 0
      ? circleName
        ? `Be the first in ${circleName} today`
        : null
      : circlePeers.length === 1
        ? `${firstPeer} posted in ${circleName || 'your circle'} today`
        : `${firstPeer} and ${circlePeers.length - 1} ${circlePeers.length - 1 === 1 ? 'other' : 'others'} posted today`

  return (
    <section aria-label="Today" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[var(--ink)]">Today</h2>
        {hasActive && (
          <button type="button" onClick={onCreatePact} className="-my-3 flex h-11 items-center gap-1 px-1 text-[14px] font-bold text-[var(--navy)]">
            <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
            New pact
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="pact-shimmer h-[68px] rounded-[20px]" aria-hidden="true" />
      ) : !hasActive ? (
        <div className={card}>
          <div className="min-w-0 flex-1 px-1">
            <div className="text-[14.5px] font-bold text-[var(--ink)]">No active pact yet</div>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">Start one and show your circle how it goes.</p>
          </div>
          <button
            type="button"
            onClick={onCreatePact}
            className="flex h-11 shrink-0 items-center rounded-full bg-[var(--navy)] px-4 text-[14px] font-bold text-white transition hover:bg-[var(--navy-hover)] active:scale-[0.97]"
          >
            New pact
          </button>
        </div>
      ) : allDone || !pendingPact ? (
        <div className="flex min-h-[44px] items-center gap-2.5 px-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'var(--success)' }}>
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--ink)]">
            {activePacts.length === 1 ? "You're checked in today" : `All ${activePacts.length} pacts checked in today`}
          </span>
        </div>
      ) : (
        <div className={card}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DCE4F7] text-[var(--navy)]">
            <Clock className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-bold text-[var(--ink)]">{pendingPact.title}</div>
            {(socialLine || meta) && (
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
                {circlePeers.length > 0 && (
                  <span className="flex shrink-0 -space-x-1.5">
                    {circlePeers.slice(0, 3).map((p) => (
                      <span key={p.userId} className="rounded-full" style={{ boxShadow: '0 0 0 2px var(--card)' }}>
                        <RingFace name={p.name} imageUrl={p.avatarUrl} size={20} />
                      </span>
                    ))}
                  </span>
                )}
                <span className="truncate">{socialLine || meta}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => checkIn(pendingPact)}
            className="flex h-11 shrink-0 items-center rounded-full bg-[var(--navy)] px-4 text-[14px] font-bold text-white transition hover:bg-[var(--navy-hover)] active:scale-[0.97]"
          >
            Check in
          </button>
        </div>
      )}

      {capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} />
      )}
    </section>
  )
}
