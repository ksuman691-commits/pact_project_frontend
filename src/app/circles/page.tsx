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
  const joinMutation = useJoinCircle(0);

  // Determine which hook to use
  useEffect(() => {
    if (inView && sortBy === 'public' && publicCircles.hasNextPage) {
      publicCircles.fetchNextPage();
    }
    if (inView && sortBy === 'trending' && publicCircles.hasNextPage) {
      publicCircles.fetchNextPage();
    }
    if (inView && search && searchResults.hasNextPage) {
      searchResults.fetchNextPage();
    }
  }, [inView, sortBy, search, publicCircles, searchResults]);

  // Get display data
  let displayCircles: any[] = [];
  let isLoading = false;
  let hasMore = false;

  if (search) {
    displayCircles = searchResults.data?.pages?.flatMap(p => p.data) || [];
    isLoading = searchResults.isLoading;
    hasMore = searchResults.hasNextPage || false;
  } else if (sortBy === 'my') {
    displayCircles = myCircles.data || [];
    isLoading = myCircles.isLoading;
  } else if (sortBy === 'public' || sortBy === 'trending') {
    displayCircles = publicCircles.data?.pages?.flatMap(p => p.data) || [];
    isLoading = publicCircles.isLoading;
    hasMore = publicCircles.hasNextPage || false;
  } else {
    // Mix my circles + public circles
    const myList = myCircles.data || [];
    const publicList = publicCircles.data?.pages?.[0]?.data || [];
    displayCircles = [...myList, ...publicList];
    isLoading = myCircles.isLoading || publicCircles.isLoading;
  }

  const handleJoin = async (circleId: number) => {
    try {
      await joinMutation.mutateAsync(undefined);
      toast.success('Joined circle!');
    } catch (error) {
      toast.error('Failed to join circle');
    }
  };

  // Mock data fallback
  const mockCircles = [
    {
      id: 1,
      name: 'Startup Builders',
      description: 'For founders and entrepreneurs building the next big thing',
      avatar: '🚀',
      memberCount: 234,
      isPrivate: false,
      isJoined: false,
      isTrending: true,
      memberList: ['Alice', 'Bob', 'Charlie', 'Diana'],
      winRate: 78,
    },
    {
      id: 2,
      name: 'Fitness Crew',
      description: 'Supporting each other in fitness goals and healthy lifestyle',
      avatar: '💪',
      memberCount: 456,
      isPrivate: false,
      isJoined: true,
      memberList: ['Eve', 'Frank', 'Grace'],
      winRate: 85,
    },
    {
      id: 3,
      name: 'Tech Learners',
      description: 'Learning new technologies and programming skills together',
      avatar: '💻',
      memberCount: 189,
      isPrivate: true,
      isJoined: false,
      isTrending: true,
      memberList: ['Henry', 'Iris', 'Jack', 'Kate', 'Leo'],
      winRate: 72,
    },
  ];

  const finalCircles = displayCircles.length > 0 ? displayCircles : mockCircles;

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
          <div className="px-4 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Circles</h1>
              <p className="text-gray-600 text-sm mt-1">Join communities and earn together</p>
            </div>

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
              { key: 'all', label: 'All Pacts', icon: '🌐' },
              { key: 'my', label: 'My Pacts', icon: '👤' },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : finalCircles.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">No pacts found</p>
            <p className="text-gray-500 mb-6">
              {search ? 'Try a different search' : 'Explore communities and join pacts'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finalCircles.map((circle) => (
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
