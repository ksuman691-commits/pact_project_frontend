'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import RefreshButton from '@/components/RefreshButton'
import { getMyWatching, withdrawAsk, type WatchRequest } from '@/lib/api/access'
import { DarePactCard } from '@/components/classic/PactCard'
import { pactAdvancedService, dareService, pactService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet'
import FeedPactCard from '@/components/FeedPactCard'
import { usePactsStoriesToday } from '@/hooks/useStories'
import { isStoriesUnavailable, STORIES_ENABLED } from '@/lib/stories'

// All = Watching + Active + Done. Watching is pacts the viewer paid to watch and
// the creator accepted (plus open asks); once one ends it moves to Done.
const filters = ['All', 'Active', 'Watching', 'Done'] as const

// useSearchParams() requires a Suspense boundary or `next build` fails.
export default function PactsPage() {
  return (
    <Suspense fallback={null}>
      <PactsPageInner />
    </Suspense>
  )
}

function SectionLabel({ label, count, tone, muted }: { label: string; count: number; tone?: 'navy'; muted?: boolean }) {
  return (
    <h2
      className={`px-2 pt-3 text-[12px] font-extrabold uppercase tracking-[0.08em] ${tone === 'navy' ? 'text-[var(--navy)]' : muted ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}
    >
      {label} <span className="font-bold text-[var(--muted)]">{count}</span>
    </h2>
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
  const router = useRouter()
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
  const watchingQuery = useQuery({
    queryKey: ['my-watching', user?.id],
    queryFn: getMyWatching,
    enabled: !!user?.id,
    placeholderData: (previousData) => previousData,
  })
  const daresQuery = useQuery({ queryKey: ['my-dares-page', user?.id], queryFn: () => dareService.getMine(0, 50), enabled: !!user?.id })

  const pacts: any[] = query.data?.data || []
  const watchingAll: any[] = watchingQuery.data?.watching || []
  const requests: WatchRequest[] = watchingQuery.data?.requests || []

  // Turned-down asks can be dismissed; remembered on this device.
  const dismissKey = `dismissed-watch-requests:${user?.id ?? ''}`
  const [dismissed, setDismissed] = useState<string[]>([])
  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem(dismissKey) || '[]'))
    } catch {
      setDismissed([])
    }
  }, [dismissKey])
  const requestId = (r: WatchRequest) => `${r.pact_id}:${r.created_at}`
  const visibleRequests = requests.filter((r) => r.status === 'pending' || !dismissed.includes(requestId(r)))
  const dismissRequest = (r: WatchRequest) => {
    const next = [...dismissed, requestId(r)]
    setDismissed(next)
    try {
      localStorage.setItem(dismissKey, JSON.stringify(next))
    } catch {}
  }
  const cancelRequest = async (r: WatchRequest) => {
    try {
      await withdrawAsk(r.pact_id)
      await watchingQuery.refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not cancel this request')
    }
  }
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

  // Paid pacts: running ones are Watching, ended ones are Done (they keep their Watching chip).
  const watchingLive = useMemo(() => watchingAll.filter((p) => isActive(p) && matchesSearch(p.title)), [watchingAll, search]) // eslint-disable-line react-hooks/exhaustive-deps
  const watchingEnded = useMemo(() => watchingAll.filter((p) => !isActive(p) && matchesSearch(p.title)), [watchingAll, search]) // eslint-disable-line react-hooks/exhaustive-deps
  const doneAll = useMemo(() => [...finished, ...broken, ...watchingEnded], [finished, broken, watchingEnded])

  // Tab counts ignore the search box.
  const counts = {
    Active: pacts.filter((p) => isActive(p) && p.is_joined_by_me !== false).length,
    Watching: watchingAll.filter(isActive).length,
    Done: pacts.filter((p) => !isActive(p)).length + watchingAll.filter((p) => !isActive(p)).length,
  }
  const countAll = counts.Active + counts.Watching + counts.Done
  const watchingHasNew = watchingAll.some((p) => isActive(p) && Number(p.watch?.new_moments ?? 0) > 0)

  const showActive = filter === 'All' || filter === 'Active'
  const showWatching = filter === 'All' || filter === 'Watching'
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

  const activeShown = active.filter((pact: any) => pact.is_joined_by_me !== false)
  const nothingToShow =
    (!showActive || activeShown.length === 0) &&
    (!showWatching || (watchingLive.length === 0 && (filter !== 'Watching' || visibleRequests.length === 0))) &&
    (!showDares || dareRows.length === 0) &&
    (!showDone || doneAll.length === 0)
  const refreshAll = () => Promise.all([query.refetch(), watchingQuery.refetch(), daresQuery.refetch()])

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-start justify-between gap-3 px-6 pb-1.5 pt-9">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-[34px] font-bold leading-none tracking-[-0.035em]">Your Pacts</h1>
            {STORIES_ENABLED ? (
              <>
                {query.isSuccess && <p className="text-[14px] text-[var(--muted)]">{storySummary}</p>}
              </>
            ) : (
              summary && <p className="text-[14px] text-[var(--muted)]">{summary}</p>
            )}
          </div>
          <RefreshButton label="Refresh pacts" onRefresh={refreshAll} />
        </header>

        <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
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
          <Link
            href="/pacts/create"
            className="ml-auto flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Pact
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-6 pb-4" aria-label="Pact filters">
          {filters.map((item) => {
            const count = item === 'All' ? countAll : counts[item]
            const selected = filter === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={selected}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition ${
                  selected
                    ? item === 'Watching'
                      ? 'bg-[var(--navy)] text-white'
                      : 'bg-[var(--ink)] text-[var(--card)]'
                    : item === 'Watching' && watchingHasNew
                      ? 'border border-[var(--navy)] bg-[var(--navy)]/10 text-[var(--navy)]'
                      : 'border border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                {item === 'Watching' && watchingHasNew && <span className={`size-[7px] rounded-full ${selected ? 'bg-white' : 'bg-[var(--navy)]'}`} aria-label="New moments" />}
                {item}
                {query.isSuccess && <span className={selected ? 'opacity-75' : 'text-[var(--muted)]'}>{count}</span>}
              </button>
            )
          })}
        </nav>

        {query.isError && (
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

        {query.isLoading ? (
          <p className="px-6 py-10 text-[14px] text-[var(--muted)]">Loading pacts…</p>
        ) : nothingToShow && !query.isError && filter === 'Watching' && search.trim() === '' ? (
          <div className="px-4 pt-2">
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-6 py-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--navy)]/10 text-[var(--navy)]">
                <Eye className="size-6" strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[20px] font-extrabold tracking-[-0.02em]">Pacts You Watch Live Here</h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--muted)]">
                When you pay to watch a pact and the creator accepts you, it shows up here, and it stays at the top of your feed.
              </p>
              <Link href="/feed" className="mt-5 inline-flex h-11 items-center rounded-full bg-[var(--navy)] px-6 text-[14px] font-extrabold text-white transition hover:bg-[var(--navy-hover)]">
                Browse The Feed
              </Link>
            </div>
          </div>
        ) : nothingToShow && !query.isError ? (
          <div className="flex flex-col items-start gap-3 px-6 py-8">
            <p className="text-[14px] text-[var(--muted)]">{pacts.length === 0 && watchingAll.length === 0 ? 'You have no pacts yet.' : 'No pacts match that.'}</p>
            {pacts.length === 0 && watchingAll.length === 0 && (
              <Link href="/pacts/create" className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)]">
                Make a pact
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 px-4 pt-2">
            {showWatching && filter === 'Watching' && visibleRequests.length > 0 && (
              <>
                <SectionLabel label="Requests" count={visibleRequests.length} />
                <div className="flex flex-col gap-2.5">
                  {visibleRequests.map((r) => (
                    <div key={requestId(r)} className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--card)] py-3 pl-3.5 pr-3">
                      <Link href={`/pacts/${r.pact_id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy)] text-[13px] font-extrabold text-white">
                          {r.creator?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.creator.avatar_url} alt="" className="size-full object-cover" />
                          ) : (
                            (r.creator?.full_name || r.creator?.username || '?').slice(0, 1).toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-extrabold">{r.pact_title}</span>
                          <span className="block truncate text-[12.5px] text-[var(--muted)]">
                            {r.status === 'pending'
                              ? `Waiting for ${r.creator?.full_name || `@${r.creator?.username ?? 'the creator'}`} to confirm`
                              : `Not approved by ${r.creator?.full_name || `@${r.creator?.username ?? 'the creator'}`}`}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => (r.status === 'pending' ? void cancelRequest(r) : dismissRequest(r))}
                        className="h-9 shrink-0 rounded-full border border-[var(--line)] px-3 text-[13px] font-semibold text-[var(--ink)]"
                      >
                        {r.status === 'pending' ? 'Cancel' : 'Dismiss'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {showWatching && watchingLive.length > 0 && (
              <>
                <SectionLabel label={filter === 'Watching' ? 'Watching Now' : 'Watching'} count={watchingLive.length} tone="navy" />
                {watchingLive.map((pact) => (
                  <div key={pact.id} className="-mx-4">
                    <FeedPactCard pact={pact} canReport={false} />
                  </div>
                ))}
              </>
            )}

            {showActive && activeShown.length > 0 && <SectionLabel label="Active" count={activeShown.length} />}
            {showActive &&
              activeShown.map((pact) => {
                const stories = storyQueries[activeIds.indexOf(Number(pact.id))]?.data
                const postedToday = stories ? stories.some((story: any) => story.user_id === user?.id) : undefined
                return (
                  <div key={pact.id} className="-mx-4">
                    <FeedPactCard
                      pact={pact}
                      postedToday={postedToday}
                      onAddMoment={() => (STORIES_ENABLED && !storiesUnavailable ? setCapturePact(pact) : router.push(`/pacts/${pact.id}`))}
                    />
                  </div>
                )
              })}

            {showDares && dareRows.length > 0 && (
              <div className="flex flex-col border-b border-[var(--line)] pb-3">
                {dareRows.map((dare) => (
                  <DarePactCard key={dare.id} dare={dare} />
                ))}
              </div>
            )}

            {showDone && doneAll.length > 0 && <SectionLabel label="Done" count={doneAll.length} muted />}
            {showDone &&
              doneAll.map((pact) => (
                <div key={pact.id} className="-mx-4">
                  <FeedPactCard pact={pact} />
                </div>
              ))}
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
      {STORIES_ENABLED && capturePact && (
        <StoryCaptureSheet isOpen onClose={() => setCapturePact(null)} pactId={Number(capturePact.id)} pactTitle={capturePact.title} canJoin={Boolean(capturePact.can_join)} onJoin={joinCapturePact} />
      )}
    </main>
  )
}
