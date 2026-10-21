'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useMomentPeople, type MomentPerson } from '@/hooks/useMomentPeople'
import { useMyPacts } from '@/hooks/useMyPacts'
import { useTodayMoments } from '@/hooks/useTodayMoments'
import StoryCaptureSheet from './StoryCaptureSheet'
import StoryRing from './StoryRing'
import StoryViewer from './StoryViewer'

interface StoryCircle {
  id: number
  name: string
  photo_url?: string | null
  stories_today_count?: number | null
  has_unseen_story?: boolean | null
}

const SIZE = 72

function groupPactsByCircle(pacts: any[], circles: StoryCircle[]) {
  type Group = { key: string; name: string; pacts: any[] }
  const groups = new Map<string, Group>()
  const nameFor = (p: any) => p.circle_name || circles.find((c) => c.id === p.circle_id)?.name || null
  for (const p of pacts) {
    const name = nameFor(p)
    const key = p.circle_id != null ? `c${p.circle_id}` : name ? `n${name}` : 'personal'
    const group: Group = groups.get(key) ?? { key, name: name || 'Personal', pacts: [] }
    group.pacts.push(p)
    groups.set(key, group)
  }
  // Circle groups follow the Home circles row order; personal pacts go last.
  const order = (g: { key: string }) => {
    const i = circles.findIndex((c) => `c${c.id}` === g.key)
    return g.key === 'personal' ? Number.MAX_SAFE_INTEGER : i === -1 ? circles.length : i
  }
  return Array.from(groups.values()).sort((a, b) => order(a) - order(b))
}

function PostTodaySheet({ circles, onClose, onPick }: { circles: StoryCircle[]; onClose: () => void; onPick: (pact: any) => void }) {
  // Already warmed by the Home row, so this normally renders from cache.
  const query = useMyPacts()
  const active: any[] = ((query.data as any)?.data || []).filter((p: any) => p.status === 'active' && p.is_joined_by_me !== false)
  const groups = groupPactsByCircle(active, circles)
  const showSkeleton = query.isLoading || (query.isFetching && !query.data && !query.isError)

  return (
    <div className="fixed inset-0 z-[70] flex items-end" role="dialog" aria-modal="true" aria-label="Choose a pact">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[var(--ink)]/40" onClick={onClose} />
      <div className="relative mx-auto flex max-h-[75vh] w-full max-w-md flex-col gap-3 rounded-t-[14px] bg-[var(--paper)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-[var(--ink)]">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-bold tracking-[-0.02em]">Post today&apos;s moment to</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        {showSkeleton ? (
          <ul className="flex flex-col" aria-busy="true" aria-label="Loading your pacts">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex min-h-[56px] flex-col justify-center gap-2 border-b border-[var(--hairline)] py-2 last:border-b-0">
                <span className="pact-shimmer h-4 w-2/3 rounded" />
                <span className="pact-shimmer h-3 w-1/3 rounded" />
              </li>
            ))}
          </ul>
        ) : query.isError && !query.data ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-[14px] text-[var(--muted)]">We couldn&apos;t load your pacts.</p>
            <button type="button" onClick={() => void query.refetch()} className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--paper)]">
              Tap to retry
            </button>
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-[14px] text-[var(--muted)]">You have no active pacts.</p>
            <Link href="/pacts/create" className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--paper)]">
              Make a pact
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.key} role="group" aria-label={group.name}>
                <h3 className="pb-1 text-[12px] font-medium text-[var(--muted)]">{group.name}</h3>
                <ul className="flex flex-col gap-2">
                  {group.pacts.map((pact) => (
                    <li key={pact.id} className="border-b border-[var(--hairline)] last:border-b-0">
                      <button type="button" onClick={() => onPick(pact)} className="flex min-h-[44px] w-full items-center py-1 text-left">
                        <span className="text-[15px] font-semibold">{pact.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StoryCirclesRow({ circles, isLoading }: { circles: StoryCircle[]; isLoading?: boolean }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [capturePact, setCapturePact] = useState<any | null>(null)
  const [viewing, setViewing] = useState<MomentPerson | null>(null)
  const { user } = useAuthStore()
  const { people, mine, isLoading: peopleLoading } = useMomentPeople(circles, user?.id)
  const { myStories: myPactStories } = useTodayMoments()
  // Own moments can sit on a pact the viewer doesn't own (e.g. a friend's pact
  // in a shared circle), so merge both sources and de-dupe.
  const myStories = useMemo(() => {
    const byId = new Map<number, (typeof mine)[number]>()
    ;[...myPactStories, ...mine].forEach((s) => byId.set(s.id, s))
    return Array.from(byId.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [myPactStories, mine])
  const postedToday = myStories.length > 0
  const [viewingOwn, setViewingOwn] = useState(false)
  // Warm the sheet's data on Home mount so the chooser opens from cache.
  useMyPacts()

  return (
    <section aria-label="Your circles" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[var(--ink)]">Moments</h2>
        <Link href="/moments" className="text-[14px] font-bold text-[var(--navy)]">
          See all
        </Link>
      </div>

      <ul className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
        <li className="relative">
          <button
            type="button"
            onClick={() => (postedToday && myStories.length > 0 ? setViewingOwn(true) : setPickerOpen(true))}
            className="flex w-[76px] flex-col items-center gap-1.5"
            aria-label={postedToday ? 'View your moment' : "Post today's moment"}
          >
            <StoryRing state={postedToday ? 'seen' : 'add'} count={Math.max(1, myStories.length)} size={SIZE} name={user?.full_name} imageUrl={user?.avatar_url} />
            <span className="w-full truncate text-center text-[12px] font-semibold text-[var(--ink)]">You</span>
            <span className="-mt-1 text-[10px]" style={{ color: postedToday ? 'var(--muted)' : 'var(--navy)', fontWeight: postedToday ? 400 : 700 }}>
              {postedToday ? 'Tap to view' : 'Post today'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Add a moment"
            className="absolute right-[2px] top-[50px] flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-[var(--paper)] bg-[var(--navy)] text-white"
          >
            <Plus className="h-3 w-3" strokeWidth={3.2} aria-hidden="true" />
          </button>
        </li>

        {isLoading || peopleLoading
          ? [0, 1].map((i) => (
              <li key={i} className="flex w-[76px] flex-col items-center gap-1.5" aria-hidden="true">
                <span className="pact-shimmer rounded-full" style={{ width: SIZE, height: SIZE }} />
              </li>
            ))
          : people.map((person) => {
              const firstName = (person.name || 'Member').split(' ')[0]
              return (
                <li key={person.userId}>
                  <button
                    type="button"
                    onClick={() => setViewing(person)}
                    className="flex w-[76px] flex-col items-center gap-1"
                    aria-label={`${firstName}'s moment${person.hasUnseen ? ', new' : ''}, in ${person.circleName}`}
                  >
                    <StoryRing
                      state={person.hasUnseen ? 'unseen' : 'seen'}
                      size={SIZE}
                      name={person.name}
                      imageUrl={person.avatarUrl}
                      count={person.stories.length}
                    />
                    <span className={`w-full truncate text-center text-[12px] ${person.hasUnseen ? 'font-bold' : 'font-semibold'} text-[var(--ink)]`}>{firstName}</span>
                    <span className="-mt-1 w-full truncate text-center text-[10px] text-[var(--muted)]">{person.circleName}</span>
                  </button>
                </li>
              )
            })}
      </ul>

      {!isLoading && circles.length === 0 && (
        <p className="px-1 text-[14px] text-[var(--muted)]">
          No circles yet.{' '}
          <Link href="/circles" className="font-semibold text-[var(--navy)]">
            Browse circles
          </Link>
        </p>
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
      {capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} />
      )}
      <StoryViewer open={viewingOwn} onClose={() => setViewingOwn(false)} stories={myStories} />
      <StoryViewer
        open={viewing !== null}
        onClose={() => setViewing(null)}
        stories={viewing?.stories ?? []}
        circleId={viewing?.circleId}
        circleName={viewing?.circleName}
      />
    </section>
  )
}
