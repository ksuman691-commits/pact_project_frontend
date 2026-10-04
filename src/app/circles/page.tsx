'use client'

 import Link from 'next/link'
 import Image from 'next/image'
 import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Plus, Sparkles } from 'lucide-react'
import { useCircles } from '@/hooks/useCircles'
import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import PendingCircleInvites from '@/components/PendingCircleInvites'
import ConnectSimilarFolksModal from '@/components/ConnectSimilarFolksModal'
import Ring, { type RingMember } from '@/components/classic/Ring'

// The backend's circle/member payload has no "submitted proof this week"
// field on either Circle or User yet (see BACKEND_SPEC_CIRCLE_ACTIVITY.md,
// written below) — only `member_count`. Per the honesty rule, every
// member's ring seat renders unlit and every circle's arc stays at 0
// until that field exists; this is NOT the same as faking "0 active",
// it IS the real value given what's actually known today.
function toRingMembers(circle: any): RingMember[] {
  const members = Array.isArray(circle.members) ? circle.members : []
  if (members.length > 0) {
    return members.map((m: any) => ({
      userId: m.id ?? m.user_id ?? m.username,
      name: m.full_name || m.username,
      avatarUrl: m.avatar_url || null,
      activeThisWeek: false,
    }))
  }
  // No member list on this payload shape — still render an owner seat so
  // the ring isn't completely bare, using data we do have.
  if (circle.owner_username) {
    return [{ userId: circle.owner_id, name: circle.owner_username, avatarUrl: circle.owner_avatar_url || null, activeThisWeek: false }]
  }
  return []
}

export default function CirclesPage() {
  const { user } = useAuthStore()
  const [connectModalOpen, setConnectModalOpen] = useState(false)
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
  const searchFiltered = useMemo(() => {
    const list = circles.filter((circle: any) => (circle.name || '').toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a: any, b: any) => sort === 'Alphabetical (A-Z)' ? a.name.localeCompare(b.name) : (b.member_count || 0) - (a.member_count || 0))
  }, [circles, search, sort])
  // Membership filter — who can JOIN the circle, not who can see its
  // content. The backend circle record only ever stores a binary
  // `visibility: 'public' | 'private'` (confirmed against the live API);
  // there is no separate "approval required" vs "invite only" field
  // persisted server-side, even though the create-circle wizard presents
  // those as distinct choices (see types/createCircleFlow.ts) — both
  // collapse to 'private' on save. So "Open to join" here means
  // visibility === 'public' and "Invite only" means visibility ===
  // 'private'; a circle that was created as "Approval required" is
  // indistinguishable from a true invite-only one in this data and will
  // show up under "Invite only" too.
  const isOpenToJoin = (circle: any) => (circle.visibility ? circle.visibility === 'public' : circle.is_public !== false)
  const membershipFilters = ['All', 'Open to join', 'Invite only'] as const
  const [membershipFilter, setMembershipFilter] = useState<(typeof membershipFilters)[number]>('All')
  const openToJoinCount = useMemo(() => searchFiltered.filter(isOpenToJoin).length, [searchFiltered])
  const inviteOnlyCount = searchFiltered.length - openToJoinCount
  const filtered = useMemo(() => {
    if (membershipFilter === 'All') return searchFiltered
    return searchFiltered.filter((circle: any) => (membershipFilter === 'Open to join' ? isOpenToJoin(circle) : !isOpenToJoin(circle)))
  }, [searchFiltered, membershipFilter])
  const maxMembers = Math.max(1, ...circles.map((c: any) => c.member_count || 0))
  // Sort: most members-active-this-week first, quiet circles last. Since
  // that real signal doesn't exist on the API yet (see toRingMembers
  // above), this currently can't distinguish circles by it and falls back
  // to member_count, same as the default sort above — it will start doing
  // the real thing automatically once the field ships.
  const sortedByActivity = useMemo(() => [...filtered].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)), [filtered])

  return <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]"><div className="mx-auto max-w-2xl px-4">
    <PendingCircleInvites />
    <header className="flex flex-col gap-2 px-2 pb-2 pt-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">CIRCLES</p>
      <h1 className="text-balance font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.01em] text-[var(--ink)]">
        The people who hold you to it.
      </h1>
      <p className="text-[14px] leading-[1.5] text-[var(--muted)]">
        Each ring lights one seat for every member who showed proof this week. Quiet is fine — it&apos;s just honest.
      </p>
    </header>

    <div className="flex flex-wrap items-center justify-center gap-3 px-2 pt-6">
      <Link
        href="/circles/create"
        className="flex h-11 items-center gap-2 rounded-full bg-[var(--navy)] px-6 text-[14px] font-semibold text-[var(--card)] transition hover:bg-[var(--navy-hover)]"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} />
        New circle
      </Link>
      <button
        type="button"
        onClick={() => setConnectModalOpen(true)}
        className="flex h-11 items-center gap-2 rounded-full border border-[var(--navy)] px-6 text-[14px] font-semibold text-[var(--navy)]"
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        Connect me with similar folks
      </button>
    </div>

    <div className="flex items-center gap-3 px-2 py-5">
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--card)] px-4 text-[14px] text-[var(--muted)]">
        <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" />
      </label>
      <div className="relative shrink-0">
        <button onClick={() => setSortOpen(v => !v)} className="flex h-11 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--card)] px-3 text-[13px] text-[var(--ink-soft)]">
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.7} />
        </button>
        {sortOpen && <div className="absolute right-0 top-12 z-10 w-48 rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] py-2">{['Recent activity', 'Alphabetical (A-Z)', 'Most active', 'Member count', 'Newest circle', 'Most pacts'].map(option => <button key={option} onClick={() => { setSort(option); setSortOpen(false) }} className="block w-full px-3 py-2 text-left text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">{option}</button>)}</div>}
      </div>
    </div>

    {/* Membership filter — who can JOIN, not who can see content. */}
    <nav className="flex gap-2 overflow-x-auto px-2 pb-2" aria-label="Circle membership filters">
      {membershipFilters.map(item => {
        const count = item === 'All' ? searchFiltered.length : item === 'Open to join' ? openToJoinCount : inviteOnlyCount
        return (
          <button
            key={item}
            type="button"
            onClick={() => setMembershipFilter(item)}
            className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition ${membershipFilter === item ? 'bg-[var(--navy)] text-[var(--card)]' : 'border border-[var(--hairline)] text-[var(--ink-soft)]'}`}
          >
            {item} ({count})
          </button>
        )
      })}
    </nav>

    <h2 className="px-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Browse circles</h2>
    <section className="flex snap-x gap-3 overflow-x-auto px-2 py-4" aria-label="Browse circles">
      {isLoading ? <p className="text-[13px] text-[var(--muted)]">Loading circles…</p> : circlesQuery.isError ? <div className="flex w-full flex-col gap-3 py-4 text-[13px] text-[var(--muted)]"><p>We couldn&apos;t load your circles.</p><button type="button" onClick={() => circlesQuery.refetch()} className="w-fit h-10 rounded-full border border-[var(--navy)] px-4 font-semibold text-[var(--navy)]">Try again</button></div> : filtered.length === 0 ? <p className="py-4 text-[13px] text-[var(--muted)]">No circles found. Create one to get started.</p> : filtered.map((circle: any) => {
        const ringMembers = toRingMembers(circle)
        const activeCount = ringMembers.filter(m => m.activeThisWeek).length
        return (
          <Link key={circle.id} href={`/circles/${circle.id}`} className="flex w-[150px] shrink-0 flex-col items-center gap-2 rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-3 py-4 text-center snap-start">
            <Ring circleName={circle.name} members={ringMembers} totalMemberCount={circle.member_count || ringMembers.length} size="tile" coverPhotoUrl={circle.photo_url} />
            <span className="w-full truncate font-serif text-[17px] text-[var(--ink)]">{circle.name}</span>
            <span className="text-[12px] text-[var(--muted)]">
              {circle.member_count || 0} member{circle.member_count === 1 ? '' : 's'} · {activeCount > 0 ? `${activeCount} showed up` : 'quiet this week'}
            </span>
          </Link>
        )
      })}
    </section>

    <section className="border-t border-[var(--hairline)] px-2">
      <div className="flex items-baseline justify-between py-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Your circles</h2>
        <span className="font-mono text-[11px] text-[var(--muted)]">{filtered.length} total</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(showAllCircles ? sortedByActivity : sortedByActivity.slice(0, 4)).map((circle: any) => {
          const ringMembers = toRingMembers(circle)
          const activeCount = ringMembers.filter(m => m.activeThisWeek).length
          return (
            <Link
              key={circle.id}
              href={`/circles/${circle.id}`}
              className="flex flex-col items-center gap-3 rounded-[6px] border border-[var(--hairline)] bg-[var(--card)] px-3 py-4"
            >
              <Ring circleName={circle.name} members={ringMembers} totalMemberCount={circle.member_count || ringMembers.length} size="tile" coverPhotoUrl={circle.photo_url} />
              <span className="w-full truncate text-center font-serif text-[17px] text-[var(--ink)]">{circle.name}</span>
              <span className="text-center text-[12px] text-[var(--muted)]">
                {circle.member_count || 0} member{circle.member_count === 1 ? '' : 's'} · {activeCount > 0 ? `${activeCount} showed up` : 'quiet this week'}
              </span>
            </Link>
          )
        })}
      </div>
      {filtered.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAllCircles(v => !v)}
          className="mt-4 h-11 w-full rounded-full border border-[var(--navy)] text-[13px] font-semibold text-[var(--navy)]"
        >
          {showAllCircles ? 'Show less' : `View all ${filtered.length}`}
        </button>
      )}
    </section>
  </div>
  <ConnectSimilarFolksModal isOpen={connectModalOpen} onClose={() => setConnectModalOpen(false)} />
  </main>
}
