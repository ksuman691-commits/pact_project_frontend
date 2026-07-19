'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useCircles, usePublicCircles, useSearchCircles } from '@/hooks/useCircles';
import { useJoinCircle } from '@/hooks/useCircleMutations';
import TopNav from '@/components/TopNav';
import CircleCard from '@/components/CircleCard';
import MemberSearchModal from '@/components/MemberSearchModal';
import toast from 'react-hot-toast';

export default function CirclesPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'all' | 'my' | 'public' | 'trending'>('all');
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const { ref, inView } = useInView();

  // Fetch different circle lists based on sort
  const myCircles = useCircles();
  const publicCircles = usePublicCircles();
  const searchResults = useSearchCircles(search);
  const joinMutation = useJoinCircle();
  const publicHasNextPage = publicCircles.hasNextPage;
  const publicFetchNextPage = publicCircles.fetchNextPage;
  const searchHasNextPage = searchResults.hasNextPage;
  const searchFetchNextPage = searchResults.fetchNextPage;

  const toCardShape = (circle: any) => ({
    id: circle.id,
    name: circle.name,
    description: circle.description || '',
    avatar: circle.icon_emoji || circle.name?.charAt(0) || 'C',
    ownerUsername: circle.owner_username || null,
    ownerAvatarUrl: circle.owner_avatar_url || null,
    memberCount: circle.member_count ?? circle.memberCount ?? 0,
    isJoined: circle.isJoined || circle.is_member || circle.is_joined || false,
    isTrending: false,
    memberList: circle.memberList || [],
    winRate: circle.winRate,
  });

  // Determine which hook to use
  useEffect(() => {
    if (inView && sortBy === 'public' && publicHasNextPage) {
      publicFetchNextPage();
    }
    if (inView && sortBy === 'trending' && publicHasNextPage) {
      publicFetchNextPage();
    }
    if (inView && search && searchHasNextPage) {
      searchFetchNextPage();
    }
  }, [
    inView,
    sortBy,
    search,
    publicHasNextPage,
    publicFetchNextPage,
    searchHasNextPage,
    searchFetchNextPage,
  ]);

  // Get display data
  let displayCircles: any[] = [];
  let isLoading = false;
  let hasMore = false;

  if (search) {
    displayCircles = (searchResults.data?.pages?.flatMap(p => p.data) || []).map(toCardShape);
    isLoading = searchResults.isLoading;
    hasMore = searchResults.hasNextPage || false;
  } else if (sortBy === 'my') {
    displayCircles = (myCircles.data || []).map(toCardShape);
    isLoading = myCircles.isLoading;
  } else if (sortBy === 'public' || sortBy === 'trending') {
    displayCircles = (publicCircles.data?.pages?.flatMap(p => p.data) || []).map(toCardShape);
    isLoading = publicCircles.isLoading;
    hasMore = publicCircles.hasNextPage || false;
  } else {
    // Mix my circles + public circles
    const myList = (myCircles.data || []).map(toCardShape);
    const publicList = (publicCircles.data?.pages?.[0]?.data || []).map(toCardShape);
    displayCircles = [...myList, ...publicList];
    isLoading = myCircles.isLoading || publicCircles.isLoading;
  }

  const handleJoin = async (circleId: number) => {
    try {
      await joinMutation.mutateAsync({ circleId });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <>
      <TopNav showBack={false} showCategories={false} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/70 sticky top-24 z-40">
          <div className="px-4 py-8 flex items-center justify-between gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950">Circles</h1>

            <div className="flex gap-2">
              <button
                onClick={() => setMemberSearchOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition"
                aria-label="Search members"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <Link href="/circles/create">
                <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition hover:shadow-[0_12px_28px_rgba(16,185,129,0.35)] hover:-translate-y-0.5">
                  <Plus className="h-4 w-4" />
                  Create Circle
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6">
        {/* Search and Filters */}
        <div className="space-y-5 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border border-white/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 text-slate-900 placeholder-slate-400 transition shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
            />
          </div>

          {/* Sort Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
            {[
              { key: 'all', label: 'All Circles', icon: '🌐' },
              { key: 'my', label: 'My Circles', icon: '👤' },
                { key: 'public', label: 'Discover', icon: '🧭', action: () => setSortBy('public') },
              { key: 'trending', label: 'Trending', icon: '🔥', action: () => setSortBy('trending') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setSortBy(tab.key as any);
                  // Trigger data fetch for public/trending
                  if ((tab.key === 'public' || tab.key === 'trending') && publicCircles.data?.pages?.length === 0) {
                    publicCircles.refetch();
                  }
                }}
                className={`snap-start shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition ${
                  sortBy === tab.key
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)]'
                    : 'bg-white/80 text-slate-700 border border-white/70 hover:bg-white/90 hover:border-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50/80 to-transparent pointer-events-none rounded-r-2xl" />
          </div>
        </div>

        {/* Circles Grid */}
        {isLoading && displayCircles.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayCircles.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No circles match your search</p>
            <p className="text-gray-500 mb-6">
              {search ? 'Try a different search.' : 'Explore communities and join circles.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayCircles.map((circle) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  onJoin={handleJoin}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div ref={ref} className="py-12 flex justify-center">
                {isLoading ? (
                  <div className="text-gray-600">Loading more circles...</div>
                ) : (
                  <button
                    onClick={() => {
                      if (search) searchResults.fetchNextPage();
                      else if (sortBy === 'public' || sortBy === 'trending')
                        publicCircles.fetchNextPage();
                    }}
                    className="px-6 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Member Search Modal */}
      <MemberSearchModal isOpen={memberSearchOpen} onClose={() => setMemberSearchOpen(false)} />
    </>
  );
}
