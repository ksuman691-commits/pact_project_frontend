'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, TrendingUp, Users } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useCircles, usePublicCircles, useSearchCircles } from '@/hooks/useCircles';
import { useJoinCircle } from '@/hooks/useCircleMutations';
import TopNav from '@/components/TopNav';
import CircleCard from '@/components/CircleCard';
import toast from 'react-hot-toast';

export default function CirclesPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'all' | 'my' | 'public' | 'trending'>('all');
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
    isPrivate: circle.visibility === 'private' || circle.isPrivate === true,
    isJoined: circle.isJoined || false,
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

  const handleJoin = async (circleId: number, isPublicCircle: boolean = true) => {
    try {
      await joinMutation.mutateAsync({
        circleId,
        isPublic: isPublicCircle,
      });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <>
      <TopNav showBack={false} showCategories={false} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
          <div className="px-4 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Circles</h1>
              <p className="text-gray-600 text-sm mt-1">Join communities and stay accountable together</p>
            </div>

            <Link href="/circles/create">
              <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Create Circle
              </button>
            </Link>

          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Sort Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All Circles', icon: '🌐' },
              { key: 'my', label: 'My Circles', icon: '👤' },
              { key: 'public', label: 'Public', icon: '🔓', action: () => setSortBy('public') },
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
                className={`px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  sortBy === tab.key
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
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
            <p className="text-gray-600 text-lg font-medium mb-2">No circles found</p>
            <p className="text-gray-500 mb-6">
              {search ? 'Try a different search' : 'Explore communities and join circles'}
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
    </>
  );
}
