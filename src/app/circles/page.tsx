'use client'

 import Link from 'next/link'
 import Image from 'next/image'
 import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Plus } from 'lucide-react'
import { useCircles } from '@/hooks/useCircles'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import PendingCircleInvites from '@/components/PendingCircleInvites'

export default function CirclesPage() {
  const { user } = useAuthStore()
  const circlesQuery = useCircles()
  const circles = (circlesQuery.data || []) as any[]
  const isLoading = circlesQuery.isLoading
  const { data: statsResponse } = useQuery({ queryKey: ['user', 'stats'], queryFn: () => userService.getStats(user!.id!), enabled: Boolean(user?.id) })
  const stats = statsResponse?.data as any
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Most active')
  const [sortOpen, setSortOpen] = useState(false)
  // "Your circles" list is capped to the top 3 (already-sorted order) by
  // default, with a "View all N" button expanding it in place — no
  // navigation to a separate page. Toggling collapses it back to 3.
  const [showAllCircles, setShowAllCircles] = useState(false)
  const filtered = useMemo(() => {
    const list = circles.filter((circle: any) => (circle.name || '').toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a: any, b: any) => sort === 'Alphabetical (A-Z)' ? a.name.localeCompare(b.name) : (b.member_count || 0) - (a.member_count || 0))
  }, [circles, search, sort])
  const people = circles.reduce((sum: number, circle: any) => sum + (circle.member_count || 0), 0)
  // "Active this week" approximates pacts currently in motion across all circles —
  // there's no per-circle weekly-activity metric from the backend yet, so this
  // reuses the live pact count as the closest available signal.
  const activeThisWeek = circles.reduce((sum: number, circle: any) => sum + (circle.pact_count || circle.pacts_count || 0), 0)
  const bestStreak = stats?.current_streak || stats?.longest_streak || 0
  const maxMembers = Math.max(1, ...circles.map((c: any) => c.member_count || 0))

  return <main className="min-h-screen bg-[var(--pact-bg)] pb-28 text-[var(--pact-text)]"><div className="mx-auto max-w-5xl px-5 pb-10 pt-8 md:px-10 md:pt-14">
    <PendingCircleInvites />
    <header className="border-b border-[var(--pact-hairline)] pb-8">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Circles</p>
      <div className="mt-3 flex items-center gap-4">
        <span className="text-6xl font-black leading-none tracking-[-0.07em] text-[var(--pact-text)] md:text-7xl">{circles.length}</span>
        <span className="text-balance text-xl font-medium leading-[1.15] tracking-[-0.02em] text-[var(--pact-text-muted)] md:text-2xl">Circles holding<br />you together</span>
      </div>
      <div className="mt-6 flex items-stretch divide-x divide-[var(--pact-hairline)] rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)]">
        <Link href="/circles/people" className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]">
          <p className="text-lg font-black text-[var(--pact-text)]">{people}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">People</p>
        </Link>
        <Link href="/pacts?filter=Active" className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]">
          <p className="text-lg font-black text-[var(--pact-text)]">{activeThisWeek}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Active this week</p>
        </Link>
        <div className="flex-1 px-4 py-3 text-center">
          <p className="text-lg font-black text-[var(--pact-text)]">{bestStreak}d</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Best streak</p>
        </div>
      </div>
    </header>
    {/* "New Circle" gets its own centered row directly under the stat card,
        matching the Dares/Pacts landing pages' treatment — a prominent,
        full-width CTA rather than a small icon-only button tucked in a
        corner (the "Browse circles" heading below keeps its own "New" link
        removed in favor of this one, to avoid two competing create CTAs). */}
    <div className="flex justify-center pt-6">
      <Link
        href="/circles/create"
        className="pact-btn-glow flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[var(--pact-text)]"
        style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
      >
        <Plus className="h-4 w-4" />
        New Circle
      </Link>
    </div>
    <div className="flex items-center gap-5 border-b border-[var(--pact-hairline)] py-5 text-sm"><label className="flex min-w-0 flex-1 items-center gap-2 text-[var(--pact-text-muted)]"><Search className="h-4 w-4" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" className="min-w-0 flex-1 bg-transparent text-[var(--pact-text)] outline-none placeholder:text-[var(--pact-text-muted)]" /></label><div className="relative"><button onClick={() => setSortOpen(v => !v)} className="flex items-center gap-2 text-[var(--pact-text)]">{sort}<SlidersHorizontal className="h-3.5 w-3.5 text-[var(--pact-violet)]" /></button>{sortOpen && <div className="absolute right-0 top-7 z-10 w-48 border border-[var(--pact-hairline)] bg-[var(--pact-surface)] py-2 shadow-xl">{['Recent activity', 'Alphabetical (A-Z)', 'Most active', 'Member count', 'Newest circle', 'Most pacts'].map(option => <button key={option} onClick={() => { setSort(option); setSortOpen(false) }} className="block w-full px-3 py-2 text-left text-xs text-[var(--pact-text-muted)] hover:text-[var(--pact-text)]">{option}</button>)}</div>}</div></div>
    <div className="flex items-baseline justify-between pt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-text-muted)]">Browse circles</h2>
    </div>
    <section className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-6 md:-mx-10 md:px-10" aria-label="Your circles">{isLoading ? <p className="text-sm text-[var(--pact-text-muted)]">Loading circles…</p> : circlesQuery.isError ? <div className="flex w-full flex-col gap-3 py-4 text-sm text-[var(--pact-text-muted)]"><p>We couldn&apos;t load your circles.</p><button type="button" onClick={() => circlesQuery.refetch()} className="w-fit rounded-full border border-[var(--pact-violet)] px-4 py-2 font-semibold text-[var(--pact-text)]">Try again</button></div> : filtered.length === 0 ? <p className="py-4 text-sm text-[var(--pact-text-muted)]">No circles found. Create one to get started.</p> : filtered.map((circle: any) => {
      const activity = Math.min(1, (circle.member_count || 0) / maxMembers)
      const glow = 10 + activity * 14
      const glowOpacity = 0.28 + activity * 0.32
      return <Link key={circle.id} href={`/circles/${circle.id}`} className="flex aspect-square w-[calc((100%-2rem)/3)] max-w-36 shrink-0 grow-0 basis-[calc((100%-2rem)/3)] snap-start items-center justify-center rounded-full border border-[var(--pact-violet)]/50 bg-[var(--pact-surface)] p-3 text-center transition hover:bg-[var(--pact-surface-2)]" style={{ boxShadow: `0 0 ${glow}px rgba(157,92,255,${glowOpacity})` }}><span className="flex flex-col items-center px-2">{circle.photo_url ? <span className="relative block h-10 w-10 overflow-hidden rounded-full"><Image src={circle.photo_url} alt="" fill sizes="40px" className="object-cover" /></span> : <span className="block text-2xl">{circle.emoji || circle.icon_emoji || '◌'}</span>}<span className="mt-1 block w-full truncate text-xs font-bold leading-tight text-[var(--pact-text)]">{circle.name}</span><span className="mt-1 block text-[10px] font-semibold text-[var(--pact-gold)]">{circle.member_count || 0} active</span></span></Link>
    })}</section>
    <section className="border-t border-[var(--pact-hairline)]">
      <div className="flex items-baseline justify-between py-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-text-muted)]">Your circles</h2>
        <span className="text-xs font-semibold text-[var(--pact-gold)]">{filtered.length} total</span>
      </div>
      <div className="flex flex-col gap-3">
        {(showAllCircles ? filtered : filtered.slice(0, 3)).map((circle: any) => (
          <Link
            key={circle.id}
            href={`/circles/${circle.id}`}
            className="flex items-center justify-between rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] p-4 transition hover:border-[var(--pact-violet)] hover:bg-[var(--pact-surface-2)]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--pact-violet)]/40 bg-[var(--pact-surface-2)] text-lg">
                {circle.photo_url ? <Image src={circle.photo_url} alt="" fill sizes="40px" className="object-cover" /> : (circle.emoji || circle.icon_emoji || '◌')}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--pact-text)]">{circle.name}</p>
                <p className="text-xs font-semibold text-[var(--pact-gold)]">{circle.member_count || 0} members</p>
              </div>
            </div>
            <span className="shrink-0 pl-3 text-xs font-semibold text-[var(--pact-gold)]">{circle.current_streak || circle.streak || 0}d streak</span>
          </Link>
        ))}
      </div>
      {filtered.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAllCircles(v => !v)}
          className="mt-4 w-full rounded-full border border-[var(--pact-hairline)] py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pact-text-muted)] transition hover:border-[var(--pact-violet)] hover:text-[var(--pact-text)]"
        >
          {showAllCircles ? 'Show less' : `View all ${filtered.length}`}
        </button>
      )}
    </section>
  </div></main>
}
