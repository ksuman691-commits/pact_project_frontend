'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'
import DetailPageHeader from '@/components/DetailPageHeader'
import StoryViewer from '@/components/stories/StoryViewer'
import { useCircles } from '@/hooks/useCircles'
import { useCircleStoriesToday } from '@/hooks/useStories'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { isPhotoStory, monogram, postedAgo, STORIES_COMING_SOON, STORIES_ENABLED, type PactStory } from '@/lib/stories'

interface MomentCircle {
  id: number
  name: string
}

interface Viewing {
  circle: MomentCircle
  stories: PactStory[]
  index: number
}

function clock(seconds?: number | null) {
  if (typeof seconds !== 'number' || seconds <= 0) return null
  const s = Math.round(seconds)
  return `0:${String(s % 60).padStart(2, '0')}`
}

function MomentTile({ story, onOpen }: { story: PactStory; onOpen: () => void }) {
  const unseen = story.seen === false
  const ago = postedAgo(story.created_at)
  const photo = isPhotoStory(story)
  const length = photo ? null : clock(story.duration_seconds)
  const who = story.name || 'Someone'
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${photo ? 'See' : 'Watch'} ${who}'s moment${ago ? `, ${ago}` : ''}${unseen ? ', new' : ''}`}
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-[var(--card-muted)] text-left transition active:scale-[0.98] ${
        unseen ? 'ring-[3px] ring-[var(--navy)] ring-offset-2 ring-offset-[var(--paper)]' : 'border border-[var(--hairline)]'
      }`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.video_url} alt="" aria-hidden="true" loading="lazy" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      ) : (
        // The first frame stands in as a thumbnail; browsers that won't paint one just show the tinted tile.
        <video
          src={`${story.video_url}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" aria-hidden="true" />
      {!photo && (
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--navy)] text-white" aria-hidden="true">
          <Play className="h-5 w-5 translate-x-px" fill="currentColor" />
        </span>
      )}
      {length && (
        <span className="absolute right-2.5 top-2.5 rounded-[10px] bg-[var(--ink)]/75 px-2 py-0.5 text-[11.5px] font-bold text-white" aria-hidden="true">
          {length}
        </span>
      )}
      {unseen && (
        <span className="absolute left-2.5 top-2.5 rounded-[10px] bg-[var(--navy)] px-2 py-0.5 text-[11.5px] font-bold text-white" aria-hidden="true">
          New
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 text-white">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--card)] text-[11px] font-bold text-[var(--navy)]">
          {story.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            monogram(story.name)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold leading-tight">{who}</span>
          {ago && <span className="block truncate text-[11.5px] leading-tight text-white/80">{ago}</span>}
        </span>
      </span>
    </button>
  )
}

function CircleMoments({ circle, onOpen }: { circle: MomentCircle; onOpen: (viewing: Viewing) => void }) {
  const { stories, isLoading, unavailable } = useCircleStoriesToday(circle.id)
  const unseenCount = stories.filter((s) => s.seen === false).length
  const status = unavailable ? '' : isLoading ? '' : unseenCount > 0 ? `${unseenCount} new` : stories.length > 0 ? 'Seen' : 'Quiet'

  return (
    <section aria-label={`${circle.name} moments`} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="min-w-0 truncate text-[17px] font-bold tracking-[-0.01em] text-[var(--ink)]">{circle.name}</h2>
        {status && <span className={`shrink-0 text-[13px] ${unseenCount > 0 ? 'font-bold text-[var(--navy)]' : 'text-[var(--muted)]'}`}>{status}</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading moments">
          {[0, 1].map((i) => (
            <div key={i} className="pact-shimmer aspect-[3/4] rounded-[20px]" />
          ))}
        </div>
      ) : unavailable ? (
        <div className="rounded-[20px] border border-dashed border-[var(--seat-border)] px-4 py-5 text-[13px] text-[var(--muted)]">{STORIES_COMING_SOON}.</div>
      ) : stories.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--seat-border)] px-4 py-5 text-center">
          <div className="text-[14px] font-bold text-[var(--ink)]">Nothing shared today</div>
          <div className="mt-1 text-[12.5px] text-[var(--muted)]">Moments from {circle.name} show up here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stories.map((story, index) => (
            <MomentTile key={story.id} story={story} onOpen={() => onOpen({ circle, stories, index })} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function MomentsPage() {
  const { user, isInitialized } = useRequireAuth()
  const circlesQuery = useCircles(isInitialized && !!user)
  const circles = (circlesQuery.data || []) as MomentCircle[]
  const [viewing, setViewing] = useState<Viewing | null>(null)

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <DetailPageHeader title="Moments" fallbackHref="/feed" showHomeLink={false} maxWidthClassName="max-w-md" />
      <div className="mx-auto flex max-w-md flex-col gap-7 px-4 pt-5">
        <div className="px-1">
          <h1 className="text-[28px] font-bold leading-none tracking-[-0.03em]">Today&apos;s moments</h1>
          <p className="mt-2 text-[14px] text-[var(--muted)]">What your circles shared today.</p>
        </div>

        {!STORIES_ENABLED ? (
          <div className="rounded-[20px] border border-dashed border-[var(--seat-border)] px-4 py-6 text-[14px] text-[var(--muted)]">{STORIES_COMING_SOON}.</div>
        ) : circlesQuery.isLoading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading circles">
            <div className="pact-shimmer h-5 w-1/3 rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="pact-shimmer aspect-[3/4] rounded-[20px]" />
              <div className="pact-shimmer aspect-[3/4] rounded-[20px]" />
            </div>
          </div>
        ) : circles.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-5">
            <div className="text-[15px] font-bold">No circles yet</div>
            <div className="mt-1 text-[13px] text-[var(--muted)]">Join or start a circle to see its moments here.</div>
            <Link href="/circles" className="mt-3 inline-flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white">
              Browse circles
            </Link>
          </div>
        ) : (
          circles.map((circle) => <CircleMoments key={circle.id} circle={circle} onOpen={setViewing} />)
        )}
      </div>

      <StoryViewer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        stories={viewing?.stories ?? []}
        startIndex={viewing?.index ?? 0}
        circleId={viewing?.circle.id}
        circleName={viewing?.circle.name}
      />
    </main>
  )
}
