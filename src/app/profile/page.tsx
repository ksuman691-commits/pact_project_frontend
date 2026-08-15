'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUserJoinedPacts, useUserPacts, useUserVotedPacts } from '@/hooks/useFeedQueries';
import { useCircles } from '@/hooks/useCircles';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import ActivityStrip from '@/components/pact-ui/ActivityStrip';
import { LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFollowers, useFollowing } from '@/hooks/useFollows';
import { useAtRiskPact } from '@/hooks/useAtRiskPact';

export default function Profile() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('pacts');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showPactsModal, setShowPactsModal] = useState(false);

  const userId = user?.id;
  const { data: createdPactsData } = useUserPacts(userId || 0);
  const { data: joinedPactsData } = useUserJoinedPacts(userId || 0);
  const { data: votedPactsData } = useUserVotedPacts(userId || 0);
  const createdPacts = (createdPactsData?.pages || []).flatMap((page: any) => page.data || []) as any[];
  const joinedPacts = (joinedPactsData?.pages || []).flatMap((page: any) => page.data || []) as any[];
  const votedPacts = (votedPactsData?.pages || []).flatMap((page: any) => page.data || []) as any[];
  const followersQuery = useFollowers(userId || 0);
  const followingQuery = useFollowing(userId || 0);
  const followers = followersQuery.data?.data || [];
  const following = followingQuery.data?.data || [];
  const isAtRisk = useAtRiskPact(userId);
  const circlesQuery = useCircles();
  const myCircles = (circlesQuery.data || []) as any[];

  const completedPacts = createdPacts.filter((p: any) => p.status === 'completed').length;
  const winRate = createdPacts.length > 0 ? Math.round((completedPacts / createdPacts.length) * 100) : 0;

  // Real activity signal: days the user created, joined, or voted on a pact.
  const activityDates = [...createdPacts, ...joinedPacts, ...votedPacts]
    .map((p: any) => p.created_at)
    .filter(Boolean) as string[];

  // Mock achievements data
  const allAchievements = [
    {
      id: 'first-pact',
      name: 'First Pact',
      description: 'Create your first pact',
      icon: '🎯',
      rarity: 'common' as const,
      unlocked: createdPacts.length > 0,
      unlockedAt: createdPacts.length > 0 ? new Date().toISOString() : undefined,
    },
    {
      id: 'on-fire',
      name: 'On Fire',
      description: 'Reach 7-day streak',
      icon: '🔥',
      rarity: 'rare' as const,
      unlocked: false,
      progress: 30,
    },
    {
      id: 'winner',
      name: 'Winner',
      description: 'Complete 5 pacts',
      icon: '🏆',
      rarity: 'rare' as const,
      unlocked: completedPacts >= 5,
      unlockedAt: completedPacts >= 5 ? new Date().toISOString() : undefined,
    },
    {
      id: 'trusted',
      name: 'Trusted Member',
      description: 'Build 50 reputation',
      icon: '⭐',
      rarity: 'epic' as const,
      unlocked: false,
      progress: 70,
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Complete 50 pacts',
      icon: '👑',
      rarity: 'legendary' as const,
      unlocked: false,
      progress: 20,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (!isInitialized) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--pact-violet)]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileUser = {
    id: user.id || 0,
    name: user.full_name || 'User',
    username: user.username || 'user',
    avatar: user.avatar_url || undefined,
    bio: user.bio || 'Building better habits, one pact at a time',
    reputationScore: user.reputation_score || 0,
    badges: completedPacts >= 5 ? ['trusted', 'onfire', 'consistent'] : [],
  };

  const stats = {
    pactsCreated: createdPacts.length,
    pactsCompleted: completedPacts,
    winRate,
    currentStreak: 12,
    reputation: Math.round(user.reputation_score || 0),
    followers: followers.length,
    following: following.length,
  };

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: 'rgba(20,9,31,0.85)', borderColor: 'var(--pact-hairline)' }}>
        <div className="px-4 py-4 flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold text-[var(--pact-text)]">My Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={handleEditProfile}
              className="p-2 rounded-full transition hover:bg-[var(--pact-surface-2)]"
              title="Edit settings"
            >
              <Settings className="w-5 h-5 text-[var(--pact-text-dim)]" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition hover:bg-[var(--pact-surface-2)]"
              title="Logout"
              style={{ color: 'var(--pact-pink)' }}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Profile Hero */}
        <ProfileHero
          user={profileUser}
          isOwnProfile={true}
          onEdit={handleEditProfile}
          streak={stats.currentStreak}
          atRisk={isAtRisk}
        />

        {/* Stats — surfaced immediately after the Hero (name/avatar) so the
            most important numbers aren't buried below secondary content. */}
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
              {/* Moved from the top of the page — activity heat is most
                  relevant right next to the pacts it reflects, and this
                  keeps Stats + Tabs visible immediately below the Hero. */}
              <div className="pact-card rounded-2xl p-4">
                <ActivityStrip activityDates={activityDates} />
              </div>
              <h2 className="text-lg font-black text-[var(--pact-text)]">Your pacts</h2>
              <PactsTab pacts={createdPacts} joinedPacts={joinedPacts} votedPacts={votedPacts} allowJoinedUploads={true} />
            </div>
          )}
          {activeTab === 'achievements' && <AchievementsBadges achievements={allAchievements} />}
          {activeTab === 'circles' && (
            myCircles.length === 0 ? (
              <div className="pact-card rounded-3xl px-6 py-10 text-center">
                <p className="text-base font-semibold text-[var(--pact-text)]">Not in any circles yet</p>
                <p className="mt-2 text-sm text-[var(--pact-text-dim)]">Join a circle to start building accountability together.</p>
                <button
                  onClick={() => router.push('/circles')}
                  className="pact-btn-glow mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
                >
                  Browse circles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myCircles.map((circle: any) => (
                  <button
                    key={circle.id}
                    onClick={() => router.push(`/circles/${circle.id}`)}
                    className="pact-card pact-btn-glow rounded-2xl p-4 text-left transition"
                  >
                    <p className="font-semibold text-[var(--pact-text)] truncate">{circle.name}</p>
                    <p className="text-xs text-[var(--pact-text-faint)] mt-1">{circle.member_count ?? 0} members</p>
                  </button>
                ))}
              </div>
            )
          )}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              {followers.length === 0 ? (
                <p className="text-sm text-[var(--pact-text-faint)]">You do not have followers yet.</p>
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
                <p className="text-sm text-[var(--pact-text-faint)]">You are not following anyone yet.</p>
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
                <p className="text-center text-[var(--pact-text-faint)] py-8">You do not have followers yet.</p>
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
                <p className="text-center text-[var(--pact-text-faint)] py-8">You are not following anyone yet.</p>
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
              <h2 className="font-bold text-lg text-[var(--pact-text)]">My Pacts</h2>
              <button onClick={() => setShowPactsModal(false)} className="p-1 rounded-full hover:bg-[var(--pact-surface-2)] text-[var(--pact-text-faint)]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {createdPacts.length === 0 ? (
                <p className="text-center text-[var(--pact-text-faint)] py-8">You have not created any pacts yet.</p>
              ) : (
                createdPacts.map((pact: any) => (
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
