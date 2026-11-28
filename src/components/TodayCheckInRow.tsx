'use client'

import CircleMark from '@/components/brand/CircleMark'
import CircleWatch from '@/components/brand/CircleWatch'
import SetupSlide, { useSetupSteps } from '@/components/home/SetupSlide'
import { MomentsLine, MomentsPanel, useTodayMoments, type MomentsCircle } from '@/components/home/TodayMoments'
import StoryViewer from '@/components/stories/StoryViewer'
import { PostTodaySheet } from '@/components/stories/StoryCirclesRow'
import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Check, Plus } from 'lucide-react'
import StreakChip from '@/components/StreakChip'
import { STORIES_ENABLED } from '@/lib/stories'
import { useTodayStatus, type TodayPact } from '@/hooks/useTodayStatus'
import { useSnapSwipe } from '@/hooks/useSnapSwipe'
import { useNow } from '@/hooks/useNow'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import type { MomentPerson } from '@/hooks/useMomentPeople'

const GAP = 16

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

/** "15h 12m", "48m": time left in today's window. */
function leftLabel(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return hours > 0 ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`
}

function timeOf(iso?: string | null): string | null {
  if (!iso) return null
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return null
  return when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

interface PanelProps {
  pact: TodayPact
  peers: MomentPerson[]
  onCapture: (pact: TodayPact) => void
}

/**
 * One pact inside the Today card: the watch filling toward midnight, the pact's
 * full name, time left (or checked in), and one big button.
 */
function PactPanel({ pact, peers, onCapture }: PanelProps) {
  // Ticks while the check-in is waiting, so "left today" and the last-hours edge stay true.
  const now = useNow(30_000, !pact.posted_today)
  const hours = hoursLeft(pact)
  const urgent = !pact.posted_today && hours != null && hours < 24
  const dayLabel = pact.day && pact.total_days ? `Day ${pact.day} of ${pact.total_days}` : null
  const circlePeers = pact.circle_id != null ? peers.filter((p) => p.circleId === Number(pact.circle_id)) : []
  const firstPeer = circlePeers[0]?.name?.split(' ')[0] || 'Someone'
  const peersLine =
    circlePeers.length === 1
      ? `${firstPeer} posted`
      : circlePeers.length === 2
        ? `${firstPeer} and ${circlePeers[1].name?.split(' ')[0] || 'one other'} posted`
        : circlePeers.length > 2
          ? `${firstPeer} and ${circlePeers.length - 1} others posted`
          : null
  const postedAt = timeOf(pact.posted_at)
  const endsAt = pact.day_ends_at ? Date.parse(pact.day_ends_at) : NaN
  const todayMs = Number.isFinite(endsAt) ? Math.max(0, endsAt - now) : null
  const todayLeft = todayMs != null ? leftLabel(todayMs) : null
  const lastHours = todayMs != null && todayMs < 3 * 3_600_000

  return (
    <li
      className="flex w-full shrink-0 snap-start flex-col"
      aria-label={`${pact.title}${pact.posted_today ? ', checked in' : todayLeft ? `, waiting, ${todayLeft} left` : ', waiting'}`}
    >
      <div className="flex items-start gap-3">
        {todayMs != null ? (
          <CircleWatch
            size={40}
            elapsed={1 - Math.min(1, todayMs / 86_400_000)}
            endsAt={endsAt}
            state={pact.posted_today ? 'done' : 'running'}
            title={pact.posted_today ? 'Checked in today' : `${todayLeft} left to check in today`}
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
            <CircleMark size={24} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {/* The name opens the pact; the button keeps its own job. */}
          <Link href={`/pacts/${pact.id}`} className="line-clamp-1 text-[18px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
            {pact.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {pact.posted_today ? (
              <span className="flex items-center gap-1 rounded-full px-2 py-[2px] text-[12px] font-extrabold text-white" style={{ background: '#16A34A' }}>
                <Check className="size-3.5" strokeWidth={3.2} aria-hidden="true" />
                {postedAt ? `Checked in · ${postedAt}` : 'Checked in'}
              </span>
            ) : todayLeft ? (
              <span
                className={`rounded-full px-2 py-[2px] text-[12px] font-extrabold tabular-nums ${lastHours ? 'cp-breathe' : ''}`}
                style={lastHours ? { background: 'var(--dare)', color: '#17181D' } : { background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}
              >
                {todayLeft} left
              </span>
            ) : urgent && hours != null ? (
              <span className="rounded-full px-2 py-[2px] text-[12px] font-extrabold" style={{ background: 'var(--dare)', color: '#17181D' }}>{endsLabel(hours)}</span>
            ) : null}
            {dayLabel && <span className="text-[12.5px] font-semibold" style={{ color: '#C9D3F5' }}>{dayLabel}</span>}
          </div>
          {!pact.posted_today && pact.nudged_by?.count ? (
            // Being nudged by several people is the point: show who, where you check in.
            <p key={pact.nudged_by.count} className="cp-pop-in mt-0.5 truncate text-[12.5px] font-bold text-[var(--dare)]">{pact.nudged_by.line}</p>
          ) : !pact.posted_today && peersLine ? (
            <p className="mt-0.5 truncate text-[12.5px] font-semibold" style={{ color: '#C9D3F5' }}>{peersLine}</p>
          ) : null}
        </div>
      </div>
      <span className="block h-2.5 shrink-0" aria-hidden="true" />
      {pact.posted_today ? (
        <button
          type="button"
          onClick={() => onCapture(pact)}
          aria-label={`Add another moment to ${pact.title}`}
          className="mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-white/70 text-[14.5px] font-extrabold text-white transition active:scale-[0.98]"
        >
          <Camera className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
          Add another moment
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onCapture(pact)}
          aria-label={`Check in to ${pact.title}`}
          className={`cp-btn-shine mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--dare-deep)] text-[15.5px] font-extrabold text-[var(--ink)] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.5)] transition active:scale-[0.98]${lastHours ? ' cp-breathe' : ''}`}
        >
          <Camera className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
          Check in for today
        </button>
      )}
    </li>
  )
}

/**
 * Home's Today: one navy card. On top, today's count and streak; then one
 * panel per active pact, swiped left to right (waiting ones first); a thin
 * progress line; and at the bottom who posted a moment today. The black and
 * yellow Moments button opens the moments in place at the bottom of the card,
 * and Hide closes them from the same spot.
 */
export default function TodayCheckInRow({
  onCreatePact,
  peers = [],
  streak = 0,
  circles = [],
}: {
  onCreatePact?: () => void
  peers?: MomentPerson[]
  streak?: number
  /** The viewer's circles, for the moments at the bottom of the card. */
  circles?: MomentsCircle[]
}) {
  const router = useRouter()
  const { pacts, allDone, isLoading } = useTodayStatus()
  const [capturePact, setCapturePact] = useState<TodayPact | null>(null)
  const [index, setIndex] = useState(0)
  const [momentsOpen, setMomentsOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [viewing, setViewing] = useState<MomentPerson | null>(null)
  const [viewingOwn, setViewingOwn] = useState(false)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const moments = useTodayMoments(circles)

  const waiting = pacts.filter((p) => !p.posted_today)
  const done = pacts.filter((p) => p.posted_today)
  // Setup steps (first pact, photo, circle) sit under the card.
  const setup = useSetupSteps(pacts.length)
  const showFirst = setup.steps.includes('first')
  const panels = allDone ? [] : [...waiting, ...done]

  const stepOf = useCallback((scroller: HTMLElement) => {
    const first = scroller.firstElementChild as HTMLElement | null
    return first ? first.offsetWidth + GAP : scroller.clientWidth
  }, [])
  useSnapSwipe(scrollerRef, panels.length, panels.length > 1, stepOf)

  const onScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2
    const next = atEnd ? panels.length - 1 : Math.round(scroller.scrollLeft / Math.max(1, stepOf(scroller)))
    if (next !== index) setIndex(Math.max(0, Math.min(panels.length - 1, next)))
  }

  const capture = (pact: TodayPact) => {
    if (STORIES_ENABLED) setCapturePact(pact)
    else router.push(`/pacts/${pact.id}`)
  }

  const setupRail =
    setup.steps.length === 0 ? null : (
      <ul className="scrollbar-hide -mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4" style={{ gap: 8 }} aria-label="Get set up">
        {setup.steps.map((step, i) => (
          <SetupSlide
            key={step}
            step={step}
            position={i + 1}
            count={setup.steps.length}
            fullWidth={setup.steps.length === 1}
            width={`calc(100% - ${32 + 8}px)`}
            onCreatePact={onCreatePact}
            onSnooze={setup.snooze}
          />
        ))}
      </ul>
    )

  const card = (
    <div className="relative overflow-hidden rounded-[24px] bg-[var(--navy)] px-4 pb-3 pt-3 text-white shadow-[0_14px_30px_-20px_rgba(31,58,147,0.9)]">
      {/* The mark, faint, in the corner. */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-14 -top-16 size-[180px] opacity-[0.16]" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="1.2" />
        <path d="M50 50 L50 6 A44 44 0 0 1 88 28 Z" fill="none" stroke="#fff" strokeWidth="1.2" />
      </svg>

      {/* Top line: which pact of how many (1/12, follows the swipe), the streak, New pact.
          The old "Today · 1 of 12" count and the progress line are gone to keep the card short. */}
      <div className="relative flex min-h-6 items-center gap-2">
        {allDone ? (
          <>
            <CircleMark size={20} animation="close" tick />
            <span className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: '#86EFAC' }}>
              {pacts.length === 1 ? 'Checked in today' : `All ${pacts.length} checked in`}
            </span>
          </>
        ) : panels.length > 1 ? (
          <span className="rounded-full bg-white/15 px-2 py-[1px] text-[12px] font-extrabold tabular-nums text-white" aria-label={`Pact ${index + 1} of ${panels.length}`}>
            {index + 1}/{panels.length}
          </span>
        ) : null}
        {streak > 0 && <StreakChip streak={streak} tone="onNavy" />}
        <span className="flex-1" />
        {onCreatePact && (
          <button type="button" onClick={onCreatePact} className="cp-hit relative flex h-6 items-center gap-0.5 text-[13.5px] font-extrabold text-white" style={{ ['--cp-hit' as string]: '10px' }}>
            <Plus className="h-4 w-4" strokeWidth={2.8} aria-hidden="true" />
            New pact
          </button>
        )}
      </div>

      {panels.length > 0 && (
        <div>
          <ul
            ref={scrollerRef}
            onScroll={onScroll}
            className="scrollbar-hide relative mt-2 flex snap-x snap-mandatory overflow-x-auto"
            style={{ gap: GAP, overscrollBehaviorX: 'contain' }}
            aria-label={`${waiting.length} ${waiting.length === 1 ? 'pact' : 'pacts'} waiting for today's moment`}
          >
            {panels.map((pact) => (
              <PactPanel key={pact.id} pact={pact} peers={peers} onCapture={capture} />
            ))}
          </ul>
        </div>
      )}

      {/* Moments open in place: the Hide button sits exactly where Moments was. */}
      {momentsOpen ? (
        <MomentsPanel
          data={moments}
          open
          onToggle={() => setMomentsOpen(false)}
          onViewOwn={() => setViewingOwn(true)}
          onPost={() => setPickerOpen(true)}
          onView={setViewing}
        />
      ) : (
        <MomentsLine data={moments} open={false} onToggle={() => setMomentsOpen(true)} />
      )}
    </div>
  )

  return (
    <section aria-label="Today" className="mb-0 flex flex-col gap-2">
      {isLoading ? (
        <div className="pact-shimmer h-[200px] rounded-[24px]" aria-hidden="true" />
      ) : pacts.length === 0 && !showFirst ? (
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
          {setupRail}
        </>
      ) : pacts.length === 0 ? (
        setupRail
      ) : (
        <>
          <h2 className="sr-only">Today</h2>
          {card}
          {setupRail}
        </>
      )}

      {capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} />
      )}
      {pickerOpen && (
        <PostTodaySheet
          circles={circles}
          onClose={() => setPickerOpen(false)}
          onPick={(pact) => {
            setPickerOpen(false)
            setCapturePact(pact)
          }}
        />
      )}
      <StoryViewer open={viewingOwn} onClose={() => setViewingOwn(false)} stories={moments.myStories} />
      <StoryViewer open={viewing !== null} onClose={() => setViewing(null)} stories={viewing?.stories ?? []} circleId={viewing?.circleId} circleName={viewing?.circleName} />
    </section>
  )
}
