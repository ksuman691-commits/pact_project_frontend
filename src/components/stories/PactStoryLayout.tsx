'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, UserPlus } from 'lucide-react'
import CircleChip, { PersonalPactLabel } from '@/components/classic/CircleChip'
import { usePactStoriesToday } from '@/hooks/useStories'
import type { PactStory } from '@/lib/stories'
import DayMarks, { DayMarksKey, dayLine, marksFromCount, marksFromProofDays } from './DayMarks'
import PostStoryButton from './PostStoryButton'
import StoryCaptureSheet from './StoryCaptureSheet'
import StoryRing from './StoryRing'
import StoryViewer from './StoryViewer'

interface PactStoryLayoutProps {
  pact: any
  proofs: Array<{ day?: number | null }>
  memberCount: number
  isParticipant: boolean
  myUserId?: number
  onBack: () => void
  onInvite: () => void
  /** Join card / join-requests row the page already renders for non-members and creators. */
  children?: ReactNode
}

function groupByPoster(stories: PactStory[]) {
  const groups = new Map<number, { first: number; story: PactStory; count: number }>()
  stories.forEach((story, i) => {
    const existing = groups.get(story.user_id)
    if (existing) existing.count++
    else groups.set(story.user_id, { first: i, story, count: 1 })
  })
  return Array.from(groups.values())
}

export default function PactStoryLayout({ pact, proofs, memberCount, isParticipant, myUserId, onBack, onInvite, children }: PactStoryLayoutProps) {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [viewerStart, setViewerStart] = useState<number | null>(null)
  const today = usePactStoriesToday(pact.id, isParticipant)
  const stories = useMemo(
    () => [...(today.data ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [today.data],
  )
  const posters = useMemo(() => groupByPoster(stories), [stories])
  const myFirstIndex = myUserId != null ? stories.findIndex((s) => s.user_id === myUserId) : -1
  const summary = marksFromProofDays(pact, proofs) ?? marksFromCount(pact)
  const audience = pact.circle_name ? `Only ${pact.circle_name} sees this.` : 'Only people in this pact see this.'
  const memberLine = memberCount > 0 ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}. ` : ''

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-36 text-[var(--ink)]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} aria-label="Go back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)]">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onInvite}
            className="flex h-9 items-center gap-1.5 rounded-full border border-[var(--hairline)] px-3.5 text-[13px] font-semibold text-[var(--ink)]"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Invite
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {pact.circle_id != null && pact.circle_name ? (
            <CircleChip circleId={pact.circle_id} circleName={pact.circle_name} variant="lead" />
          ) : (
            <PersonalPactLabel />
          )}
          <h1 className="text-balance text-[40px] font-bold leading-[1.02] tracking-[-0.035em]">{pact.title}</h1>
          {summary && <p className="text-[16px] font-medium">{dayLine(summary)}</p>}
        </div>

        {summary && summary.marks.length > 0 && (
          <div className="flex flex-col gap-3">
            <DayMarks marks={summary.marks} />
            <DayMarksKey />
          </div>
        )}

        {children}

        {isParticipant && (
          <section className="flex flex-col items-center gap-3 pt-2 text-center" aria-label="Today's story">
            <PostStoryButton
              size={176}
              posted={myFirstIndex >= 0}
              comingSoon={today.unavailable}
              onClick={() => setCaptureOpen(true)}
              onPostedClick={() => setViewerStart(myFirstIndex)}
            />
            <div className="flex flex-col gap-0.5 text-[14px] text-[var(--muted)]">
              <p>{audience}</p>
              <p>{memberLine}Short video, up to 15 seconds.</p>
            </div>
          </section>
        )}

        {isParticipant && (
          <section className="flex flex-col gap-3" aria-label="Today in this pact">
            <h2 className="text-[13px] font-semibold text-[var(--muted)]">Today in this pact</h2>
            {posters.length > 0 ? (
              <ul className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1">
                {posters.map(({ story, first, count }) => (
                  <li key={story.user_id}>
                    <button type="button" onClick={() => setViewerStart(first)} className="flex w-[72px] flex-col items-center gap-1.5">
                      <StoryRing state={story.seen === true ? 'seen' : story.seen === false ? 'unseen' : 'none'} size={64} name={story.name} imageUrl={story.avatar_url} />
                      <span className="w-full truncate text-[12px] font-medium">{story.user_id === myUserId ? 'You' : story.name || 'Member'}</span>
                      {count > 1 && <span className="text-[11px] text-[var(--muted)]">{count} stories</span>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[6px] border border-dashed border-[var(--seat-border)] px-4 py-5 text-center text-[14px] text-[var(--muted)]">
                {today.unavailable ? 'Stories are coming soon.' : today.isLoading ? 'Loading today’s stories…' : today.isError ? "Couldn't load today's stories." : 'No stories yet today.'}
              </p>
            )}
          </section>
        )}
      </div>

      <StoryCaptureSheet isOpen={captureOpen} onClose={() => setCaptureOpen(false)} pactId={pact.id} pactTitle={pact.title} />
      <StoryViewer
        open={viewerStart !== null}
        onClose={() => setViewerStart(null)}
        stories={stories}
        startIndex={viewerStart ?? 0}
        circleId={pact.circle_id}
        circleName={pact.circle_name}
        isLoading={today.isLoading}
        unavailable={today.unavailable}
      />
    </main>
  )
}
