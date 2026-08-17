'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Plus } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useCircles } from '@/hooks/useCircles'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'

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
  const filtered = useMemo(() => {
    const list = circles.filter((circle: any) => (circle.name || '').toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a: any, b: any) => sort === 'Alphabetical (A-Z)' ? a.name.localeCompare(b.name) : (b.member_count || 0) - (a.member_count || 0))
  }, [circles, search, sort])
  const people = circles.reduce((sum: number, circle: any) => sum + (circle.member_count || 0), 0)
  const pactCount = circles.reduce((sum: number, circle: any) => sum + (circle.pact_count || circle.pacts_count || 0), 0)
  const bestStreak = stats?.current_streak || stats?.longest_streak || 0

  return <main className="min-h-screen bg-[var(--pact-bg)] pb-28 text-[var(--pact-text)]"><div className="mx-auto max-w-5xl px-5 pb-10 pt-8 md:px-10 md:pt-14">
    <header className="border-b border-[var(--pact-hairline)] pb-8"><p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Circles</p><h1 className="mt-3 text-balance text-5xl font-black tracking-[-0.07em] text-[var(--pact-text)] md:text-7xl">{circles.length}<span className="ml-3 text-2xl font-medium tracking-[-0.03em] text-[var(--pact-text-muted)] md:text-3xl">circles holding you together</span></h1><p className="mt-5 text-sm font-semibold text-[var(--pact-gold)]">{people} people · {pactCount} pacts in motion · {bestStreak}d best streak</p></header>
    <div className="flex items-center gap-5 border-b border-[var(--pact-hairline)] py-5 text-sm"><label className="flex min-w-0 flex-1 items-center gap-2 text-[var(--pact-text-muted)]"><Search className="h-4 w-4" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" className="min-w-0 flex-1 bg-transparent text-[var(--pact-text)] outline-none placeholder:text-[var(--pact-text-muted)]" /></label><div className="relative"><button onClick={() => setSortOpen(v => !v)} className="flex items-center gap-2 text-[var(--pact-text)]">{sort}<SlidersHorizontal className="h-3.5 w-3.5 text-[var(--pact-violet)]" /></button>{sortOpen && <div className="absolute right-0 top-7 z-10 w-48 border border-[var(--pact-hairline)] bg-[var(--pact-surface)] py-2 shadow-xl">{['Recent activity', 'Alphabetical (A-Z)', 'Most active', 'Member count', 'Newest circle', 'Most pacts'].map(option => <button key={option} onClick={() => { setSort(option); setSortOpen(false) }} className="block w-full px-3 py-2 text-left text-xs text-[var(--pact-text-muted)] hover:text-[var(--pact-text)]">{option}</button>)}</div>}</div></div>
    <section className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-8 md:-mx-10 md:px-10" aria-label="Your circles">{isLoading ? <p className="text-sm text-[var(--pact-text-muted)]">Loading circles…</p> : filtered.map((circle: any) => <Link key={circle.id} href={`/circles/${circle.id}`} className="flex aspect-square w-[calc((100%-2rem)/3)] max-w-36 shrink-0 grow-0 basis-[calc((100%-2rem)/3)] snap-start items-center justify-center rounded-full border border-[var(--pact-violet)]/50 bg-[var(--pact-surface)] p-3 text-center transition hover:bg-[var(--pact-surface-2)]"><span className="flex flex-col items-center px-1"><span className="block text-2xl">{circle.emoji || circle.icon_emoji || '◌'}</span><span className="mt-1 line-clamp-2 break-words text-xs font-bold leading-tight text-[var(--pact-text)]">{circle.name}</span><span className="mt-1 block text-[10px] font-semibold text-[var(--pact-gold)]">{circle.member_count || 0} active</span></span></Link>)}<Link href="/circles/create" className="flex aspect-square w-[calc((100%-2rem)/3)] max-w-36 shrink-0 grow-0 basis-[calc((100%-2rem)/3)] items-center justify-center rounded-full border border-dashed border-[var(--pact-violet)] text-center text-xs font-bold text-[var(--pact-violet)]"><span><Plus className="mx-auto mb-1 h-5 w-5" />New</span></Link></section>
    <section className="border-t border-[var(--pact-hairline)]"><div className="flex items-baseline justify-between py-5"><h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-text-muted)]">Your circles</h2><span className="text-xs font-semibold text-[var(--pact-gold)]">{filtered.length} total</span></div>{filtered.map((circle: any) => <Link key={circle.id} href={`/circles/${circle.id}`} className="flex items-center justify-between border-t border-[var(--pact-hairline)] py-4 transition hover:border-[var(--pact-violet)]"><div className="flex items-center gap-3"><span className="text-xl">{circle.emoji || circle.icon_emoji || '◌'}</span><div><p className="font-bold text-[var(--pact-text)]">{circle.name}</p><p className="text-xs font-semibold text-[var(--pact-gold)]">{circle.member_count || 0} members</p></div></div><span className="text-xs font-semibold text-[var(--pact-gold)]">{circle.current_streak || circle.streak || 0}d streak</span></Link>)}</section>
  </div><BottomNav /></main>
}
