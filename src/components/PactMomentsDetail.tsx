'use client'

import { useState } from 'react'
import { Camera, Check, MessageCircle, Play, RotateCcw, Share2, UserPlus } from 'lucide-react'
import CheerButton from '@/components/CheerButton'
import { pactLocalToday, resolvePactCompletionViewState } from '@/lib/pactCompletionState'
import type { PactDayStripEntry } from '@/types'

type Moment = {
  id: number | string
  url?: string
  type?: string
  description?: string
  day?: number
  uploadedAt?: string
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

export default function PactMomentsDetail({
  pact,
  moments,
  participants,
  progress,
  cheerCount,
  isEnded,
  canCheer,
  hasCheered,
  onInvite,
  onAddMoment,
  onRestart,
  onShareRecap,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [watchingRecap, setWatchingRecap] = useState(false)
  const fallbackCompleted = progress?.completed || 0
  const completionView = resolvePactCompletionViewState(pact, new Date(), fallbackCompleted)
  const completionLooksSuccessful = completionView === 'completed' || completionView === 'provisional_completed'
  const presentationEnded = completionView !== null
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
  const recapMoments = [...moments].sort((left, right) => {
    const leftDay = left.day ?? 0
    const rightDay = right.day ?? 0
    if (leftDay !== rightDay) return leftDay - rightDay
    return new Date(left.uploadedAt || 0).getTime() - new Date(right.uploadedAt || 0).getTime()
  })
  const displayMoments = completionLooksSuccessful && watchingRecap ? recapMoments : moments
  const hasMoments = displayMoments.length > 0
  const current = displayMoments[activeIndex] || displayMoments[0]
  const caption = current?.description || "Today's moment"
  const showModernStrip = strip !== null

  const step = (amount: number) => {
    if (displayMoments.length < 2) return
    setActiveIndex((index) => (index + amount + displayMoments.length) % displayMoments.length)
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5 text-[var(--ink)]">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
        {showModernStrip ? (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }} aria-label="Pact day strip">
            {strip.map((entry) => {
              const isToday = !presentationEnded && entry.date === localToday
              const isPast = entry.date < localToday
              const isDashed = presentationEnded ? !entry.has_moment : isPast && !entry.has_moment
              return (
                <div
                  key={entry.day}
                  aria-label={`Day ${entry.day}${entry.has_moment ? ', moment shared' : isToday ? ', today' : isPast ? ', missed' : ', upcoming'}`}
                  className={`relative aspect-square overflow-hidden rounded-[9px] bg-[var(--card-muted)] ${isToday ? 'ring-2 ring-[var(--navy)] ring-offset-1' : ''} ${isDashed ? 'border-2 border-dashed border-[var(--missed-border)] bg-transparent' : ''}`}
                >
                  {entry.has_moment && entry.type === 'photo' && entry.thumbnail_url ? (
                    <img src={entry.thumbnail_url} alt="" className="size-full object-cover" />
                  ) : entry.has_moment ? (
                    <span className="flex size-full items-center justify-center bg-[var(--navy)] text-[var(--card)]">
                      <Play className="size-4 fill-current" aria-hidden="true" />
                    </span>
                  ) : null}
                  {isToday && <span className="absolute inset-x-0 bottom-0 bg-[var(--navy)] py-0.5 text-center text-[8px] font-bold text-white">TODAY</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-[5px]" aria-label={`${total} pact days`}>
            {Array.from({ length: total }).map((_, index) => {
              const isDone = index < completed
              const isToday = !presentationEnded && index === currentDay - 1
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
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]">
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
          className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[var(--navy)]"
          aria-label="Moments"
        >
          <div className="absolute left-[20%] top-[13%] size-56 rounded-full bg-[var(--navy-hover)]/40" />
          <div className="absolute bottom-0 left-[-5%] right-[-5%] h-[35%] rounded-[50%_50%_0_0] bg-[var(--navy-hover)]" />

          {presentationEnded && !(completionLooksSuccessful && watchingRecap) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--card)] px-6 text-center text-[var(--ink)]">
              {completionLooksSuccessful ? (
                <>
                  <span className="flex size-[72px] items-center justify-center rounded-full border-[7px] border-[var(--navy)] bg-[var(--card)] text-[var(--navy)]">
                    <Check className="size-8" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <h2 className="text-[25px] font-extrabold">Completed</h2>
                  <p className="text-[15px] font-semibold text-[var(--muted)]">{completed} of {total} days</p>
                </>
              ) : completionView === 'partial' || completionView === 'provisional_not_completed' ? (
                <>
                  <h2 className="text-[25px] font-extrabold">Ended</h2>
                  <p className="text-[15px] font-semibold text-[var(--muted)]">{completed} of {total} days done</p>
                </>
              ) : (
                <>
                  <h2 className="text-[25px] font-extrabold">Nothing was shared</h2>
                  <p className="max-w-[250px] text-[15px] font-semibold text-[var(--muted)]">This pact ended without moments</p>
                </>
              )}
            </div>
          ) : (
            <>
          {hasMoments && current?.url && (
            current.type === 'video' ? (
              <video src={current.url} className="absolute inset-0 size-full object-cover" muted playsInline />
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
                  {String(pact?.creator_username || 'Y').charAt(0).toUpperCase()}
                </span>
                You - Day {current.day || day}
              </div>
              <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-10 flex flex-col gap-2">
                <CheerButton
                  pactId={Number(pact.id)}
                  canCheer={canCheer}
                  hasCheered={hasCheered}
                  variant="stage"
                  cheerCount={cheerCount}
                />
                <button type="button" aria-label="Comment on this moment" className="flex size-12 items-center justify-center rounded-full bg-[var(--card)] text-[var(--ink)] shadow-lg">
                  <MessageCircle className="size-5" />
                </button>
              </div>
              <div className="absolute inset-x-5 bottom-5 z-10 text-white">
                <p className="mt-0.5 text-[17px] font-extrabold leading-[22px]">{caption}</p>
              </div>
            </>
          )}

          {!hasMoments && !isEnded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 text-center text-white">
              <button
                type="button"
                onClick={onAddMoment}
                className="flex min-h-[56px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--card)] px-4 text-[14px] font-bold text-[var(--navy)] shadow-lg"
              >
                <Camera className="size-5" aria-hidden="true" />
                Add a moment
              </button>
              <p className="text-[14px] opacity-85">No moments yet</p>
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
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(0)
                    setWatchingRecap(true)
                  }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  Watch recap
                </button>
                <button type="button" onClick={onShareRecap} aria-label="Share recap" className="flex size-12 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] text-[var(--navy)]">
                  <Share2 className="size-5" />
                </button>
                <button type="button" onClick={onRestart} aria-label="Start again" className="flex size-12 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)] text-[var(--navy)]">
                  <RotateCcw className="size-5" />
                </button>
              </>
            ) : presentationEnded && !completionLooksSuccessful ? (
              <button type="button" onClick={onRestart} className="h-12 w-full rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white">
                Start again
              </button>
            ) : presentationEnded && watchingRecap ? (
              <>
                <button type="button" onClick={() => setWatchingRecap(false)} aria-label="Close recap" className="flex size-12 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--navy)]">
                  <span aria-hidden="true">×</span>
                </button>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
                  {displayMoments.map((moment, index) => (
                    <button key={moment.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Open recap moment ${index + 1}`} className={`relative size-8 shrink-0 overflow-hidden rounded-md bg-[var(--card-muted)] ${index === activeIndex ? 'border-2 border-[var(--navy)]' : ''}`}>
                      {moment.url && moment.type !== 'video' ? <img src={moment.url} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center bg-[var(--navy)] text-white"><Play className="size-3 fill-current" /></span>}
                    </button>
                  ))}
                </div>
              </>
            ) : hasMoments ? (
              <div className="flex min-w-0 flex-1 basis-[calc(100%-170px)] gap-1.5 overflow-hidden max-[340px]:basis-full">
                {displayMoments.slice(0, 3).map((moment, index) => (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Open moment ${index + 1}`}
                    className={`relative size-7 shrink-0 overflow-hidden rounded-md bg-[var(--card-muted)] ${index === activeIndex ? 'border-2 border-[var(--navy)]' : ''}`}
                  >
                    {moment.url && <img src={moment.url} alt="" className="size-full object-cover" />}
                  </button>
                ))}
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
    </main>
  )
}
