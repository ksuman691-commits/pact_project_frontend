'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUserJoinedPacts, useUserPacts, useUserVotedPacts } from '@/hooks/useFeedQueries';
import TopNav from '@/components/TopNav';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab, AchievementsTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import { LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFollowers, useFollowing } from '@/hooks/useFollows';

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
  const rewards = 0;
  const followersQuery = useFollowers(userId || 0);
  const followingQuery = useFollowing(userId || 0);
  const followers = followersQuery.data?.data || [];
  const following = followingQuery.data?.data || [];

  const completedPacts = createdPacts.filter((p: any) => p.status === 'completed').length;
  const winRate = createdPacts.length > 0 ? Math.round((completedPacts / createdPacts.length) * 100) : 0;

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
      id: 'richest',
      name: 'Richest',
      description: 'Earn ₹5000',
      icon: '💰',
      rarity: 'epic' as const,
      unlocked: rewards >= 5000,
      unlockedAt: rewards >= 5000 ? new Date().toISOString() : undefined,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
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
    totalEarned: Math.round(rewards),
    reputation: Math.round(user.reputation_score || 0),
    followers: followers.length,
    following: following.length,
  };

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 max-w-md mx-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <div className="flex gap-2">
              <button
                onClick={handleEditProfile}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Edit settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Hero */}
        <ProfileHero
          user={profileUser}
          isOwnProfile={true}
          onEdit={handleEditProfile}
        />

        {/* Stats */}
        <ProfileStats 
          stats={stats}
          onPactClick={() => setShowPactsModal(true)}
          onFollowersClick={() => setShowFollowersModal(true)}
          onFollowingClick={() => setShowFollowingModal(true)}
        />

        {/* Tabs */}
        <ProfileTabs onTabChange={setActiveTab}>
          {activeTab === 'pacts' && <PactsTab pacts={createdPacts} joinedPacts={joinedPacts} votedPacts={votedPacts} allowJoinedUploads={true} />}
          {activeTab === 'achievements' && <AchievementsBadges achievements={allAchievements} />}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              {followers.length === 0 ? (
                <p className="text-sm text-slate-500">No followers yet.</p>
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
                <p className="text-sm text-slate-500">Not following anyone yet.</p>
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
              <p className="font-medium mb-2">You are a member of 3 circles</p>
              <p className="text-sm">Visit the circles page to explore and join more</p>
            </div>
          )}
        </ProfileTabs>
      </div>
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
                <p className="text-center text-slate-500 py-8">No followers yet</p>
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
                <p className="text-center text-slate-500 py-8">Not following anyone yet</p>
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
              <h2 className="font-bold text-lg">My Pacts</h2>
              <button onClick={() => setShowPactsModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-4 space-y-3">
              {createdPacts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No pacts created yet</p>
              ) : (
                createdPacts.map((pact: any) => (
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
    </>
  );
}
