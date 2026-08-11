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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[rgba(20,18,31,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#14121F]">Dares</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#A78BFA] text-white rounded-[28px] hover:bg-emerald-700 transition"
            >
              <Plus className="w-5 h-5" />
              Create Dare
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-[rgba(20,18,31,0.06)] mb-4">
            {[
              { id: 'discover', label: 'Discover' },
              { id: 'mine', label: 'My Dares' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as 'discover' | 'mine')}
                className={`px-4 py-2 font-semibold border-b-2 transition ${
                  tab === t.id
                    ? 'text-[#A78BFA] border-emerald-600'
                    : 'text-[#6B7280] border-transparent hover:text-[#14121F]'
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
              <div key={i} className="h-48 bg-slate-200 rounded-[28px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!currentQuery.isLoading && dares.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#6B7280] mb-4">
              {tab === 'discover'
                ? 'No dares available yet. Create one to get started!'
                : 'You haven&apos;t created any dares yet.'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A78BFA] text-white rounded-[28px] hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5" />
              Create Your First Dare
            </button>
          </div>
        )}

        {/* Dares Grid */}
        {dares.length > 0 && (
          <div className="space-y-4">
            {dares.map((dare) => (
              <Link key={dare.id} href={`/dares/${dare.id}`}>
                <DareCard dare={dare} />
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {currentQuery.hasNextPage && !currentQuery.isLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => currentQuery.fetchNextPage()}
              disabled={currentQuery.isFetchingNextPage}
              className="px-6 py-2.5 border border-emerald-600 text-[#A78BFA] rounded-[28px] hover:bg-[#EDE9FE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Error State */}
        {currentQuery.isError && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load dares</p>
            <button
              onClick={() => currentQuery.refetch()}
              className="px-4 py-2 text-[#14121F] border border-slate-300 rounded-[28px] hover:bg-[#F4F2FB]"
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
