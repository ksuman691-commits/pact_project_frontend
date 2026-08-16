'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import DareCard from '@/components/DareCard';
import CreateDareModal from '@/components/CreateDareModal';
import { useDareFeed, useMyDares } from '@/hooks/useDareQueries';
import { useAuthStore } from '@/store/auth';

type Tab = 'for-you' | 'sent' | 'discover';

export default function DaresPage() {
  const [tab, setTab] = useState<Tab>('for-you');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuthStore();

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
  // yet past its complete_by deadline (in progress, needs proof).
  // Filtering to *only* 'pending' was a bug — an accepted dare fell out of
  // both this tab and "Sent by You" (viewer isn't the creator), so it
  // vanished from the page entirely once accepted. Completed/failed/
  // expired dares correctly still drop out once they're no longer
  // actionable.
  const forYou = useMemo(
    () =>
      mineAll.filter((d: any) => {
        if (d.creator_id === user?.id) return false;
        if (d.my_recipient_status === 'pending') return true;
        if (d.my_recipient_status === 'accepted') {
          return !d.complete_by || new Date(d.complete_by).getTime() > Date.now();
        }
        return false;
      }),
    [mineAll, user?.id],
  );
  const sentByYou = useMemo(() => mineAll.filter((d: any) => d.creator_id === user?.id), [mineAll, user?.id]);
  const discover = feedQuery.data?.pages?.flatMap((page) => page.data) || [];

  // The tab's badge count stays scoped to strictly-pending (awaiting
  // response) dares — that's the actionable-right-now number users expect
  // from a notification-style count, even though the tab's list itself
  // also shows in-progress accepted dares.
  const forYouCount = forYou.filter((d: any) => d.my_recipient_status === 'pending').length;

  const currentQuery = tab === 'discover' ? feedQuery : myDaresQuery;
  const dares = tab === 'for-you' ? forYou : tab === 'sent' ? sentByYou : discover;
  const isLoading = tab === 'discover' ? feedQuery.isLoading : myDaresQuery.isLoading;

  const emptyCopy: Record<Tab, string> = {
    'for-you': 'No dares waiting on your response.',
    sent: "You haven't sent any dares yet.",
    discover: 'No dares available yet. Create one to get started!',
  };

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--pact-hairline)]" style={{ background: 'var(--pact-bg)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[var(--pact-text)]">Dares</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="pact-btn-glow flex items-center gap-2 px-4 py-2 rounded-[28px] transition"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              <Plus className="w-5 h-5" />
              Send a Dare
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-[var(--pact-hairline)] mb-4">
            {[
              { id: 'for-you' as Tab, label: 'For You', count: forYouCount },
              { id: 'sent' as Tab, label: 'Sent by You' },
              { id: 'discover' as Tab, label: 'Discover' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 font-semibold border-b-2 transition ${
                  tab === t.id
                    ? 'text-[var(--pact-pink)] border-[var(--pact-pink)]'
                    : 'text-[var(--pact-text-faint)] border-transparent hover:text-[var(--pact-text-dim)]'
                }`}
              >
                {t.label}
                {!!t.count && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                    style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="pact-shimmer h-48 rounded-[28px]" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && dares.length === 0 && (
          <div className="pact-card rounded-[28px] text-center py-12">
            <p className="text-[var(--pact-text-dim)] mb-4">{emptyCopy[tab]}</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="pact-btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-[28px]"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              <Plus className="w-5 h-5" />
              Send Your First Dare
            </button>
          </div>
        )}

        {/* Dares List */}
        {dares.length > 0 && (
          <div className="space-y-4">
            {dares.map((dare: any, index: number) => (
              <div key={dare.id} className="pact-list-item" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                <DareCard dare={dare} />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button — only meaningful for Discover, which is
            server-paginated; For You / Sent by You are client-side filters
            over the single getMine() page set. */}
        {tab === 'discover' && currentQuery.hasNextPage && !isLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => currentQuery.fetchNextPage()}
              disabled={currentQuery.isFetchingNextPage}
              className="pact-btn-glow px-6 py-2.5 rounded-[28px] border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
            >
              {currentQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Error State */}
        {currentQuery.isError && (
          <div className="text-center py-8">
            <p className="mb-4" style={{ color: 'var(--pact-pink)' }}>Failed to load dares</p>
            <button
              onClick={() => currentQuery.refetch()}
              className="pact-btn-glow px-4 py-2 rounded-[28px] border border-[var(--pact-hairline)] text-[var(--pact-text)] hover:bg-[var(--pact-surface)]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Create Dare Modal */}
      <CreateDareModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}
