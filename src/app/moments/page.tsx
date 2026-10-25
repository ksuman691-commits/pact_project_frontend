'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import DetailPageHeader from '@/components/DetailPageHeader'
import StoryViewer from '@/components/stories/StoryViewer'
import { RingFace } from '@/components/stories/StoryRing'
import { useCircles } from '@/hooks/useCircles'
import { useMomentPeople, type MomentPerson } from '@/hooks/useMomentPeople'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { postedAgo, STORIES_COMING_SOON, STORIES_ENABLED } from '@/lib/stories'

interface MomentCircle {
  id: number
  name: string
  stories_today_count?: number | null
}

function PersonRow({ person, onOpen }: { person: MomentPerson; onOpen: () => void }) {
  const ago = postedAgo(person.stories[person.stories.length - 1]?.created_at)
  const count = person.stories.length
  const inCircle = person.circleId != null
  const who = person.name || 'Member'
  const tag = inCircle ? `${person.circleName} Circle${person.isFollowing ? ' · Following' : ''}` : 'Following'
  return (
    <li className="border-b border-[var(--hairline)] last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${who}'s ${count === 1 ? 'moment' : 'moments'}${person.hasUnseen ? ', new' : ''}`}
        className="flex min-h-[64px] w-full items-center gap-3 px-3.5 py-2.5 text-left"
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-full p-[2.5px]"
          style={{ border: person.hasUnseen ? '2.5px solid var(--navy)' : '1.5px solid var(--hairline)' }}
        >
          <RingFace name={person.name} imageUrl={person.avatarUrl} size={40} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-extrabold text-[var(--ink)]">{who}</span>
          <span className="block truncate text-[12.5px] font-semibold text-[var(--muted)]">
            {count} {count === 1 ? 'moment' : 'moments'}
            {ago ? ` · ${ago}` : ''}
          </span>
          <span className={`block truncate text-[12px] font-extrabold ${inCircle ? 'text-[var(--navy)]' : 'text-[var(--ink)]'}`}>{tag}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
      </button>
    </li>
  )
}

function Group({ label, people, onOpen, navy }: { label: string; people: MomentPerson[]; onOpen: (p: MomentPerson) => void; navy?: boolean }) {
  if (people.length === 0) return null
  return (
    <section aria-label={label}>
      <h2 className={`px-0.5 pb-2 text-[12px] font-extrabold uppercase tracking-[0.07em] ${navy ? 'text-[var(--navy)]' : 'text-[var(--ink)]'}`}>
        {label} <span className="font-bold text-[var(--muted)]">{people.length}</span>
      </h2>
      <ul className="overflow-hidden rounded-[16px] border border-[var(--hairline)] bg-[var(--card)]">
        {people.map((person) => (
          <PersonRow key={person.userId} person={person} onOpen={() => onOpen(person)} />
        ))}
      </ul>
    </section>
  )
}

export default function MomentsPage() {
  const { user, isInitialized } = useRequireAuth()
  const circlesQuery = useCircles(isInitialized && !!user)
  const circles = useMemo(() => (circlesQuery.data || []) as MomentCircle[], [circlesQuery.data])
  const { people, isLoading } = useMomentPeople(circles, user?.id)
  const [viewing, setViewing] = useState<MomentPerson | null>(null)

  const fromCircles = people.filter((p) => p.circleId != null)
  const fromFollowing = people.filter((p) => p.circleId == null)
  const loading = circlesQuery.isLoading || isLoading

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <DetailPageHeader title="Moments" fallbackHref="/feed" showHomeLink={false} maxWidthClassName="max-w-md" />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-5">
        <div className="px-0.5">
          <h1 className="text-[28px] font-bold leading-none tracking-[-0.03em]">Moments</h1>
          <p className="mt-2 text-[14px] text-[var(--muted)]">
            Last 24 hours{!loading && people.length > 0 ? ` · ${people.length} ${people.length === 1 ? 'person' : 'people'}` : ''}
          </p>
        </div>

        {!STORIES_ENABLED ? (
          <div className="rounded-[20px] border border-dashed border-[var(--seat-border)] px-4 py-6 text-[14px] text-[var(--muted)]">{STORIES_COMING_SOON}.</div>
        ) : loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading moments">
            <div className="pact-shimmer h-4 w-1/3 rounded" />
            <div className="pact-shimmer h-[200px] rounded-[16px]" />
          </div>
        ) : people.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-5">
            <div className="text-[15px] font-bold">Nothing shared in the last 24 hours</div>
            <div className="mt-1 text-[13px] text-[var(--muted)]">Moments from your circles and the people you follow show up here.</div>
            <Link href="/circles" className="mt-3 inline-flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-bold text-white">
              Browse circles
            </Link>
          </div>
        ) : (
          <>
            <Group label="From Your Circles" people={fromCircles} onOpen={setViewing} navy />
            <Group label="From People You Follow" people={fromFollowing} onOpen={setViewing} />
          </>
        )}
      </div>

      <StoryViewer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        stories={viewing?.stories ?? []}
        circleId={viewing?.circleId}
        circleName={viewing?.circleName}
      />
    </main>
  )
}
