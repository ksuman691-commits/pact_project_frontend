'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, Image as ImageIcon, MessageCircle, Play, Plus, RotateCcw, Share2, UserPlus, Volume2, VolumeX, X } from 'lucide-react'
import CheerButton from '@/components/CheerButton'
import CommentsBottomSheet from '@/components/CommentsBottomSheet'
import { pactLocalToday, resolvePactCompletionViewState } from '@/lib/pactCompletionState'
import type { PactDayStripEntry } from '@/types'

type Moment = {
  id: number | string
  url?: string
  type?: string
  description?: string
  day?: number
  uploadedAt?: string
  userId?: number | string | null
}

type Props = {
  pact: any
  moments: Moment[]
  participants: any[]
  progress: { completed: number; total: number; missed: number } | null
  cheerCount: number
  isEnded: boolean
  canCheer: boolean
  hasCheered: boolean
  /** Lets the moment say "You" when the viewer posted it. */
  currentUserId?: number | null
  onInvite: () => void
  onAddMoment: () => void
  onRestart: () => void
  onShareRecap: () => void
}

function Avatar({ person, index }: { person: any; index: number }) {
  const label = String(person?.full_name || person?.name || person?.username || 'M').charAt(0).toUpperCase()
  return person?.avatar_url || person?.avatar ? (
    <img
      src={person.avatar_url || person.avatar}
      alt=""
      className={`size-[34px] rounded-full border-2 border-[var(--card)] object-cover ${index ? '-ml-2' : ''}`}
    />
  ) : (
    <span
      className={`flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--navy-hover)] text-[13px] font-extrabold text-white ${index ? '-ml-2' : ''}`}
    >
      {label}
    </span>
  )
}

/**
 * Plays a story-style moment: starts on its own (muted, as browsers require),
 * loops, taps in the middle third pause/resume, and a button unmutes.
 * Signed URLs expire, so a load failure offers a retry instead of a dead frame.
 */
function MomentVideo({ src, label, hasNeighbours }: { src: string; label: string; hasNeighbours: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setPaused(false)
    setFailed(false)
  }, [src])

  // React does not reliably update the muted attribute after mount, so set the property.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted, src, attempt])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().catch(() => setPaused(true))
    } else {
      video.pause()
    }
  }

  return (
    <>
      <video
        key={`${src}#${attempt}`}
        ref={videoRef}
        src={src}
        aria-label={label}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onError={() => setFailed(true)}
      />
      {!failed && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={paused ? 'Play video' : 'Pause video'}
          className={`absolute inset-y-0 z-[5] ${hasNeighbours ? 'left-1/3 right-1/3' : 'inset-x-0'}`}
        />
      )}
      {paused && !failed && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[6] flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white">
          <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
        </span>
      )}
      {!failed && (
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute left-4 top-[56px] z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          {muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
        </button>
      )}
      {failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center text-white">
          <p className="text-[15px] font-bold">Couldn&apos;t load this video</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setAttempt((value) => value + 1)
            }}
            className="rounded-full bg-white px-5 py-2.5 text-[14px] font-extrabold text-[var(--navy)]"
          >
            Try again
          </button>
        </div>
      )}
    </>
  )
}

/** Small preview tile. Videos can't go in an <img>, so they get a play tile. */
function MomentThumb({ moment }: { moment: Moment }) {
  const [broken, setBroken] = useState(false)
  if (moment.type === 'video' || !moment.url || broken) {
    return (
      <span className="flex size-full items-center justify-center bg-[var(--navy)] text-white">
        <Play className="size-3 fill-current" aria-hidden="true" />
      </span>
    )
  }
  return <img src={moment.url} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
}

const momentTime = (moment: Moment) => new Date(moment.uploadedAt || 0).getTime()

export default function PactMomentsDetail({
  pact,
  moments,
  participants,
  progress,
  cheerCount,
  isEnded,
  canCheer,
  hasCheered,
  currentUserId,
  onInvite,
  onAddMoment,
  onRestart,
  onShareRecap,
}: Props) {
  // null means "follow the newest moment" until the person picks one.
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [watchingRecap, setWatchingRecap] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const fallbackCompleted = progress?.completed || 0
  const completionView = resolvePactCompletionViewState(pact, new Date(), fallbackCompleted)
  const completionLooksSuccessful = completionView === 'completed' || completionView === 'provisional_completed'
  const presentationEnded = completionView !== null
  const visualDayEnded = presentationEnded || isEnded
  const strip = Array.isArray(pact?.day_strip) ? (pact.day_strip as PactDayStripEntry[]) : null
  const total = Math.max(1, Number(strip ? pact?.duration_days ?? progress?.total ?? 7 : progress?.total ?? 7))
  const completed = Math.min(total, Number(pact?.days_completed ?? fallbackCompleted))
  const missed = progress?.missed || 0
  const localToday = (() => {
    try {
      return pactLocalToday(pact)
    } catch {
      return new Date().toISOString().slice(0, 10)
    }
  })()
  const currentDay = strip && pact?.start_date
    ? Math.min(total, Math.max(1, Math.floor((Date.parse(`${localToday}T00:00:00Z`) - Date.parse(`${pact.start_date}T00:00:00Z`)) / 86400000) + 1))
    : Math.min(total, completed + missed + 1)
  const day = presentationEnded ? total : currentDay
  const percent = total ? Math.round((completed / total) * 100) : 0
  const daysLeft = Math.max(0, total - currentDay)
  const dayLabel = presentationEnded ? 'Ended' : daysLeft === 0 ? 'Last day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to go`
  const visiblePeople = participants.slice(0, 3)
  const overflow = Math.max(0, participants.length - 3)
  // One ordered list (oldest to newest, left to right like the day strip). Days the
  // strip knows about but the proofs list doesn't (it is capped) are added from
  // the strip's own media URLs so those chips still play something.
  const displayMoments = useMemo(() => {
    const real = [...moments]
    const haveDays = new Set(real.map((moment) => moment.day).filter((value) => value != null))
    const fromStrip: Moment[] = []
    for (const entry of strip ?? []) {
      if (!entry.has_moment || haveDays.has(entry.day)) continue
      const isVideo = entry.type === 'video'
      const url = isVideo ? entry.video_url : entry.thumbnail_url
      if (!url) continue
      fromStrip.push({ id: `strip-${entry.day}`, url, type: isVideo ? 'video' : 'image', day: entry.day, uploadedAt: `${entry.date}T12:00:00Z`, userId: null })
    }
    return [...real, ...fromStrip].sort((left, right) => momentTime(left) - momentTime(right) || String(left.id).localeCompare(String(right.id)))
  }, [moments, strip])
  const hasMoments = displayMoments.length > 0
  const safeIndex = hasMoments ? Math.min(activeIndex ?? displayMoments.length - 1, displayMoments.length - 1) : -1
  const current = hasMoments ? displayMoments[safeIndex] : undefined
  const caption = current?.description || "Today's moment"
  const showModernStrip = strip !== null && strip.length > 0
  const commentCount = liveCommentCount ?? Number(pact?.comment_count ?? 0)

  const authorId = current?.userId ?? pact?.creator_id
  const authorName = (() => {
    if (authorId != null && currentUserId != null && Number(authorId) === Number(currentUserId)) return 'You'
    const match = participants.find((person) => Number(person?.id ?? person?.user_id) === Number(authorId))
    return match?.username || match?.full_name || (Number(authorId) === Number(pact?.creator_id) ? pact?.creator_username : null) || 'Member'
  })()

  const step = (amount: number) => {
    if (displayMoments.length < 2) return
    setActiveIndex((safeIndex + amount + displayMoments.length) % displayMoments.length)
  }

  const momentIndexForDay = (dayNumber: number) => {
    for (let index = displayMoments.length - 1; index >= 0; index -= 1) {
      if (displayMoments[index].day === dayNumber) return index
    }
    return -1
  }

  const openDay = (dayNumber: number) => {
    const index = momentIndexForDay(dayNumber)
    if (index < 0) return
    setActiveIndex(index)
    if (presentationEnded) setWatchingRecap(true)
  }

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const delta = (event.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1)
  }

  const footerWindowStart = Math.min(Math.max(0, safeIndex - 1), Math.max(0, displayMoments.length - 3))
  const footerMoments = displayMoments.slice(footerWindowStart, footerWindowStart + 3)

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5 text-[var(--ink)]">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
        {showModernStrip ? (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }} aria-label="Pact day strip">
            {strip.map((entry) => {
              const isToday = !visualDayEnded && entry.date === localToday
              const isPast = entry.date < localToday
              const isDashed = presentationEnded ? !entry.has_moment : isPast && !entry.has_moment
              const hasPhotoThumbnail = entry.has_moment && entry.type === 'photo' && Boolean(entry.thumbnail_url)
              const isPlayTile = entry.has_moment && !hasPhotoThumbnail
              const hasPlayableMoment = momentIndexForDay(entry.day) >= 0
              const isSelected = !!current && current.day === entry.day
              return (
                <button
                  key={entry.day}
                  type="button"
                  disabled={!hasPlayableMoment}
                  onClick={() => openDay(entry.day)}
                  aria-pressed={isSelected}
                  aria-label={`Day ${entry.day}${entry.has_moment ? ', moment shared' : isToday ? ', today' : isPast ? ', missed' : ', upcoming'}`}
                  className={`relative aspect-square overflow-hidden rounded-[9px] p-0 transition active:scale-95 disabled:cursor-default disabled:active:scale-100 ${isPlayTile ? 'bg-[var(--navy)]' : 'bg-[var(--card-muted)]'} ${isSelected ? 'ring-2 ring-[var(--navy)] ring-offset-2' : isToday ? 'ring-1 ring-[var(--navy)]/60 ring-offset-1' : ''} ${isDashed ? 'border-2 border-dashed border-[var(--missed-border)] bg-transparent' : ''}`}
                >
                  {hasPhotoThumbnail ? (
                    <img src={entry.thumbnail_url ?? undefined} alt="" className="size-full object-cover" />
                  ) : isPlayTile ? (
                    <span className="flex size-full items-center justify-center text-[var(--card)]">
                      <Play className="size-4 fill-current" aria-hidden="true" />
                    </span>
                  ) : null}
                  {hasPhotoThumbnail && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />}
                  <span className={`absolute inset-x-0 bottom-1 z-10 text-center text-[10px] font-extrabold leading-3 ${hasPhotoThumbnail || isPlayTile ? 'text-white' : 'text-[var(--navy)]'}`}>DAY {entry.day}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-[5px]" aria-label={`${total} pact days`}>
            {Array.from({ length: total }).map((_, index) => {
              const isDone = index < completed
              const isToday = !visualDayEnded && index === currentDay - 1
              return (
                <span key={index} className="flex h-1 flex-1 overflow-hidden rounded-[2px] bg-[var(--hairline)]">
                  {isDone ? (
                    <span className="h-full w-full bg-[var(--navy)]" />
                  ) : isToday ? (
                    <span className="h-full w-1/2 bg-[var(--navy)]" />
                  ) : !isEnded && index < currentDay - 1 ? (
                    <span className="h-full w-full border border-dashed border-[var(--missed-border)] bg-transparent" />
                  ) : null}
                </span>
              )
            })}
          </div>
        )}

        {!presentationEnded && <header className="flex items-center gap-3">
          <div
            role="img"
            aria-label={`${completed} of ${total} days done`}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(var(--navy) ${percent * 3.6}deg, var(--hairline) 0deg)` }}
          >
            <span className="flex size-[35px] items-center justify-center rounded-full bg-[var(--card)] text-[11px] font-extrabold">
              {percent}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="whitespace-nowrap text-[20px] font-extrabold leading-6">Day {day} of {total}</h1>
            <p className="whitespace-nowrap text-[13px] font-semibold leading-[18px] text-[var(--muted)]">{dayLabel}</p>
          </div>
          <div className="flex items-center">
            {!presentationEnded && visiblePeople.map((person, index) => (
              <Avatar key={person.id || person.user_id || index} person={person} index={index} />
            ))}
            {!presentationEnded && overflow > 0 && (
              <span className="-ml-2 flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--card-muted)] text-[11px] font-bold">
                +{overflow}
              </span>
            )}
            {!presentationEnded && <button
              type="button"
              onClick={onInvite}
              aria-label="Invite someone"
              className="ml-1 flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)]"
            >
              <UserPlus className="size-5" />
            </button>}
          </div>
        </header>}

        <section
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`relative min-h-0 flex-1 touch-pan-y overflow-hidden rounded-[24px] ${!hasMoments && !presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : presentationEnded ? 'bg-[linear-gradient(160deg,#F4B26A_0%,#E4684F_48%,#5B3A78_100%)]' : 'bg-[var(--navy)]'}`}
          aria-label="Moments"
        >
          {!hasMoments && (
            <>
              <div className="absolute left-[60px] top-0 size-[190px] rounded-full bg-[#FFE3A8]/90" />
              <div className={`absolute bottom-0 left-[-20px] right-[-20px] h-[210px] rounded-[50%_50%_0_0] ${completionView === 'partial' || completionView === 'provisional_not_completed' ? 'bg-[#3C2650]' : 'bg-[#3C2650]'}`} />
              <div className="absolute inset-x-0 bottom-0 h-[190px] bg-[linear-gradient(180deg,rgba(18,19,26,0)_0%,rgba(18,19,26,0.72)_100%)]" />
            </>
          )}
          {hasMoments && <div className="absolute inset-x-0 bottom-0 h-[190px] bg-[linear-gradient(180deg,rgba(18,19,26,0)_0%,rgba(18,19,26,0.72)_100%)]" />}

          {presentationEnded && !watchingRecap ? (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center text-white ${completionView === 'partial' || completionView === 'provisional_not_completed' || completionView === 'empty' ? 'bg-[linear-gradient(180deg,rgba(18,19,26,0.72)_0%,rgba(18,19,26,0.72)_100%)]' : ''}`}>
              {completionLooksSuccessful ? (
                <>
                  <span className="mb-3 flex size-12 items-center justify-center rounded-full border-[3px] border-white text-white">
                    <Check className="size-6" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div className="mb-3 text-center">
                    <h2 className="text-[28px] font-extrabold leading-8 text-white">Completed</h2>
                    <p className="mt-1 text-[17px] font-bold text-white">{completed} of {total} days</p>
                  </div>
                  <button type="button" aria-label="Watch recap" onClick={() => { setActiveIndex(0); setWatchingRecap(true) }} className="mt-9 flex size-24 items-center justify-center rounded-full bg-white text-[var(--navy)] shadow-[0_0_0_10px_rgba(255,255,255,0.28),0_0_0_22px_rgba(255,255,255,0.14)]">
                    <Play className="ml-1 size-10 fill-current" aria-hidden="true" />
                  </button>
                  <span className="mt-5 text-[13px] font-bold text-white">Watch recap</span>
                </>
              ) : completionView === 'partial' || completionView === 'provisional_not_completed' ? (
                <>
                  <h2 className="text-[28px] font-extrabold leading-8 text-white">Ended</h2>
                  <p className="mt-1 text-[17px] font-bold text-white">{completed} of {total} days done</p>
                  <button type="button" onClick={() => { setActiveIndex(0); setWatchingRecap(true) }} className="mt-6 rounded-full border border-white/80 px-5 py-3 text-[15px] font-extrabold text-white">
                    Watch your moments
                  </button>
                </>
              ) : (
                <>
                  <span className="mb-5 flex size-20 items-center justify-center rounded-full border-2 border-dashed border-white text-white">
                    <ImageIcon className="size-9" aria-hidden="true" />
                  </span>
                  <h2 className="text-[26px] font-extrabold leading-8 text-white">Nothing was shared</h2>
                  <p className="mt-2 max-w-[260px] text-[16px] font-semibold leading-5 text-white">This pact ended without moments</p>
                </>
              )}
            </div>
          ) : (
            <>
          {presentationEnded && watchingRecap && (
            <button type="button" onClick={() => { setWatchingRecap(false); setActiveIndex(null) }} aria-label="Close recap" className="absolute right-4 top-4 z-30 flex size-11 items-center justify-center rounded-full bg-white text-[var(--navy)]">
              <X className="size-5" />
            </button>
          )}
          {hasMoments && current?.url && (
            current.type === 'video' ? (
              <MomentVideo src={current.url} label={caption} hasNeighbours={displayMoments.length > 1} />
            ) : (
              <img src={current.url} alt={caption} className="absolute inset-0 size-full object-cover" />
            )
          )}

          {hasMoments && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          )}

          {hasMoments && (
            <>
              {displayMoments.length > 1 && (
                <>
                  <button type="button" aria-label="Previous moment" onClick={() => step(-1)} className="absolute inset-y-0 left-0 w-1/3" />
                  <button type="button" aria-label="Next moment" onClick={() => step(1)} className="absolute inset-y-0 right-0 w-1/3" />
                </>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--card)] text-[10px] text-[var(--ink)]">
                  {String(authorName).charAt(0).toUpperCase()}
                </span>
                {authorName}{current?.day ? ` - Day ${current.day}` : ''}
              </div>
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-10 flex flex-col gap-2">
                <CheerButton
                  pactId={Number(pact.id)}
                  canCheer={canCheer}
                  hasCheered={hasCheered}
                  variant="stage"
                  cheerCount={cheerCount}
                />
                <button
                  type="button"
                  onClick={() => setCommentOpen(true)}
                  aria-label={commentCount > 0 ? `Comments, ${commentCount}` : 'Comment on this moment'}
                  className="flex size-12 flex-col items-center justify-center gap-0.5 rounded-full bg-[var(--card)] text-[var(--ink)] shadow-lg active:scale-95"
                >
                  <MessageCircle className="size-4" />
                  <span className="text-[11px] font-bold leading-none">{commentCount}</span>
                </button>
              </div>
              <div className="pointer-events-none absolute bottom-5 left-5 right-[84px] z-10 text-white">
                {pact?.title && <p className="truncate text-[12px] font-bold uppercase tracking-wide opacity-80">{pact.title}</p>}
                <p className="mt-0.5 text-[17px] font-extrabold leading-[22px]">{caption}</p>
              </div>
            </>
          )}

          {!hasMoments && !isEnded && (
            <div className="absolute inset-0 z-10 px-5 text-center text-white">
              <button type="button" aria-label="Add a moment" onClick={onAddMoment} className="absolute left-1/2 top-[100px] flex size-[104px] -translate-x-1/2 items-center justify-center rounded-full border-0 bg-[var(--navy)] text-white shadow-[0_0_0_10px_rgba(255,255,255,0.28),0_0_0_22px_rgba(255,255,255,0.14)]">
                <Plus className="size-11" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className="absolute left-0 right-0 top-[232px] text-[24px] font-extrabold tracking-[-0.4px] text-white">Add a moment</div>
              <div className="absolute inset-x-5 bottom-[22px] text-left text-white">
                <div className="text-[12px] font-bold opacity-80">No moments yet</div>
                <div className="mt-0.5 text-[17px] font-extrabold leading-[22px]">Make something worth showing.</div>
              </div>
            </div>
          )}

          {!hasMoments && isEnded && !presentationEnded && (
            <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-white">
              <p className="text-[17px] font-semibold">No moments yet</p>
            </div>
          )}
            </>
          )}
        </section>

        {(hasMoments || isEnded || presentationEnded) && (
          <footer className="flex min-h-14 flex-wrap items-center gap-2">
            {presentationEnded && completionLooksSuccessful && !watchingRecap ? (
              <>
                <button type="button" onClick={onShareRecap} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-extrabold text-white">
                  <Share2 className="size-5" />
                  Share recap
                </button>
                <button type="button" onClick={onRestart} aria-label="Start again" className="flex size-12 items-center justify-center rounded-full bg-[var(--navy)] text-white">
                  <RotateCcw className="size-5" />
                </button>
              </>
            ) : presentationEnded && !completionLooksSuccessful ? (
              <button type="button" onClick={onRestart} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white">
                Start again
              </button>
            ) : presentationEnded && watchingRecap ? (
              <>
                <button type="button" onClick={() => { setWatchingRecap(false); setActiveIndex(null) }} aria-label="Close recap" className="flex size-12 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--navy)]">
                  <span aria-hidden="true">×</span>
                </button>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
                  {displayMoments.map((moment, index) => (
                    <button key={moment.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Open recap moment ${index + 1}`} className={`relative size-8 shrink-0 overflow-hidden rounded-md bg-[var(--card-muted)] ${index === safeIndex ? 'border-2 border-[var(--navy)]' : ''}`}>
                      <MomentThumb moment={moment} />
                    </button>
                  ))}
                </div>
              </>
            ) : hasMoments ? (
              <div className="flex min-w-0 flex-1 basis-[calc(100%-170px)] gap-1.5 overflow-hidden max-[340px]:basis-full">
                {footerMoments.map((moment, offset) => {
                  const index = footerWindowStart + offset
                  return (
                    <button
                      key={moment.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Open moment ${index + 1}`}
                      className={`relative size-7 shrink-0 overflow-hidden rounded-md bg-[var(--card-muted)] ${index === safeIndex ? 'border-2 border-[var(--navy)]' : ''}`}
                    >
                      <MomentThumb moment={moment} />
                    </button>
                  )
                })}
                {displayMoments.length > 3 && (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--card-muted)] text-[10px] font-extrabold">
                    +{displayMoments.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-1" />
            )}
            {!presentationEnded && hasMoments && !isEnded && (
              <button
                type="button"
                onClick={onAddMoment}
                aria-label="Add a moment"
                className="ml-auto flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white"
              >
                <Camera className="size-5" aria-hidden="true" />
                Add a moment
              </button>
            )}
          </footer>
        )}
      </div>
      {pact?.id != null && (
        <CommentsBottomSheet
          pactId={Number(pact.id)}
          commentCount={commentCount}
          isOpen={commentOpen}
          onClose={() => setCommentOpen(false)}
          onCountChange={setLiveCommentCount}
        />
      )}
    </main>
  )
}
