'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import PactProgressRing, { getPactProgress } from '@/components/PactProgressRing'
import CuratedContentGrid from '@/components/CuratedContentGrid'
import { pactAdvancedService, userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { hasPactMomentum } from '@/lib/pactMomentum'

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
  return <main className="min-h-screen bg-[var(--pact-bg)] pb-28 text-[var(--pact-text)]"><div className="mx-auto max-w-5xl px-5 pb-10 pt-8 md:px-10 md:pt-14"><header className="border-b border-[var(--pact-hairline)] pb-8"><p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Pacts</p><h1 className="mt-3 text-balance text-5xl font-black tracking-[-0.07em] text-[var(--pact-text)] md:text-7xl">{activeCount}<span className="ml-3 text-2xl font-medium tracking-[-0.03em] text-[var(--pact-text-muted)] md:text-3xl">Pacts in motion right now</span></h1>
    {/* Unified stat card — matches the Circles/Dares landing pages' stat card treatment.
        "Active" is self-referential (sets the tab already on this page rather than navigating),
        "Win rate" goes to the profile stats, "Most active" deep-links to that pact's own detail page. */}
    <div className="mt-6 flex items-stretch divide-x divide-[var(--pact-hairline)] rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)]">
      <button type="button" onClick={() => setFilter('Active')} className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]">
        <p className="text-lg font-black text-[var(--pact-text)]">{activeCount}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Active</p>
      </button>
      <Link href="/profile" className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]">
        <p className="text-lg font-black text-[var(--pact-text)]">{Math.round(winRate)}%</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Win rate</p>
      </Link>
      {mostActivePact ? (
        <Link href={`/pacts/${mostActivePact.id}`} className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]">
          <p className="truncate text-sm font-black text-[var(--pact-text)]">{mostActivePact.title}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Most active</p>
        </Link>
      ) : (
        <div className="flex-1 px-4 py-3 text-center">
          <p className="truncate text-sm font-black text-[var(--pact-text)]">—</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Most active</p>
        </div>
      )}
    </div>
  </header>
  {/* "New Pact" gets its own centered row directly under the stat card,
      matching the Dares/Circles landing pages' treatment — a prominent,
      full-width CTA rather than a small icon-only button tucked in a
      corner. */}
  <div className="flex justify-center pt-6">
    <Link
      href="/pacts/create"
      className="pact-btn-glow flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[var(--pact-text)]"
      style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
    >
      <Plus className="h-4 w-4" />
      New Pact
    </Link>
  </div>
  {query.isError && filter !== 'Discover' && <div className="flex flex-col gap-3 py-12 text-center text-sm text-[var(--pact-text-muted)]"><p>We couldn&apos;t load your pacts.</p><button type="button" onClick={() => query.refetch()} className="mx-auto rounded-full border border-[var(--pact-violet)] px-4 py-2 font-semibold text-[var(--pact-text)]">Try again</button></div>}<div className="flex items-center gap-5 border-b border-[var(--pact-hairline)] py-5">{filter !== 'Discover' && <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[var(--pact-text-muted)]"><Search className="h-4 w-4" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pacts" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--pact-text-faint)]" /></label>}<nav className="flex gap-4 text-sm" aria-label="Pact filters">{filters.map(item => <button key={item} onClick={() => setFilter(item)} className={`border-b pb-1 ${filter === item ? 'border-[var(--pact-violet)] font-bold text-[var(--pact-text)]' : 'border-transparent text-[var(--pact-text-faint)]'}`}>{item}</button>)}</nav></div>{filter === 'Discover' ? <div className="py-8"><CuratedContentGrid type="pact" /></div> : query.isLoading ? <p className="py-12 text-sm text-[var(--pact-text-muted)]">Loading pacts…</p> : Object.keys(grouped).length === 0 ? <p className="border-b border-[var(--pact-hairline)] py-12 text-center text-sm text-[var(--pact-text-muted)]">No pacts in this view.</p> : <div>{(Object.entries(grouped) as [string, any[]][]).map(([name, rows]) => <section key={name} className="pt-8"><h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-[var(--pact-violet)]">{name}</h2><div className="flex flex-col gap-3">{rows.map((pact: any) => { const progress = getPactProgress(pact); return <Link href={`/pacts/${pact.id}`} key={pact.id} className="flex items-center gap-4 rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-4 transition hover:border-[var(--pact-violet)] hover:bg-[var(--pact-surface-2)]"><PactProgressRing completed={progress.completed} total={progress.total} missed={progress.missed} size={58} momentum={hasPactMomentum(pact)} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-bold text-[var(--pact-text)]">{pact.title}</h3>{pact.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-[var(--pact-violet)]" />}</div><p className="mt-1 text-sm text-[var(--pact-text-muted)]">Day {progress.completed} of {progress.total}</p></div>{progress.missed > 0 && <span className="text-xs text-[var(--pact-danger)]">{progress.missed} missed</span>}</Link>})}</div></section>)}{filtered.length > 3 && <button type="button" onClick={() => setShowAllPacts(v => !v)} className="mt-8 w-full rounded-full border border-[var(--pact-hairline)] py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pact-text-muted)] transition hover:border-[var(--pact-violet)] hover:text-[var(--pact-text)]">{showAllPacts ? 'Show less' : `View all ${filtered.length}`}</button>}</div>}</div><BottomNav /></main>
}
