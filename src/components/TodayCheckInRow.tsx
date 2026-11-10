'use client'

import CircleMark from '@/components/brand/CircleMark'
import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Check, Plus } from 'lucide-react'
import StreakChip from '@/components/StreakChip'
import { STORIES_ENABLED } from '@/lib/stories'
import { useTodayStatus, type TodayPact } from '@/hooks/useTodayStatus'
import { useSnapSwipe } from '@/hooks/useSnapSwipe'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import type { MomentPerson } from '@/hooks/useMomentPeople'

const GAP = 8

/** Hours left until the end of the pact's last day (local midnight after end_date). */
function hoursLeft(pact: TodayPact): number | null {
  if (!pact.end_date) return null
  const end = new Date(`${pact.end_date.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(end.getTime())) return null
  end.setDate(end.getDate() + 1)
  const hours = Math.floor((end.getTime() - Date.now()) / 3_600_000)
  return hours < 0 ? null : hours
}

function endsLabel(hours: number): string {
  if (hours < 1) return 'Ends within the hour'
  if (hours < 24) return `Ends in ${hours}h`
  const days = Math.round(hours / 24)
  return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`
}

function timeOf(iso?: string | null): string | null {
  if (!iso) return null
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return null
  return when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

/** A small solid face for "who already posted": the card-coloured RingFace vanishes on a card. */
function PeerFace({ name, imageUrl, tone }: { name?: string | null; imageUrl?: string | null; tone: string }) {
  const [failed, setFailed] = useState(false)
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
  return (
    <span
      className="flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full text-[9px] font-extrabold text-white"
      style={{ background: tone, boxShadow: '0 0 0 2px var(--card)' }}
      aria-hidden="true"
    >
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  )
}

interface SlideProps {
  pact: TodayPact
  peers: MomentPerson[]
  fullWidth: boolean
  onCapture: (pact: TodayPact) => void
  done: number
  total: number
  streak: number
  onCreatePact?: () => void
}

/**
 * One slim navy card per pact: today's count and streak on top, the pact and
 * who's posted in the middle, a thin progress bar underneath. The yellow
 * button is the one thing to tap.
 */
function CheckInSlide({ pact, peers, fullWidth, onCapture, done, total, streak, onCreatePact }: SlideProps) {
  const hours = hoursLeft(pact)
  const urgent = !pact.posted_today && hours != null && hours < 24
  const dayLabel = pact.day && pact.total_days ? `Day ${pact.day} of ${pact.total_days}` : null
  const circlePeers = pact.circle_id != null ? peers.filter((p) => p.circleId === Number(pact.circle_id)) : []
  const firstPeer = circlePeers[0]?.name?.split(' ')[0] || 'Someone'
  // Who in this pact's circle already posted today, stated as a fact, never a guilt trip.
  const peersLine =
    circlePeers.length === 1
      ? `${firstPeer} posted`
      : circlePeers.length === 2
        ? `${firstPeer} and ${circlePeers[1].name?.split(' ')[0] || 'one other'} posted`
        : circlePeers.length > 2
          ? `${firstPeer} and ${circlePeers.length - 1} others posted`
          : null
  const postedAt = timeOf(pact.posted_at)
  const where = pact.circle_name || 'Personal'
  const detail = urgent && hours != null ? endsLabel(hours) : peersLine || dayLabel

  return (
    <li
      className="relative flex shrink-0 snap-start flex-col rounded-[20px] bg-[var(--navy)] pb-3 pl-3.5 pr-2.5 pt-2.5 text-white"
      style={{ width: fullWidth ? '100%' : `calc(100% - ${32 + GAP}px)` }}
      aria-label={`${pact.title}${pact.posted_today ? ', checked in' : ', waiting'}`}
    >
      <div className="relative z-[1] flex min-h-6 items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#D4DBFA' }}>
        <span>
          Today <span key={done} className="cp-tick inline-block text-white">{done}</span>/{total}
        </span>
        {streak > 0 && <StreakChip streak={streak} tone="onNavy" />}
        <span className="flex-1" />
        {onCreatePact && (
          <button type="button" onClick={onCreatePact} className="cp-hit relative flex h-6 items-center gap-0.5 pr-1 text-[12.5px] font-bold text-white" style={{ ['--cp-hit' as string]: '10px' }}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.8} aria-hidden="true" />
            New pact
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {/* The text opens the pact; the button keeps its own job. */}
          <Link href={`/pacts/${pact.id}`} className="block truncate text-[16px] font-bold tracking-[-0.015em] text-white">
            {pact.title}
          </Link>
          {pact.posted_today ? (
            <p className="mt-px flex items-center gap-1 truncate text-[12.5px] font-semibold text-white">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3.2} aria-hidden="true" />
              {postedAt ? `Checked in · ${postedAt}` : 'Checked in'}
            </p>
          ) : pact.nudged_by?.count ? (
            // Being nudged by several people is the point: show who, where you check in.
            <p key={pact.nudged_by.count} className="cp-pop-in mt-px truncate text-[12.5px] font-bold text-[var(--dare)]">{pact.nudged_by.line}</p>
          ) : (
            <p className="mt-px truncate text-[12.5px]" style={{ color: '#D4DBFA' }}>
              {where}
              {detail && (
                <>
                  {' · '}
                  <span className={urgent ? 'font-bold text-[var(--dare)]' : undefined}>{detail}</span>
                </>
              )}
            </p>
          )}
        </div>
        {pact.posted_today ? (
          <button
            type="button"
            onClick={() => onCapture(pact)}
            aria-label={`Add another moment to ${pact.title}`}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-white/70 pl-3 pr-3.5 text-[14px] font-bold text-white transition active:scale-[0.97]"
          >
            <Camera className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            Add
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCapture(pact)}
            aria-label={`Check in to ${pact.title}`}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--dare-deep)] pl-3.5 pr-4 text-[15px] font-bold text-[var(--ink)] shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition active:scale-[0.97]"
          >
            <Camera className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            Check in
          </button>
        )}
      </div>

      <div className="mr-1 mt-2.5 h-1 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${done} of ${total} pacts checked in today`}>
        <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${total ? Math.max(done ? 4 : 0, (done / total) * 100) : 0}%` }} />
      </div>
    </li>
  )
}

/**
 * Home's Today: one slide per active pact, swiped left to right. Pacts still
 * waiting for today's moment come first; checked-in ones move to the end.
 * When every pact is checked in it shrinks to one quiet line.
 */
export default function TodayCheckInRow({ onCreatePact, peers = [], streak = 0 }: { onCreatePact?: () => void; peers?: MomentPerson[]; streak?: number }) {
  const router = useRouter()
  const { pacts, allDone, isLoading } = useTodayStatus()
  const [capturePact, setCapturePact] = useState<TodayPact | null>(null)
  const [index, setIndex] = useState(0)
  const scrollerRef = useRef<HTMLUListElement>(null)

  const waiting = pacts.filter((p) => !p.posted_today)
  const done = pacts.filter((p) => p.posted_today)
  const slides = [...waiting, ...done]
  const single = slides.length === 1

  const stepOf = useCallback((scroller: HTMLElement) => {
    const first = scroller.firstElementChild as HTMLElement | null
    return first ? first.offsetWidth + GAP : scroller.clientWidth
  }, [])
  useSnapSwipe(scrollerRef, slides.length, !allDone && slides.length > 1, stepOf)

  const onScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    // The last slide can't scroll to the start edge, so the end of the scroll counts as the last slide.
    const atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2
    const next = atEnd ? slides.length - 1 : Math.round(scroller.scrollLeft / Math.max(1, stepOf(scroller)))
    if (next !== index) setIndex(Math.max(0, Math.min(slides.length - 1, next)))
  }

  const capture = (pact: TodayPact) => {
    if (STORIES_ENABLED) setCapturePact(pact)
    else router.push(`/pacts/${pact.id}`)
  }

  const newPact = (
    <button type="button" onClick={onCreatePact} className="-my-2 flex h-11 items-center gap-1 px-1 text-[14px] font-extrabold text-[var(--navy)]">
      <Plus className="h-[15px] w-[15px]" strokeWidth={2.8} aria-hidden="true" />
      New pact
    </button>
  )

  return (
    <section aria-label="Today" className="mb-0 flex flex-col gap-2">
      {isLoading ? (
        <>
          <div className="flex items-center gap-2 px-0.5">
            <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--ink)]">Today</h2>
          </div>
          <div className="pact-shimmer h-[112px] rounded-[20px]" aria-hidden="true" />
        </>
      ) : pacts.length === 0 ? (
        <>
          <div className="flex items-center gap-2 px-0.5">
            <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--ink)]">Today</h2>
            {streak > 0 && <StreakChip streak={streak} />}
          </div>
          <div className="flex items-center gap-3 rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] p-3">
            <CircleMark size={34} animation="draw" className="ml-1" />
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
        </>
      ) : allDone ? (
        <div className="flex min-h-[32px] items-center gap-2 px-0.5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.01em] text-[var(--ink)]">Today</h2>
          {/* Every pact done today: the circle closes. */}
          <CircleMark size={20} animation="close" tick className="ml-1" />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold" style={{ color: 'var(--success, #2E7D4F)' }}>
            {pacts.length === 1 ? 'Checked in' : `All ${pacts.length} checked in`}
          </span>
          {newPact}
        </div>
      ) : (
        <>
          <h2 className="sr-only">Today</h2>
          <ul
            ref={scrollerRef}
            onScroll={onScroll}
            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4"
            style={{ gap: GAP, overscrollBehaviorX: 'contain' }}
            aria-label={`${waiting.length} ${waiting.length === 1 ? 'pact' : 'pacts'} waiting for today's moment`}
          >
            {slides.map((pact) => (
              <CheckInSlide key={pact.id} pact={pact} peers={peers} fullWidth={single} onCapture={capture} done={done.length} total={pacts.length} streak={streak} onCreatePact={onCreatePact} />
            ))}
          </ul>
          {!single && (
            <div className="flex items-center justify-center gap-1 pt-0.5" aria-hidden="true">
              {slides.slice(0, 5).map((pact, i) => (
                <span key={pact.id} className="h-1 rounded-full transition-all" style={{ width: Math.min(index, 4) === i ? 16 : 4, background: Math.min(index, 4) === i ? 'var(--navy)' : 'var(--hairline)' }} />
              ))}
              {slides.length > 5 && <span className="pl-0.5 text-[11px] font-semibold leading-none text-[var(--muted)]">+{slides.length - 5}</span>}
            </div>
          )}
        </>
      )}

      {capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} />
      )}
    </section>
  )
}
