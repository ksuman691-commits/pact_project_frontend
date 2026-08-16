'use client';

import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import DareCard from '@/components/DareCard';
import CreateDareModal from '@/components/CreateDareModal';
import { useDareFeed, useMyDares } from '@/hooks/useDareQueries';
import Link from 'next/link';

export default function DaresPage() {
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const feedQuery = useDareFeed();
  const myDaresQuery = useMyDares();

  const currentQuery = tab === 'discover' ? feedQuery : myDaresQuery;
  const dares = currentQuery.data?.pages?.flatMap((page) => page.data) || [];

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
              Create Dare
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-[var(--pact-hairline)] mb-4">
            {[
              { id: 'discover', label: 'Discover' },
              { id: 'mine', label: 'My Dares' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as 'discover' | 'mine')}
                className={`px-4 py-2 font-semibold border-b-2 transition ${
                  tab === t.id
                    ? 'text-[var(--pact-pink)] border-[var(--pact-pink)]'
                    : 'text-[var(--pact-text-faint)] border-transparent hover:text-[var(--pact-text-dim)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading State */}
        {currentQuery.isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="pact-shimmer h-48 rounded-[28px]" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!currentQuery.isLoading && dares.length === 0 && (
          <div className="pact-card rounded-[28px] text-center py-12">
            <p className="text-[var(--pact-text-dim)] mb-4">
              {tab === 'discover'
                ? 'No dares available yet. Create one to get started!'
                : 'You haven&apos;t created any dares yet.'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="pact-btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-[28px]"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              <Plus className="w-5 h-5" />
              Create Your First Dare
            </button>
          </div>
        )}

        {/* Dares Grid */}
        {dares.length > 0 && (
          <div className="space-y-4">
            {dares.map((dare, index) => (
              <div key={dare.id} className="pact-list-item" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                <DareCard dare={dare} />
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {currentQuery.hasNextPage && !currentQuery.isLoading && (
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
