'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  useUserRelationship,
  useUserCircles,
} from '@/hooks/useUserQueries';
import { useAtRiskPact } from '@/hooks/useAtRiskPact';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();

  const isOwnProfile =
    typeof currentUser?.username === 'string' &&
    currentUser.username.trim().toLowerCase() === username.trim().toLowerCase();

  // Someone else's profile lands on Circles first — it establishes whether
  // you share any context with this person before drilling into their pacts.
  const [activeTab, setActiveTab] = useState(isOwnProfile ? 'pacts' : 'circles');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPactsModal, setShowPactsModal] = useState(false);

  const userByUsernameQuery = useUserByUsername(username);
  const profileUser = userByUsernameQuery.data?.data;
  const profileUserId = profileUser?.id;

  const relationshipQuery = useUserRelationship(profileUserId || 0);
  const profileCirclesQuery = useUserCircles(profileUserId || 0);
  const relationship = relationshipQuery.data?.data;
  const sharedCircleIds: number[] = relationship?.shared_circle_ids ?? relationship?.sharedCircleIds ?? [];
  const profileCircles = profileCirclesQuery.data?.data ?? [];
  const hasSharedCircle = sharedCircleIds.length > 0;
  const hasOwnCircles = isOwnProfile && profileCircles.length > 0;

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
  const isAtRisk = useAtRiskPact(isOwnProfile ? profileUserId : undefined);

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
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center text-[var(--pact-text-faint)]">
        Loading profile...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center text-[var(--pact-text-faint)]">
        Profile not found.
      </div>
    );
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

  const primaryFollowStyle: React.CSSProperties =
    outgoingStatus === 'accepted'
      ? { background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }
      : outgoingStatus === 'pending'
      ? { background: 'var(--pact-surface-2)', color: 'var(--pact-text-dim)' }
      : { background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' };

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
    <div className="pact-flow pact-page-enter min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: 'rgba(20,9,31,0.85)', borderColor: 'var(--pact-hairline)' }}>
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full transition hover:bg-[var(--pact-surface-2)]"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--pact-text-dim)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--pact-text)]">{profileUser.full_name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Profile Hero */}
        <ProfileHero
          user={heroUser}
          isOwnProfile={isOwnProfile}
          streak={isOwnProfile ? stats.currentStreak : undefined}
          atRisk={isOwnProfile ? isAtRisk : undefined}
          customActions={
            isOwnProfile ? null : (
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={handlePrimaryFollowAction}
                  disabled={isBusy}
                  className="pact-btn-glow flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold transition disabled:opacity-60"
                  style={primaryFollowStyle}
                >
                  {primaryFollowLabel}
                </button>
                {incomingStatus === 'pending' && incomingFollowId ? (
                  <button
                    onClick={() => rejectFollow.mutate(incomingFollowId)}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full font-semibold transition border disabled:opacity-60"
                    style={{ borderColor: 'var(--pact-pink)', color: 'var(--pact-pink)' }}
                  >
                    Reject
                  </button>
                ) : null}
              </div>
            )
          }
        />

        {/* Stats */}
        <ProfileStats
          stats={stats}
          onPactClick={() => { setActiveTab('pacts'); setShowPactsModal(true); }}
          onFollowersClick={() => { setActiveTab('followers'); setShowFollowersModal(true); }}
          onFollowingClick={() => { setActiveTab('following'); setShowFollowingModal(true); }}
        />

        {/* Tabs */}
        <ProfileTabs onTabChange={setActiveTab} initialTab={isOwnProfile ? 'pacts' : 'circles'}>
          {activeTab === 'pacts' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-[var(--pact-text)]">{profilePactsHeading}</h2>
              <PactsTab
                pacts={displayedPacts}
                joinedPacts={[]}
                votedPacts={[]}
                isOwnProfile={isOwnProfile}
                hasSharedCircle={hasSharedCircle}
                profileName={profileUser.full_name || `@${profileUser.username}`}
                profileUserId={profileUser.id}
                sharedCircleId={sharedCircleIds[0]}
                hasOwnCircles={hasOwnCircles}
              />
            </div>
          )}
          {activeTab === 'achievements' && <AchievementsBadges achievements={allAchievements} />}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              {followers.length === 0 ? (
                <p className="text-sm text-[var(--pact-text-faint)]">{followersEmptyCopy}</p>
              ) : (
                followers.map((row: any) => (
                  <button
                    key={row.id}
                    onClick={() => router.push(`/profile/${encodeURIComponent(row.username)}`)}
                    className="pact-card w-full text-left p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]"
                  >
                    <p className="font-semibold text-[var(--pact-text)]">{row.full_name || row.username}</p>
                    <p className="text-xs text-[var(--pact-text-faint)]">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          )}
          {activeTab === 'following' && (
            <div className="space-y-2">
              {following.length === 0 ? (
                <p className="text-sm text-[var(--pact-text-faint)]">{followingEmptyCopy}</p>
              ) : (
                following.map((row: any) => (
                  <button
                    key={row.id}
                    onClick={() => router.push(`/profile/${encodeURIComponent(row.username)}`)}
                    className="pact-card w-full text-left p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]"
                  >
                    <p className="font-semibold text-[var(--pact-text)]">{row.full_name || row.username}</p>
                    <p className="text-xs text-[var(--pact-text-faint)]">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          )}
          {activeTab === 'circles' && (
            <div className="space-y-3">
              {profileCircles.length > 0 ? (
                profileCircles.map((circle: any) => (
                  <button
                    key={circle.id}
                    onClick={() => router.push(`/circles/${circle.id}`)}
                    className="pact-card flex w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-[var(--pact-surface-2)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: 'var(--pact-surface-2)' }}>
                      {circle.icon_emoji || '◉'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--pact-text)]">{circle.name}</span>
                      <span className="block text-xs text-[var(--pact-text-faint)]">{circle.member_count ?? 0} members</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="pact-card rounded-3xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--pact-hairline)' }}>
                  <p className="font-semibold text-[var(--pact-text)]">
                    {isOwnProfile ? 'Your circles are ready to grow' : `You don't share any circles with ${profileUser.full_name || `@${profileUser.username}`} yet`}
                  </p>
                  <p className="mt-2 text-sm text-[var(--pact-text-dim)]">
                    {isOwnProfile ? 'Create a circle to bring your accountability crew together.' : 'Add them to a circle to start creating pacts together.'}
                  </p>
                  <button
                    onClick={() => router.push(isOwnProfile ? '/circles/create' : `/circles/create?inviteUserId=${profileUser.id}`)}
                    className="pact-btn-glow mt-5 rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
                  >
                    {isOwnProfile ? 'Create a Circle' : `Add ${profileUser.full_name || `@${profileUser.username}`} to a Circle`}
                  </button>
                </div>
              )}
            </div>
          )}
        </ProfileTabs>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowFollowersModal(false)}>
          <div className="pact-card rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-3xl" style={{ background: 'var(--pact-surface)', borderColor: 'var(--pact-hairline)' }}>
              <h2 className="font-bold text-lg text-[var(--pact-text)]">Followers</h2>
              <button onClick={() => setShowFollowersModal(false)} className="p-1 rounded-full hover:bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {followers.length === 0 ? (
                <p className="text-center text-[var(--pact-text-faint)] py-8">{followersEmptyCopy}</p>
              ) : (
                followers.map((row: any) => (
                  <button key={row.id} onClick={() => { router.push(`/profile/${encodeURIComponent(row.username)}`); setShowFollowersModal(false); }} className="w-full text-left p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]">
                    <p className="font-medium text-[var(--pact-text)]">{row.full_name || row.username}</p>
                    <p className="text-xs text-[var(--pact-text-faint)]">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowFollowingModal(false)}>
          <div className="pact-card rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-3xl" style={{ background: 'var(--pact-surface)', borderColor: 'var(--pact-hairline)' }}>
              <h2 className="font-bold text-lg text-[var(--pact-text)]">Following</h2>
              <button onClick={() => setShowFollowingModal(false)} className="p-1 rounded-full hover:bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {following.length === 0 ? (
                <p className="text-center text-[var(--pact-text-faint)] py-8">{followingEmptyCopy}</p>
              ) : (
                following.map((row: any) => (
                  <button key={row.id} onClick={() => { router.push(`/profile/${encodeURIComponent(row.username)}`); setShowFollowingModal(false); }} className="w-full text-left p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]">
                    <p className="font-medium text-[var(--pact-text)]">{row.full_name || row.username}</p>
                    <p className="text-xs text-[var(--pact-text-faint)]">@{row.username}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pacts Modal */}
      {showPactsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowPactsModal(false)}>
          <div className="pact-card rounded-t-3xl md:rounded-3xl max-w-md w-full max-h-[70vh] overflow-y-auto md:max-h-96" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-3xl" style={{ background: 'var(--pact-surface)', borderColor: 'var(--pact-hairline)' }}>
              <h2 className="font-bold text-lg text-[var(--pact-text)]">Pacts</h2>
              <button onClick={() => setShowPactsModal(false)} className="p-1 rounded-full hover:bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {displayedPacts.length === 0 ? (
                <p className="text-center text-[var(--pact-text-faint)] py-8">{isOwnProfile ? 'You have not created any pacts yet.' : `@${profileUser.username} has not created any pacts yet.`}</p>
              ) : (
                displayedPacts.map((pact: any) => (
                  <button key={pact.id} onClick={() => { router.push(`/pacts/${pact.id}`); setShowPactsModal(false); }} className="w-full text-left p-3 rounded-2xl transition hover:bg-[var(--pact-surface-2)]">
                    <p className="font-medium text-[var(--pact-text)]">{pact.title}</p>
                    <p className="text-xs text-[var(--pact-text-faint)]">{pact.category}</p>
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
