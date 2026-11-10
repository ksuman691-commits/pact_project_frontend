'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Plus, Users } from 'lucide-react'
import CircleMark from '@/components/brand/CircleMark'
import { useCircles } from '@/hooks/useCircles'
import PendingCircleInvites from '@/components/PendingCircleInvites'
import { APP_REFRESH_EVENT } from '@/components/AppPullToRefresh'
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
  const [invitesKey, setInvitesKey] = useState(0)
  // Pending invites load on their own, so a pull to refresh reloads them too.
  useEffect(() => {
    const refresh = () => setInvitesKey((key) => key + 1)
    window.addEventListener(APP_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(APP_REFRESH_EVENT, refresh)
  }, [])
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
    { id: 'quiet', label: 'Quiet this week' },
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

  const glance: { label: string; value: number | string; filter: Filter }[] = [
    { label: circles.length === 1 ? 'Circle' : 'Circles', value: circles.length, filter: 'all' },
    { label: 'Active this week', value: allActivityKnown ? activeCircles : '–', filter: 'all' },
    { label: 'Started by you', value: withActivity.filter((item) => matchesFilter(item, 'mine', viewerId)).length, filter: 'mine' },
  ]

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-7">
          <h1 className="flex items-center gap-2.5 text-[32px] font-bold leading-none tracking-[-0.045em]">
            <CircleMark size={24} />
            Circles
          </h1>
        </header>

        {/* Your circles at a glance, and the two ways to get into one. */}
        <section className="mx-[10px] rounded-[22px] bg-[var(--navy)] p-3 text-white sm:mx-6" aria-label="Your circles at a glance">
          <div className="grid grid-cols-3 text-center">
            {glance.map((stat) => (
              <button key={stat.label} type="button" onClick={() => setMembershipFilter(stat.filter)} className="min-h-[56px] rounded-[14px] px-1 active:bg-white/10">
                <span key={String(stat.value)} className="cp-tick block text-[26px] font-bold leading-none tracking-[-0.03em]">{circlesQuery.isSuccess ? stat.value : '–'}</span>
                <span className="mt-1 block text-[12.5px]" style={{ color: '#D4DBFA' }}>{stat.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Link href="/circles/create" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold text-[var(--navy)] transition active:scale-[0.98]">
              <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
              New circle
            </Link>
            <button type="button" onClick={() => setConnectModalOpen(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-white/70 text-[16px] font-bold text-white transition active:scale-[0.98]">
              <Users className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              Find people
            </button>
          </div>
        </section>

        <div className="mt-3">
          <PendingCircleInvites key={invitesKey} />
        </div>

        <div className="flex items-center gap-2 px-4 pt-1">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[14px] text-[var(--muted)]">
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              aria-label="Search circles"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
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

        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-1 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Circle membership filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMembershipFilter(item.id)}
              aria-pressed={membershipFilter === item.id}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition ${
                membershipFilter === item.id ? 'bg-[var(--ink)] text-[var(--card)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
              }`}
            >
              {item.label}
              <span className={membershipFilter === item.id ? 'opacity-75' : 'text-[var(--muted)]'}>{filterCount(item.id)}</span>
            </button>
          ))}
        </nav>

        <section className="px-4 pt-4" aria-label="Your circles">
          {isLoading ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading circles">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pact-shimmer h-[132px] rounded-[22px]" />
              ))}
            </div>
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
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-6 py-8 text-center">
              <span className="mx-auto flex justify-center">
                <CircleMark key={membershipFilter} size={72} animation="draw" />
              </span>
              {circles.length === 0 ? (
                <>
                  <h2 className="mt-4 text-[22px] font-bold tracking-[-0.03em]">Better with people watching</h2>
                  <p className="mt-2 text-[14px] leading-[1.5] text-[var(--muted)]">A circle is a small group that sees each other&apos;s check-ins. Start one with friends, or let us find people with the same goal.</p>
                  <Link href="/circles/create" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--navy)] px-6 text-[14px] font-bold text-white">
                    <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                    Start a circle
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-[20px] font-bold tracking-[-0.03em]">No circles match that</h2>
                  <button type="button" onClick={() => { setSearch(''); setMembershipFilter('all') }} className="mt-4 inline-flex h-11 items-center rounded-full border-[1.5px] border-[var(--navy)] px-6 text-[14px] font-bold text-[var(--navy)]">
                    Show all circles
                  </button>
                </>
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
