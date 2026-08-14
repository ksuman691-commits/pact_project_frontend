'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useCircles, usePublicCircles, useSearchCircles } from '@/hooks/useCircles';
import { useJoinCircle } from '@/hooks/useCircleMutations';
import TopNav from '@/components/TopNav';
import CircleCard from '@/components/CircleCard';
import MemberSearchModal from '@/components/MemberSearchModal';
import AnimatedTabs from '@/components/pact-ui/AnimatedTabs';

export default function CirclesPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'all' | 'my' | 'public' | 'trending'>('all');
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const { ref, inView } = useInView();
  const shouldFetchPublic = sortBy === 'all' || sortBy === 'public' || sortBy === 'trending';

  // Fetch different circle lists based on sort
  const myCircles = useCircles();
  const publicCircles = usePublicCircles(shouldFetchPublic);
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
    <div className="pact-flow pact-page-enter min-h-screen">
      <TopNav showBack={false} showCategories={false} />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div
          className="sticky top-24 z-40 backdrop-blur"
          style={{ background: 'var(--pact-bg)', borderBottom: '1px solid var(--pact-hairline)' }}
        >
          <div className="px-4 py-8 flex items-center justify-between gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--pact-text)]">Circles</h1>

            <div className="flex gap-2">
              <button
                onClick={() => setMemberSearchOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full transition"
                style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
                aria-label="Search members"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link href="/circles/create">
                <button className="pact-btn-glow inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}>
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
            <Search className="absolute left-4 top-4 w-5 h-5" style={{ color: 'var(--pact-text-faint)' }} />
            <input
              type="text"
              placeholder="Search circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-[24px] outline-none focus:ring-2 transition"
              style={{
                background: 'var(--pact-surface)',
                border: '1px solid var(--pact-hairline)',
                color: 'var(--pact-text)',
              }}
            />
          </div>

          {/* Sort Tabs */}
          <AnimatedTabs
            layoutId="circles-sort-tabs"
            activeId={sortBy}
            onChange={(id) => {
              setSortBy(id as any);
              if ((id === 'public' || id === 'trending') && publicCircles.data?.pages?.length === 0) {
                publicCircles.refetch();
              }
            }}
            tabs={[
              { id: 'all', label: 'All Circles' },
              { id: 'my', label: 'My Circles' },
              { id: 'public', label: 'Discover' },
              { id: 'trending', label: 'Trending' },
            ]}
          />
        </div>

        {/* Circles Grid */}
        {isLoading && displayCircles.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="pact-shimmer h-48 rounded-[24px]" style={{ background: 'var(--pact-surface-2)' }} />
            ))}
          </div>
        ) : displayCircles.length === 0 ? (
          <div className="pact-card rounded-[24px] text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--pact-text-faint)' }} />
            <p className="text-[var(--pact-text-dim)] text-lg font-medium mb-2">No circles match your search</p>
            <p className="text-[var(--pact-text-faint)] mb-6">
              {search ? 'Try a different search.' : 'Explore communities and join circles.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayCircles.map((circle, index) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  onJoin={handleJoin}
                  index={index}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div ref={ref} className="py-12 flex justify-center">
                {isLoading ? (
                  <div className="text-[var(--pact-text-faint)]">Loading more circles...</div>
                ) : (
                  <button
                    onClick={() => {
                      if (search) searchResults.fetchNextPage();
                      else if (sortBy === 'public' || sortBy === 'trending')
                        publicCircles.fetchNextPage();
                    }}
                    className="px-6 py-2 font-medium rounded-[28px] transition"
                    style={{ color: 'var(--pact-violet)' }}
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
    </div>
  );
}
