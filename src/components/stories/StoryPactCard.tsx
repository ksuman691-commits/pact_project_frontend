'use client'

import Link from 'next/link'
import CircleChip, { PersonalPactLabel } from '@/components/classic/CircleChip'
import { hoursUntil, STORIES_COMING_SOON, type PactStory } from '@/lib/stories'
import DayMarks, { dayLine, marksFromCount } from './DayMarks'
import PostStoryButton from './PostStoryButton'

interface StoryPactCardProps {
  pact: any
  myUserId?: number
  stories: PactStory[] | undefined
  storiesUnavailable: boolean
  onPost: () => void
}

function memberCountOf(pact: any): number | null {
  const raw = pact.participants_count ?? pact.current_participants ?? (Array.isArray(pact.participants) ? pact.participants.length : null)
  const n = Number(raw)
  return raw != null && Number.isFinite(n) && n > 0 ? n : null
}

export default function StoryPactCard({ pact, myUserId, stories, storiesUnavailable, onPost }: StoryPactCardProps) {
  const summary = marksFromCount(pact)
  const mine = myUserId != null ? stories?.find((s) => s.user_id === myUserId) : undefined
  const posted = Boolean(mine)
  const hoursLeft = mine ? hoursUntil(mine.expires_at) : null
  const members = memberCountOf(pact)
  const postersToday = stories ? new Set(stories.map((s) => s.user_id)).size : null

  const note = storiesUnavailable
    ? `${STORIES_COMING_SOON}.`
    : posted
      ? hoursLeft != null
        ? `Your story expires in ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}`
        : null
      : stories
        ? 'No story from you yet today.'
        : null
  const circleLine = pact.circle_id != null && members != null && postersToday != null ? `${postersToday} of ${members} posted today` : null

  return (
    <article className="relative flex items-center gap-4 rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] p-4">
      <Link href={`/pacts/${pact.id}`} className="absolute inset-0 rounded-[6px]" aria-label={`Open ${pact.title}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="relative z-10 self-start">
          {pact.circle_id != null && pact.circle_name ? (
            <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="muted" />
          ) : (
            <PersonalPactLabel />
          )}
        </div>
        <h2 className="text-pretty text-[21px] font-bold leading-[1.15] tracking-[-0.025em]">{pact.title}</h2>
        {summary && <p className="text-[14px] text-[var(--ink)]">{dayLine(summary)}</p>}
        {summary && summary.marks.length > 0 && <DayMarks marks={summary.marks} size={8} />}
        {(note || circleLine) && (
          <p className="text-[13px] text-[var(--muted)]">
            {[note, circleLine].filter(Boolean).join('. ')}
          </p>
        )}
      </div>
      <div className="relative z-10">
        <PostStoryButton size={92} posted={posted} comingSoon={storiesUnavailable} onClick={onPost} postedHref={`/pacts/${pact.id}`} />
      </div>
    </article>
  )
}
