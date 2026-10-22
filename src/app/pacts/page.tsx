'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import CuratedContentGrid from '@/components/CuratedContentGrid'
import { DarePactCard } from '@/components/classic/PactCard'
import { pactAdvancedService, dareService, pactService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import ProfilePactCard from '@/components/profile/ProfilePactCard'
import { usePactsStoriesToday } from '@/hooks/useStories'
import { isStoriesUnavailable, STORIES_ENABLED } from '@/lib/stories'

// "Discover" is not a slice of the viewer's own pacts, so it is rendered as
// its own branch below rather than folded into `filtered`.
const filters = ['All', 'Active', 'Done', 'Discover'] as const

// useSearchParams() requires a Suspense boundary or `next build` fails.
export default function PactsPage() {
  return (
    <Suspense fallback={null}>
      <PactsPageInner />
    </Suspense>
  )
}

function deadlineOf(p: any) {
  const t = new Date(p.end_date || p.deadline || '').getTime()
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t
}

function summaryLine(going: number, waiting: number, broken: number) {
  const parts = [
    going > 0 ? `${going} going` : null,
    waiting > 0 ? `${waiting} waiting on a reply` : null,
    broken > 0 ? `${broken} broken` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

function PactsPageInner() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [search, setSearch] = useState('')
  const [pactLimit, setPactLimit] = useState(30)

  // /pacts?filter=Active seeds the tab on mount (stat card deep link).
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && (filters as readonly string[]).includes(filterParam)) {
      setFilter(filterParam as (typeof filters)[number])
    }
  }, [searchParams])

  const query = useQuery({
    queryKey: ['my-pacts', user?.id],
    queryFn: () => pactAdvancedService.getMyPacts(0, pactLimit),
    enabled: !!user?.id,
    placeholderData: (previousData) => previousData,
  })
  const daresQuery = useQuery({ queryKey: ['my-dares-page', user?.id], queryFn: () => dareService.getMine(0, 50), enabled: !!user?.id })

  const pacts: any[] = query.data?.data || []
  const allDares: any[] = (daresQuery.data as any)?.data || []

  // A dare needs attention when the viewer sent it and it is still pending.
  const dareRows = useMemo(
    () => allDares.filter((d) => d.creator_id === user?.id && d.status === 'pending' && !d.my_recipient_status),
    [allDares, user?.id],
  )

  const matchesSearch = (title: string) => (title || '').toLowerCase().includes(search.toLowerCase())
  const isBroken = (p: any) => p.status === 'failed' || p.status === 'cancelled'
  // Live means active and its last day hasn't passed; anything past its end goes to Done.
  const today = new Date().toLocaleDateString('en-CA')
  const isActive = (p: any) => p.status === 'active' && (!p.end_date || String(p.end_date).slice(0, 10) >= today)

  const active = useMemo(
    () => pacts.filter((p) => isActive(p) && matchesSearch(p.title)).sort((a, b) => deadlineOf(a) - deadlineOf(b)),
    [pacts, search], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const broken = useMemo(() => pacts.filter((p) => isBroken(p) && matchesSearch(p.title)), [pacts, search]) // eslint-disable-line react-hooks/exhaustive-deps
  const finished = useMemo(
    () => pacts.filter((p) => !isActive(p) && !isBroken(p) && matchesSearch(p.title)),
    [pacts, search], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const showActive = filter === 'All' || filter === 'Active'
  const showDone = filter === 'All' || filter === 'Done'
  const showDares = filter === 'All' || filter === 'Active'

  const participantPacts = useMemo(() => pacts.filter((pact: any) => pact.is_joined_by_me !== false), [pacts])
  const summary = summaryLine(
    participantPacts.filter(isActive).length,
    dareRows.length,
    participantPacts.filter(isBroken).length,
  )

  const allActive = useMemo(() => participantPacts.filter(isActive), [participantPacts]) // eslint-disable-line react-hooks/exhaustive-deps
  const activeIds = useMemo(() => allActive.map((p) => Number(p.id)), [allActive])
  const storyQueries = usePactsStoriesToday(STORIES_ENABLED ? activeIds : [])
  const storiesUnavailable = storyQueries.length > 0 && storyQueries.every((q) => q.isError && isStoriesUnavailable(q.error))
  const storiesKnown = storyQueries.length > 0 && storyQueries.every((q) => q.isSuccess)
  const postedCount = storiesKnown ? storyQueries.filter((q) => q.data?.some((s) => s.user_id === user?.id)).length : null
  const storySummary = `${allActive.length} ${allActive.length === 1 ? 'pact' : 'pacts'}.${
    postedCount != null ? ` ${postedCount} ${postedCount === 1 ? 'moment' : 'moments'} shared today.` : ''
  }`
  const [capturePact, setCapturePact] = useState<any | null>(null)

  const joinCapturePact = async () => {
    if (!capturePact?.can_join) return false
    try {
      await pactService.join(Number(capturePact.id))
      await queryClient.invalidateQueries({ queryKey: ['my-pacts'] })
      setCapturePact((current: any) => current ? { ...current, is_joined_by_me: true, can_join: false, join_block_reason: 'already_joined' } : current)
      return true
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not join this pact')
      return false
    }
  }

  const nothingToShow =
    (!showActive || active.length === 0) && (!showDares || dareRows.length === 0) && (!showDone || (broken.length === 0 && finished.length === 0))

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-col gap-2 px-6 pb-1.5 pt-9">
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.035em]">Your pacts</h1>
          {STORIES_ENABLED ? (
            <>
              {query.isSuccess && <p className="text-[14px] text-[var(--muted)]">{storySummary}</p>}
            </>
          ) : (
            summary && <p className="text-[14px] text-[var(--muted)]">{summary}</p>
          )}
        </header>

        <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
          {filter !== 'Discover' && (
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[14px] text-[var(--muted)]">
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pacts"
                aria-label="Search pacts"
                className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
          )}
          <Link
            href="/pacts/create"
            className="ml-auto flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New pact
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-6 pb-4" aria-label="Pact filters">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition ${
                filter === item ? 'bg-[var(--ink)] text-[var(--card)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {query.isError && filter !== 'Discover' && (
          <div className="flex flex-col items-start gap-3 px-6 py-8 text-[14px] text-[var(--muted)]">
            <p>We couldn&apos;t load your pacts.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="h-11 rounded-full border-[1.5px] border-[var(--navy)] px-5 font-semibold text-[var(--navy)]"
            >
              Try again
            </button>
          </div>
        )}

        {filter === 'Discover' ? (
          <div className="px-6 py-4">
            <CuratedContentGrid type="pact" />
          </div>
        ) : query.isLoading ? (
          <p className="px-6 py-10 text-[14px] text-[var(--muted)]">Loading pacts…</p>
        ) : nothingToShow && !query.isError ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8">
            <p className="text-[14px] text-[var(--muted)]">{pacts.length === 0 ? 'You have no pacts yet.' : 'No pacts match that.'}</p>
            {pacts.length === 0 && (
              <Link href="/pacts/create" className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)]">
                Make a pact
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 px-4 pt-2">
            {showActive &&
              active.filter((pact: any) => pact.is_joined_by_me !== false).map((pact) => {
                const stories = storyQueries[activeIds.indexOf(Number(pact.id))]?.data
                const postedToday = stories ? stories.some((story: any) => story.user_id === user?.id) : undefined
                return (
                  <ProfilePactCard
                    key={pact.id}
                    pact={pact}
                    label={pact.circle_name || pact.circle || 'Just you'}
                    postedToday={postedToday}
                    onPost={STORIES_ENABLED && !storiesUnavailable ? () => setCapturePact(pact) : undefined}
                  />
                )
              })}

            {showDares && dareRows.length > 0 && (
              <div className="flex flex-col border-b border-[var(--line)] pb-3">
                {dareRows.map((dare) => (
                  <DarePactCard key={dare.id} dare={dare} />
                ))}
              </div>
            )}

            {showDone && finished.length + broken.length > 0 && filter === 'All' && (
              <h2 className="px-2 pt-3 text-[12px] font-extrabold tracking-[0.08em] text-[var(--muted)]">DONE</h2>
            )}
            {showDone &&
              [...finished, ...broken].map((pact) => <ProfilePactCard key={pact.id} pact={pact} label={pact.circle_name || pact.circle || 'Just you'} />)}
            {pacts.length >= pactLimit && pactLimit < 100 && (
              <button
                type="button"
                onClick={() => setPactLimit((current) => (current === 30 ? 60 : 100))}
                disabled={query.isFetching}
                className="mx-auto flex h-11 items-center rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)] disabled:opacity-60"
              >
                {query.isFetching ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
      <BottomNav />
      {STORIES_ENABLED && capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} canJoin={Boolean(capturePact.can_join)} onJoin={joinCapturePact} />
      )}
    </main>
  )
}
