'use client';

import Link from 'next/link';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import DareCard from '@/components/DareCard';
import DareTimeRing from '@/components/DareTimeRing';
import CreateDareModal from '@/components/CreateDareModal';
import { useDareFeed, useMyDares } from '@/hooks/useDareQueries';
import { useAuthStore } from '@/store/auth';
import { getTimeRing, isDareExpired, parseApiDate } from '@/lib/dareCountdown';
import { getDisplayName } from '@/lib/displayName';

type Tab = 'for-you' | 'sent' | 'discover' | 'expired';
type StatusFilter = 'accepted' | 'completed';

/** The deadline that actually applies to a dare right now — respond_by while
 * still pending a response, complete_by once accepted. Used uniformly for
 * both "For You" and "Sent by You" rows, since these are dare-level fields,
 * not per-viewer ones. */
function getActiveTarget(dare: any) {
  if (dare.my_recipient_status === 'accepted') return dare.complete_by;
  if (dare.my_recipient_status === 'pending') return dare.respond_by;
  // Creator's own sent dares have no personal recipient status — fall back
  // to whichever deadline is still ahead of us.
  const respondBy = parseApiDate(dare.respond_by);
  if (respondBy && respondBy.getTime() > Date.now()) return dare.respond_by;
  return dare.complete_by ?? dare.respond_by;
}

function isResolved(dare: any) {
  return ['completed', 'failed', 'declined', 'expired'].includes(dare.my_recipient_status || dare.status);
}

// useSearchParams() (for the ?tab=/?status= deep links from the dashboard
// stat cards) requires a Suspense boundary around any client component that
// calls it, or `next build` fails prerendering this page.
export default function DaresPage() {
  return (
    <Suspense fallback={null}>
      <DaresPageInner />
    </Suspense>
  );
}

function DaresPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('for-you');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuthStore();

  // Deep-link support for the dashboard stat cards: /dares?tab=for-you jumps
  // straight to a tab, /dares?status=accepted shows a cross-tab status
  // filter (see statusFilter below) since "Accepted"/"Completed" cut across
  // For You and Sent by You rather than mapping to a single tab.
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');
  const statusFilter: StatusFilter | null = statusParam === 'accepted' || statusParam === 'completed' ? statusParam : null;
  useEffect(() => {
    if (tabParam === 'for-you' || tabParam === 'sent' || tabParam === 'discover' || tabParam === 'expired') {
      setTab(tabParam);
    }
  }, [tabParam]);

  const clearStatusFilter = () => router.push('/dares');

  const feedQuery = useDareFeed();
  // GET /api/dares/mine already returns dares where the viewer is either
  // the creator or a recipient — "For You" and "Sent by You" are both
  // client-side filters over this single result, not separate endpoints.
  const myDaresQuery = useMyDares();
  const mineAll = useMemo(
    () => myDaresQuery.data?.pages?.flatMap((page) => page.data) || [],
    [myDaresQuery.data],
  );

  // "For You" = dares the viewer is a recipient on AND still needs their
  // attention: either awaiting a response (pending) or accepted but not
  // yet past its complete_by deadline (in progress, needs proof). Expired
  // ones move to their own "Expired" tab instead of sitting here looking
  // actionable when they no longer are.
  const forYou = useMemo(
    () =>
      mineAll.filter((d: any) => {
        if (d.creator_id === user?.id) return false;
        if (isDareExpired(d)) return false;
        if (d.my_recipient_status === 'pending') return true;
        if (d.my_recipient_status === 'accepted') {
          const completeBy = parseApiDate(d.complete_by);
          return !completeBy || completeBy.getTime() > Date.now();
        }
        return false;
      }),
    [mineAll, user?.id],
  );
  const sentByYou = useMemo(
    () => mineAll.filter((d: any) => d.creator_id === user?.id && !isDareExpired(d)),
    [mineAll, user?.id],
  );
  // Expired = missed its deadline without ever resolving (no accept/decline,
  // or accepted but proof never uploaded) — pulled out of For You/Sent by
  // You above so a dare that can no longer be acted on doesn't sit mixed in
  // with ones that still can.
  const expiredDares = useMemo(() => mineAll.filter((d: any) => isDareExpired(d)), [mineAll]);
  const discover = feedQuery.data?.pages?.flatMap((page) => page.data) || [];

  // Stat card scope: all three numbers read from the same mineAll set as
  // the hero count above, so the header stays internally consistent.
  // "Waiting on you" stays strictly-pending (awaiting your response) —
  // the actionable-right-now number, matching the tab badge below.
  //
  // "Accepted"/"Completed" are scoped to `my_recipient_status` only — i.e.
  // dares sent TO the viewer that they personally accepted/completed. The
  // `dare.status === 'accepted'` fallback that used to be OR'd in here was
  // dead code: per the backend (see app/api/dares.py accept_dare/
  // decline_dare), accepting or declining only ever writes to the
  // DareRecipient row, never to the top-level Dare.status field, so that
  // field never actually reaches "accepted"/"completed" for dares the
  // viewer created. Practically, this means these two stats can only ever
  // reflect the viewer's own responses to dares THEY received — a dare the
  // viewer sent that a recipient accepted does not increment either count,
  // and there is currently no way to show that without a per-dare
  // recipients fetch. See BACKEND_SPEC_DARE_SENT_STATUS_AGGREGATE.md for
  // the aggregate field this needs from the backend to fix properly.
  const waitingOnYou = useMemo(() => mineAll.filter((d: any) => d.my_recipient_status === 'pending').length, [mineAll]);
  const acceptedDares = useMemo(() => mineAll.filter((d: any) => d.my_recipient_status === 'accepted'), [mineAll]);
  const completedDares = useMemo(() => mineAll.filter((d: any) => d.my_recipient_status === 'completed'), [mineAll]);
  const acceptedCount = acceptedDares.length;
  const completedCount = completedDares.length;
  const statusFiltered = statusFilter === 'accepted' ? acceptedDares : statusFilter === 'completed' ? completedDares : null;

  // "Running out of time" — the 3 most time-critical active dares across
  // both For You and Sent by You (per product decision: urgency should
  // surface regardless of who needs to act next).
  const urgentDares = useMemo(() => {
    return mineAll
      .filter((d: any) => !isResolved(d))
      .map((d: any) => ({ dare: d, ring: getTimeRing(getActiveTarget(d), d.created_at) }))
      .filter((entry) => entry.ring.tier !== 'expired')
      .sort((a, b) => a.ring.hoursRemaining - b.ring.hoursRemaining)
      .slice(0, 3);
  }, [mineAll]);

  const currentQuery = tab === 'discover' ? feedQuery : myDaresQuery;
  // A status filter (from the "Accepted"/"Completed" stat) takes over the
  // list entirely, independent of whichever tab happens to be selected —
  // these statuses cut across For You and Sent by You, so pinning them to
  // one tab would hide half the matches.
  const dares = statusFiltered ?? (tab === 'for-you' ? forYou : tab === 'sent' ? sentByYou : tab === 'expired' ? expiredDares : discover);
  const isLoading = tab === 'discover' ? feedQuery.isLoading : myDaresQuery.isLoading;

  const emptyCopy: Record<Tab, string> = {
    'for-you': 'No dares waiting on your response.',
    sent: "You haven't sent any dares yet.",
    discover: 'No dares available yet. Create one to get started!',
    expired: 'No expired dares.',
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'for-you', label: 'For You', count: waitingOnYou },
    { id: 'sent', label: 'Sent by You' },
    { id: 'discover', label: 'Discover' },
    { id: 'expired', label: 'Expired', count: expiredDares.length },
  ];

  return (
    <main className="min-h-screen bg-[var(--pact-bg)] pb-28 text-[var(--pact-text)]">
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-8 md:px-10 md:pt-14">
        {/* Hero */}
        <header className="border-b border-[var(--pact-hairline)] pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--pact-violet)]">Dares</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-6xl font-black leading-none tracking-[-0.07em] text-[var(--pact-text)] md:text-7xl">{mineAll.length}</span>
            <span className="text-balance text-xl font-medium leading-[1.15] tracking-[-0.02em] text-[var(--pact-text-muted)] md:text-2xl">
              Dares keeping<br />you on your toes
            </span>
          </div>

          {/* Unified stat card — each stat is a real link into the filtered
              view it describes, not just a static number. */}
          <div className="mt-6 flex items-stretch divide-x divide-[var(--pact-hairline)] rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)]">
            <Link
              href="/dares?tab=for-you"
              className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]"
            >
              <p className="text-lg font-black text-[var(--pact-text)]">{waitingOnYou}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Waiting on you</p>
            </Link>
            <Link
              href="/dares?status=accepted"
              className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]"
            >
              <p className="text-lg font-black text-[var(--pact-text)]">{acceptedCount}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Accepted</p>
            </Link>
            <Link
              href="/dares?status=completed"
              className="flex-1 px-4 py-3 text-center transition hover:bg-[var(--pact-surface-2)]"
            >
              <p className="text-lg font-black text-[var(--pact-text)]">{completedCount}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Completed</p>
            </Link>
          </div>
        </header>

        {/* "New" gets its own centered row directly under the stat card —
            previously it shared a cramped flex row with the tab nav, which
            forced "For You" and "Sent by You" to wrap onto two lines. */}
        <div className="flex justify-center pt-6">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="pact-btn-glow flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[var(--pact-text)]"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            <Plus className="h-4 w-4" />
            New Dare
          </button>
        </div>

        {/* Tabs — replaced by a status-filter banner when a stat with a
            cross-tab status (Accepted/Completed) was clicked, since that
            filter doesn't belong to any single tab. Own row, horizontally
            scrollable so labels never wrap even on narrow screens. */}
        <div className="border-b border-[var(--pact-hairline)] pt-5">
          {statusFilter ? (
            <div className="flex items-center gap-2 pb-3 text-sm font-semibold text-[var(--pact-text)]">
              Showing:{' '}
              <span className="capitalize" style={{ color: 'var(--pact-violet)' }}>{statusFilter}</span>
              <button
                type="button"
                onClick={clearStatusFilter}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--pact-text-muted)] transition hover:text-[var(--pact-text)]"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
          ) : (
            <nav className="flex gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Dare filters">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-shrink-0 items-center gap-1.5 pb-3 text-sm font-semibold transition ${
                    tab === t.id ? 'text-[var(--pact-text)]' : 'text-[var(--pact-text-muted)] hover:text-[var(--pact-text-dim)]'
                  }`}
                >
                  {t.label}
                  {!!t.count && (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[var(--pact-bg)]"
                      style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                    >
                      {t.count}
                    </span>
                  )}
                  {tab === t.id && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full" style={{ background: 'var(--pact-violet)' }} />
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Running out of time */}
        {!isLoading && urgentDares.length > 0 && (
          <section className="border-b border-[var(--pact-hairline)] py-6" aria-label="Running out of time">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--pact-text-muted)]">Running out of time</h2>
            <div className="flex gap-6 overflow-x-auto pb-1">
              {urgentDares.map(({ dare }: any) => {
                const isSent = dare.creator_id === user?.id;
                const target = getActiveTarget(dare);
                const name = isSent
                  ? dare.recipients?.[0]?.full_name || dare.recipients?.[0]?.username || 'Recipient'
                  : getDisplayName(dare.creator_id, dare.creator_full_name || dare.creator_username);
                const avatarUrl = isSent ? dare.recipients?.[0]?.avatar_url : dare.creator_avatar_url;
                const username = isSent ? dare.recipients?.[0]?.username : dare.creator_username;
                return (
                  <Link key={dare.id} href={`/dares/${dare.id}`} className="flex shrink-0 flex-col items-center gap-1 text-center">
                    <DareTimeRing name={name} avatarUrl={avatarUrl} username={username} target={target} windowStart={dare.created_at} size={64} showLabel={false} />
                    <span className="max-w-20 truncate text-[11px] font-semibold text-[var(--pact-text-dim)]">{dare.title}</span>
                    <span className="text-[10px] font-bold" style={{ color: getTimeRing(target, dare.created_at).color }}>
                      {getTimeRing(target, dare.created_at).label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Content */}
        <div className="py-6">
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="pact-shimmer h-28 rounded-[28px]" />
              ))}
            </div>
          )}

          {!isLoading && dares.length === 0 && (
            <div className="pact-card rounded-[28px] text-center py-12" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
              <p className="text-[var(--pact-text-dim)] mb-4">
                {statusFilter ? `No ${statusFilter} dares.` : emptyCopy[tab]}
              </p>
              {/* CTA is tab-contextual — "Send Your First Dare" only makes
                  sense on Sent by You (sending is something the viewer does),
                  not on "For You" (a page of dares the viewer receives).
                  Expired and the status-filtered views get no CTA at all —
                  there's nothing actionable to do about either. */}
              {!statusFilter && tab === 'for-you' && (
                <button
                  onClick={() => setTab('discover')}
                  className="pact-btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-[var(--pact-text)]"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  Browse Discover
                </button>
              )}
              {!statusFilter && tab === 'sent' && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="pact-btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-[var(--pact-text)]"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  <Plus className="w-4 h-4" />
                  Send Your First Dare
                </button>
              )}
              {!statusFilter && tab === 'discover' && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="pact-btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-[var(--pact-text)]"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  <Plus className="w-4 h-4" />
                  Create a Dare
                </button>
              )}
            </div>
          )}

          {dares.length > 0 && (
            <div className="space-y-4">
              {dares.map((dare: any, index: number) => (
                <div key={dare.id} className="pact-list-item" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                  {/* acceptedDares/completedDares are always scoped to
                      my_recipient_status, i.e. dares the viewer received, so
                      that view is always "for-you" context. The Expired tab
                      mixes both directions, so it's determined per-dare
                      instead of from the tab itself. */}
                  <DareCard
                    dare={dare}
                    viewerContext={
                      statusFilter
                        ? 'for-you'
                        : tab === 'expired'
                          ? dare.creator_id === user?.id ? 'sent' : 'for-you'
                          : tab
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More — only meaningful for Discover, which is
              server-paginated; For You / Sent by You are client-side
              filters over the single getMine() page set. */}
          {tab === 'discover' && currentQuery.hasNextPage && !isLoading && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => currentQuery.fetchNextPage()}
                disabled={currentQuery.isFetchingNextPage}
                className="pact-btn-glow px-6 py-2.5 rounded-full border text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
              >
                {currentQuery.isFetchingNextPage ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}

          {currentQuery.isError && (
            <div className="text-center py-8">
              <p className="mb-4" style={{ color: 'var(--pact-pink)' }}>Failed to load dares</p>
              <button
                onClick={() => currentQuery.refetch()}
                className="pact-btn-glow px-4 py-2 rounded-full border border-[var(--pact-hairline)] text-sm font-semibold text-[var(--pact-text)] hover:bg-[var(--pact-surface)]"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateDareModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </main>
  );
}
