'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Plus, Sparkles } from 'lucide-react'
import { useCircles } from '@/hooks/useCircles'
import PendingCircleInvites from '@/components/PendingCircleInvites'
import ConnectSimilarFolksModal from '@/components/ConnectSimilarFolksModal'
import OrbitCircleCard from '@/components/circles/OrbitCircleCard'
import { readCircleActivity } from '@/lib/circleActivity'
import { useRequireAuth } from '@/hooks/useRequireAuth'

const SORT_OPTIONS = ['Most active', 'Alphabetical (A-Z)', 'Member count'] as const
type Filter = 'all' | 'quiet' | 'mine'


function matchesFilter(item: { circle: any; activity: ReturnType<typeof readCircleActivity> }, filter: Filter, viewerId: unknown) {
  if (filter === 'all') return true
  if (filter === 'quiet') return item.activity.known && item.activity.activeCount === 0
  return viewerId != null && String(item.circle.owner_id) === String(viewerId)
}

export default function CirclesPage() {
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const { user, isInitialized } = useRequireAuth()
  const circlesQuery = useCircles(isInitialized && !!user)
  const circles = (circlesQuery.data || []) as any[]
  const isLoading = circlesQuery.isLoading
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('Most active')
  const [sortOpen, setSortOpen] = useState(false)
  const [membershipFilter, setMembershipFilter] = useState<Filter>('all')
  const viewerId = (user as any)?.id

  const withActivity = useMemo(
    () => circles.map((circle) => ({ circle, activity: readCircleActivity(circle, undefined, viewerId) })),
    [circles, viewerId],
  )

  const searchFiltered = useMemo(
    () => withActivity.filter(({ circle }) => (circle.name || '').toLowerCase().includes(search.toLowerCase())),
    [withActivity, search],
  )
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'quiet', label: 'Quiet This Week' },
    { id: 'mine', label: 'Yours' },
  ]
  const filterCount = (filter: Filter) => searchFiltered.filter((item) => matchesFilter(item, filter, viewerId)).length

  const visible = useMemo(() => {
    const list = searchFiltered.filter((item) => matchesFilter(item, membershipFilter, viewerId))
    return [...list].sort((a, b) => {
      if (sort === 'Alphabetical (A-Z)') return (a.circle.name || '').localeCompare(b.circle.name || '')
      if (sort === 'Member count') return b.activity.totalMembers - a.activity.totalMembers
      // Most active: circles with real activity first, quiet ones last.
      const aActive = a.activity.known ? a.activity.activeCount : -1
      const bActive = b.activity.known ? b.activity.activeCount : -1
      return bActive - aActive || b.activity.totalMembers - a.activity.totalMembers
    })
  }, [searchFiltered, membershipFilter, sort, viewerId])

  const allActivityKnown = withActivity.length > 0 && withActivity.every(({ activity }) => activity.known)
  const activeCircles = withActivity.filter(({ activity }) => activity.known && activity.activeCount > 0).length

  const summary = (() => {
    if (circles.length === 0) return null
    const count = `${circles.length} circle${circles.length === 1 ? '' : 's'}.`
    if (!allActivityKnown) return count
    return `${count} ${activeCircles} had someone show up this week.`
  })()


  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-col gap-2 px-6 pb-1.5 pt-9">
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.04em]">Your Circles</h1>
          {summary && <p className="text-[14px] text-[var(--muted)]">{summary}</p>}
        </header>

        <div className="mt-4">
          <PendingCircleInvites />
        </div>

        <div className="flex flex-wrap gap-2.5 px-6 pt-4">
          <Link
            href="/circles/create"
            className="flex h-11 items-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New Circle
          </Link>
          <button
            type="button"
            onClick={() => setConnectModalOpen(true)}
            className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)]"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
            Connect Me
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-6 pt-5">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[14px] text-[var(--muted)]">
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              aria-label="Search circles"
              className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-label="Sort circles"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-soft)]"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.7} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-12 z-10 w-48 rounded-[10px] border border-[var(--line)] bg-[var(--card)] py-1.5 shadow-[0_14px_28px_-16px_rgba(60,45,20,0.3)]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSort(option)
                      setSortOpen(false)
                    }}
                    className={`block w-full px-3.5 py-2.5 text-left text-[14px] ${sort === option ? 'font-semibold text-[var(--navy)]' : 'text-[var(--ink-soft)]'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-6 pb-1 pt-3" aria-label="Circle membership filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMembershipFilter(item.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition ${
                membershipFilter === item.id ? 'bg-[var(--ink)] text-[var(--card)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
              }`}
            >
              {item.label} ({filterCount(item.id)})
            </button>
          ))}
        </nav>

        <section className="px-4 pt-4" aria-label="Your circles">
          {isLoading ? (
            <p className="text-[14px] text-[var(--muted)]">Loading circles…</p>
          ) : circlesQuery.isError ? (
            <div className="flex flex-col items-start gap-3 text-[14px] text-[var(--muted)]">
              <p>We couldn&apos;t load your circles.</p>
              <button
                type="button"
                onClick={() => circlesQuery.refetch()}
                className="h-11 rounded-full border-[1.5px] border-[var(--navy)] px-5 font-semibold text-[var(--navy)]"
              >
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-[14px] text-[var(--muted)]">
                {circles.length === 0 ? 'You are not in any circles yet.' : 'No circles match that.'}
              </p>
              {circles.length === 0 && (
                <Link href="/circles/create" className="flex h-11 items-center rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)]">
                  Start a circle
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map(({ circle, activity }, index) => (
                <OrbitCircleCard key={circle.id} circle={circle} activity={activity} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
      <ConnectSimilarFolksModal isOpen={connectModalOpen} onClose={() => setConnectModalOpen(false)} />
    </main>
  )
}
