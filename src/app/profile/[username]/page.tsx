'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab, AchievementsTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/api';
import {
  useAcceptFollow,
  useFollowers,
  useFollowing,
  useFollowState,
  useRejectFollow,
  useRemoveFollow,
  useRequestFollow,
} from '@/hooks/useFollows';
import {
  useUserByUsername,
  useUserStats,
} from '@/hooks/useUserQueries';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pacts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPactsModal, setShowPactsModal] = useState(false);

  const isOwnProfile =
    typeof currentUser?.username === 'string' &&
    currentUser.username.trim().toLowerCase() === username.trim().toLowerCase();

  const userByUsernameQuery = useUserByUsername(username);
  const profileUser = userByUsernameQuery.data?.data;
  const profileUserId = profileUser?.id;

  const userStatsQuery = useUserStats(profileUserId || 0);
  const profilePactsQuery = useQuery({
    queryKey: ['profile-user-pacts', profileUserId],
    queryFn: () => userService.getPacts(profileUserId as number),
    enabled: typeof profileUserId === 'number' && profileUserId > 0,
    staleTime: 1000 * 60,
  });

  const followersQuery = useFollowers(profileUserId);
  const followingQuery = useFollowing(profileUserId);
  const followStateQuery = useFollowState(profileUserId);

  const requestFollow = useRequestFollow(profileUserId);
  const acceptFollow = useAcceptFollow(profileUserId);
  const rejectFollow = useRejectFollow(profileUserId);
  const removeFollow = useRemoveFollow(profileUserId);

  const displayedPacts = profilePactsQuery.data?.data || [];
  const followers = followersQuery.data?.data || [];
  const following = followingQuery.data?.data || [];

  const stats = {
    pactsCreated: userStatsQuery.data?.data?.pacts_created ?? 0,
    pactsCompleted: userStatsQuery.data?.data?.pacts_completed ?? 0,
    winRate: userStatsQuery.data?.data?.win_rate ?? 0,
    currentStreak: userStatsQuery.data?.data?.current_streak ?? 0,
    totalEarned: userStatsQuery.data?.data?.total_earned ?? 0,
    reputation: userStatsQuery.data?.data?.reputation ?? 0,
    followers: followers.length,
    following: following.length,
  };

  const followState = followStateQuery.data?.data;
  const outgoingStatus = followState?.outgoing_status || null;
  const outgoingFollowId = followState?.outgoing_follow_id || null;
  const incomingStatus = followState?.incoming_status || null;
  const incomingFollowId = followState?.incoming_follow_id || null;
  const isBusy =
    requestFollow.isPending ||
    acceptFollow.isPending ||
    rejectFollow.isPending ||
    removeFollow.isPending;

  const badgeList = useMemo(() => {
    const badges: string[] = [];
    if (stats.pactsCompleted >= 5) badges.push('trusted');
    if (stats.currentStreak >= 7) badges.push('onfire');
    if (stats.pactsCreated >= 3) badges.push('consistent');
    return badges;
  }, [stats.pactsCompleted, stats.currentStreak, stats.pactsCreated]);

  const allAchievements = [
    {
      id: 'first-pact',
      name: 'First Pact',
      description: 'Create your first pact',
      icon: '🎯',
      rarity: 'common' as const,
      unlocked: stats.pactsCreated > 0,
      unlockedAt: stats.pactsCreated > 0 ? new Date().toISOString() : undefined,
    },
    {
      id: 'on-fire',
      name: 'On Fire',
      description: 'Reach 7-day streak',
      icon: '🔥',
      rarity: 'rare' as const,
      unlocked: stats.currentStreak >= 7,
      unlockedAt: stats.currentStreak >= 7 ? new Date().toISOString() : undefined,
    },
    {
      id: 'winner',
      name: 'Winner',
      description: 'Complete 5 pacts',
      icon: '🏆',
      rarity: 'rare' as const,
      unlocked: stats.pactsCompleted >= 5,
      unlockedAt: stats.pactsCompleted >= 5 ? new Date().toISOString() : undefined,
    },
    {
      id: 'trusted',
      name: 'Trusted Member',
      description: 'Build 50 reputation',
      icon: '⭐',
      rarity: 'epic' as const,
      unlocked: stats.reputation >= 50,
      unlockedAt: stats.reputation >= 50 ? new Date().toISOString() : undefined,
    },
    {
      id: 'community',
      name: 'Community Hero',
      description: 'Join 10 circles',
      icon: '👥',
      rarity: 'epic' as const,
      unlocked: false,
      progress: Math.min(100, Math.round((followers.length / 10) * 100)),
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Complete 50 pacts',
      icon: '👑',
      rarity: 'legendary' as const,
      unlocked: stats.pactsCompleted >= 50,
      unlockedAt: stats.pactsCompleted >= 50 ? new Date().toISOString() : undefined,
    },
  ];

  const handlePrimaryFollowAction = async () => {
    if (typeof profileUserId !== 'number' || isOwnProfile) {
      return;
    }

    if (incomingStatus === 'pending' && incomingFollowId) {
      await acceptFollow.mutateAsync(incomingFollowId);
      return;
    }

    if (outgoingStatus === 'accepted' && outgoingFollowId) {
      await removeFollow.mutateAsync(outgoingFollowId);
      return;
    }

    if (outgoingStatus === 'pending' && outgoingFollowId) {
      await removeFollow.mutateAsync(outgoingFollowId);
      return;
    }

    await requestFollow.mutateAsync(profileUserId);
  };

  if (userByUsernameQuery.isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Loading profile...</div>;
  }

  if (!profileUser) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Profile not found.</div>;
  }

  const heroUser = {
    id: profileUser.id,
    name: profileUser.full_name,
    username: profileUser.username,
    avatar: profileUser.avatar_url || undefined,
    bio: profileUser.bio || undefined,
    reputationScore: Number(profileUser.reputation_score || 0),
    badges: badgeList,
  };

  const primaryFollowLabel =
    incomingStatus === 'pending'
      ? 'Accept'
      : outgoingStatus === 'accepted'
      ? 'Following'
      : outgoingStatus === 'pending'
      ? 'Requested'
      : 'Follow';

  const primaryFollowClass =
    outgoingStatus === 'accepted'
      ? 'bg-white/20 text-white border border-white/50 hover:bg-white/30'
      : outgoingStatus === 'pending'
      ? 'bg-white/20 text-white border border-white/40 hover:bg-white/30'
      : 'bg-white text-emerald-600 hover:bg-gray-50';

  const profilePactsHeading = isOwnProfile
    ? 'Your pacts'
    : `Pacts created by @${profileUser.username}`;
  const followersEmptyCopy = isOwnProfile
    ? 'You do not have followers yet.'
    : `No one follows @${profileUser.username} yet.`;
  const followingEmptyCopy = isOwnProfile
    ? "You are not following anyone yet."
    : `@${profileUser.username} is not following anyone yet.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{profileUser.full_name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Hero */}
        <ProfileHero
          user={heroUser}
          isOwnProfile={isOwnProfile}
          customActions={
            isOwnProfile ? null : (
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={handlePrimaryFollowAction}
                  disabled={isBusy}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-60 ${primaryFollowClass}`}
                >
                  {primaryFollowLabel}
                </button>
                {incomingStatus === 'pending' && incomingFollowId ? (
                  <button
                    onClick={() => rejectFollow.mutate(incomingFollowId)}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold transition bg-white/20 text-white border border-white/40 hover:bg-white/30 disabled:opacity-60"
                  >
                    Reject
                  </button>
                ) : null}
              </div>
            )
          }
        />

        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-700">
            <button onClick={() => setActiveTab('followers')} className="hover:text-emerald-600 transition">
              {followers.length} Followers
            </button>
            <span className="text-slate-300">·</span>
            <button onClick={() => setActiveTab('following')} className="hover:text-emerald-600 transition">
              {following.length} Following
            </button>
          </div>
        </div>

        {/* Stats */}
        <ProfileStats 
          stats={stats}
          onPactClick={() => setShowPactsModal(true)}
          onFollowersClick={() => setShowFollowersModal(true)}
          onFollowingClick={() => setShowFollowingModal(true)}
        />

        {/* Tabs */}
        <ProfileTabs onTabChange={setActiveTab}>
          {activeTab === 'pacts' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900">{profilePactsHeading}</h2>
              <PactsTab pacts={displayedPacts} joinedPacts={[]} votedPacts={[]} />
            </div>
          )}
          {activeTab === 'achievements' && <AchievementsBadges achievements={allAchievements} />}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              {followers.length === 0 ? (
                <p className="text-sm text-slate-500">{followersEmptyCopy}</p>
              ) : (
                followers.map((row: any) => (
                  <button
                    key={row.id}
                    onClick={() => router.push(`/profile/${encodeURIComponent(row.username)}`)}
                    className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 transition"
                  >
                    <p className="font-semibold text-slate-900">{row.full_name || row.username}</p>
                    <p className="text-xs text-slate-500">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          )}
          {activeTab === 'following' && (
            <div className="space-y-2">
              {following.length === 0 ? (
                <p className="text-sm text-slate-500">{followingEmptyCopy}</p>
              ) : (
                following.map((row: any) => (
                  <button
                    key={row.id}
                    onClick={() => router.push(`/profile/${encodeURIComponent(row.username)}`)}
                    className="w-full text-left p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 transition"
                  >
                    <p className="font-semibold text-slate-900">{row.full_name || row.username}</p>
                    <p className="text-xs text-slate-500">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          )}
          {activeTab === 'circles' && (
            <div className="text-center py-12 text-gray-500">
              <p className="font-medium mb-2">{isOwnProfile ? 'Your circles' : `Circles for @${profileUser.username}`}</p>
              <p className="text-sm">
                {isOwnProfile ? 'Circle data will appear here.' : 'Circle membership data will appear here.'}
              </p>
            </div>
          )}
        </ProfileTabs>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowFollowersModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-lg">Followers</h2>
              <button onClick={() => setShowFollowersModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {followers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{followersEmptyCopy}</p>
              ) : (
                followers.map((row: any) => (
                  <button key={row.id} onClick={() => { router.push(`/profile/${encodeURIComponent(row.username)}`); setShowFollowersModal(false); }} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <p className="font-medium text-slate-900">{row.full_name || row.username}</p>
                    <p className="text-xs text-slate-500">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowFollowingModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-lg">Following</h2>
              <button onClick={() => setShowFollowingModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {following.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{followingEmptyCopy}</p>
              ) : (
                following.map((row: any) => (
                  <button key={row.id} onClick={() => { router.push(`/profile/${encodeURIComponent(row.username)}`); setShowFollowingModal(false); }} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <p className="font-medium text-slate-900">{row.full_name || row.username}</p>
                    <p className="text-xs text-slate-500">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pacts Modal */}
      {showPactsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowPactsModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-lg">Pacts</h2>
              <button onClick={() => setShowPactsModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {displayedPacts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{isOwnProfile ? 'You have not created any pacts yet.' : `@${profileUser.username} has not created any pacts yet.`}</p>
              ) : (
                displayedPacts.map((pact: any) => (
                  <button key={pact.id} onClick={() => { router.push(`/pacts/${pact.id}`); setShowPactsModal(false); }} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                    <p className="font-medium text-slate-900">{pact.title}</p>
                    <p className="text-xs text-slate-500">{pact.category}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
