'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import CuratedContentGrid from '@/components/CuratedContentGrid'
import { ActivePactCard, BrokenPactCard } from '@/components/classic/PactCard'
import { pactAdvancedService, userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'

// "Discover" added alongside the existing My-Pacts filters: it's not a
// fourth way to slice the viewer's own pacts (like All/Active/Done are), so
// it's rendered as its own branch below rather than folded into `filtered`.
// This is also where the former standalone "Curated" bottom-nav destination
// now lives, since both were "browse pacts you haven't joined yet."
const filters = ['All', 'Active', 'Done', 'Discover'] as const

// useSearchParams() (for the ?filter= deep link from the stat card / the
// Circles page's "Pacts active" stat) requires a Suspense boundary around
// any client component that calls it, or `next build` fails prerendering
// this page — see the same requirement on the Dares page below.
export default function PactsPage() {
  return (
    <Suspense fallback={null}>
      <PactsPageInner />
    </Suspense>
  )
}

function PactsPageInner() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore(); const [filter, setFilter] = useState<(typeof filters)[number]>('All'); const [search, setSearch] = useState('')
  // Deep-link support for the "Active" stat (and the Circles page's "Pacts
  // active" stat, which also lands here): /pacts?filter=Active seeds the
  // existing tab state on mount, same read-once pattern as the pact detail
  // page's ?joinRequests= param.
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && (filters as readonly string[]).includes(filterParam)) {
      setFilter(filterParam as (typeof filters)[number])
    }
  }, [searchParams])
  const query = useQuery({ queryKey: ['my-pacts', user?.id], queryFn: () => pactAdvancedService.getMyPacts(0, 100), enabled: !!user?.id }); const statsQuery = useQuery({ queryKey: ['user-stats', user?.id], queryFn: () => userService.getStats(user!.id!), enabled: !!user?.id }); const pacts = query.data?.data || []; const stats = statsQuery.data?.data || {}
  const filtered = useMemo(() => filter === 'Discover' ? [] : pacts.filter((p: any) => (filter === 'All' || (filter === 'Active' ? p.status === 'active' : p.status !== 'active')) && (p.title || '').toLowerCase().includes(search.toLowerCase())), [pacts, filter, search])
  // Cap the list to the top 3 (existing sort/filter order) by default, with
  // a "View all N" button below expanding it in place — no navigation.
  // Resets to collapsed whenever the filter/search changes so switching tabs
  // doesn't leave a stale "expanded" list from a different view.
  const [showAllPacts, setShowAllPacts] = useState(false)
  useEffect(() => { setShowAllPacts(false) }, [filter, search])
  const visiblePacts = showAllPacts ? filtered : filtered.slice(0, 3)
  const grouped = visiblePacts.reduce((g: Record<string, any[]>, p: any) => { (g[p.circle_name || 'Personal pacts'] ||= []).push(p); return g }, {})
  const activeCount = pacts.filter((p: any) => p.status === 'active').length
  const winRate = Number(stats.win_rate ?? stats.completion_rate ?? 0)
  // "Most active" is a best-effort proxy, not a real activity metric: the
  // backend has no per-pact weekly-activity field, so this scores each pact
  // by proof_count + active_cheer_count (both already used elsewhere, e.g.
  // FeedPactCard) and surfaces the highest-scoring one. See
  // BACKEND_SPEC_PACT_ACTIVITY_METRIC.md for the real field this should be
  // replaced with once it exists.
  const mostActivePact = useMemo(() => {
    if (!pacts.length) return null
    return [...pacts].sort((a: any, b: any) => {
      const scoreA = Number(a.proof_count ?? 0) + Number(a.active_cheer_count ?? 0)
      const scoreB = Number(b.proof_count ?? 0) + Number(b.active_cheer_count ?? 0)
      return scoreB - scoreA
    })[0]
  }, [pacts])
  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-col gap-2 px-6 pb-2 pt-7">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">PACTS</p>
          <h1 className="text-balance font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.01em] text-[var(--ink)]">
            Promises, kept in public.
          </h1>
          <p className="text-[14px] leading-[1.5] text-[var(--muted)]">
            Every mark below is a proof someone saw. Nothing is counted that wasn&apos;t witnessed.
          </p>
        </header>

        <div className="flex items-center justify-between gap-3 px-6 py-4">
          {filter !== 'Discover' && (
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 text-[14px] text-[var(--muted)]">
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pacts"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]"
              />
            </label>
          )}
          <Link
            href="/pacts/create"
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} />
            New pact
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-6 pb-4" aria-label="Pact filters">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition ${
                filter === item
                  ? 'bg-[var(--navy)] text-[var(--card)]'
                  : 'border border-[var(--hairline)] text-[var(--ink-soft)]'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {query.isError && filter !== 'Discover' && (
          <div className="flex flex-col gap-3 px-6 py-12 text-center text-[13px] text-[var(--muted)]">
            <p>We couldn&apos;t load your pacts.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mx-auto h-10 rounded-full border border-[var(--navy)] px-4 font-semibold text-[var(--navy)]"
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
          <p className="px-6 py-12 text-[13px] text-[var(--muted)]">Loading pacts…</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="px-6 py-12 text-center font-serif text-[14px] italic text-[var(--muted)]">
            Nothing here yet. The first pact sets the tone.
          </p>
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-2">
            {(Object.entries(grouped) as [string, any[]][]).map(([name, rows]) => (
              <section key={name} className="flex flex-col gap-[18px]">
                <h2 className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{name}</h2>
                {rows.map((pact: any) =>
                  pact.status === 'failed' || pact.status === 'cancelled' ? (
                    <BrokenPactCard key={pact.id} pact={pact} />
                  ) : (
                    <ActivePactCard key={pact.id} pact={pact} />
                  )
                )}
              </section>
            ))}
            {!showAllPacts && filtered.length > visiblePacts.length && (
              <button
                type="button"
                onClick={() => setShowAllPacts(true)}
                className="mx-auto h-11 rounded-full border border-[var(--navy)] px-5 text-[14px] font-semibold text-[var(--navy)]"
              >
                View all {filtered.length}
              </button>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
