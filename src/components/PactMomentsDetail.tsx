'use client'

import { useState } from 'react'
import { Camera, MessageCircle, UserPlus } from 'lucide-react'
import CheerButton from '@/components/CheerButton'

type Moment = {
  id: number | string
  url?: string
  type?: string
  description?: string
  day?: number
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
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMoments = moments.length > 0
  const current = moments[activeIndex] || moments[0]
  const total = progress?.total || 7
  const completed = progress?.completed || 0
  const missed = progress?.missed || 0
  const currentDayIndex = completed + missed
  const day = isEnded ? total : Math.min(total, currentDayIndex + 1)
  const percent = total ? Math.round((completed / total) * 100) : 0
  const daysLeft = Math.max(0, total - day)
  const dayLabel = isEnded ? 'Ended' : daysLeft === 0 ? 'Last day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
  const visiblePeople = participants.slice(0, 3)
  const overflow = Math.max(0, participants.length - 3)
  const caption = current?.description || "Today's moment"

  const step = (amount: number) => {
    if (moments.length < 2) return
    setActiveIndex((index) => (index + amount + moments.length) % moments.length)
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5 text-[var(--ink)]">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
        <div className="flex gap-[5px]" aria-label={`${total} pact days`}>
          {Array.from({ length: total }).map((_, index) => {
            const isDone = index < completed
            const isToday = !isEnded && index === currentDayIndex
            return (
              <span key={index} className="flex h-1 flex-1 overflow-hidden rounded-[2px] bg-[var(--hairline)]">
                {isDone ? (
                  <span className="h-full w-full bg-[var(--navy)]" />
                ) : isToday ? (
                  <>
                    <span className="h-full w-1/2 bg-[var(--navy)]" />
                    <span className="h-full w-1/2 bg-[var(--hairline)]" />
                  </>
                ) : null}
              </span>
            )
          })}
        </div>

        <header className="flex items-center gap-3">
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
            {visiblePeople.map((person, index) => (
              <Avatar key={person.id || person.user_id || index} person={person} index={index} />
            ))}
            {overflow > 0 && (
              <span className="-ml-2 flex size-[34px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--card-muted)] text-[11px] font-bold">
                +{overflow}
              </span>
            )}
            <button
              type="button"
              onClick={onInvite}
              aria-label="Invite someone"
              className="ml-1 flex size-11 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--card)]"
            >
              <UserPlus className="size-5" />
            </button>
          </div>
        </header>

        <section
          className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] bg-[var(--navy)]"
          aria-label="Moments"
        >
          <div className="absolute left-[20%] top-[13%] size-56 rounded-full bg-[var(--navy-hover)]/40" />
          <div className="absolute bottom-0 left-[-5%] right-[-5%] h-[35%] rounded-[50%_50%_0_0] bg-[var(--navy-hover)]" />

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
              {moments.length > 1 && (
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

          {!hasMoments && isEnded && (
            <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-white">
              <p className="text-[17px] font-semibold">No moments yet</p>
            </div>
          )}
        </section>

        {(hasMoments || isEnded) && (
          <footer className="flex min-h-14 flex-wrap items-center gap-2">
            {hasMoments ? (
              <div className="flex min-w-0 flex-1 basis-[calc(100%-170px)] gap-1.5 overflow-hidden max-[340px]:basis-full">
                {moments.slice(0, 3).map((moment, index) => (
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
                {moments.length > 3 && (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--card-muted)] text-[10px] font-extrabold">
                    +{moments.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-1" />
            )}
            {hasMoments && !isEnded && (
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
