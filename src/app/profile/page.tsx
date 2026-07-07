'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usePacts } from '@/hooks/usePacts';
import { useWalletBalance, useWalletRewards } from '@/hooks/useWallet';
import TopNav from '@/components/TopNav';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab, AchievementsTab, FollowersTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import UserFollowModal from '@/components/UserFollowModal';
import { LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: pactsData } = usePacts();
  const { data: balanceData } = useWalletBalance();
  const { data: rewardsData } = useWalletRewards();
  const [activeTab, setActiveTab] = useState('pacts');
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({
    isOpen: false,
    type: 'followers',
  });

  const pacts = (Array.isArray(pactsData) ? pactsData : pactsData?.data || []) as any[];
  const balance = balanceData?.balance || 0;
  const rewards = rewardsData?.rewards || 0;

  const completedPacts = pacts.filter((p: any) => p.status === 'completed').length;
  const winRate = pacts.length > 0 ? Math.round((completedPacts / pacts.length) * 100) : 0;

  // Mock achievements data
  const allAchievements = [
    {
      id: 'first-pact',
      name: 'First Pact',
      description: 'Create your first pact',
      icon: '🎯',
      rarity: 'common' as const,
      unlocked: pacts.length > 0,
      unlockedAt: pacts.length > 0 ? new Date().toISOString() : undefined,
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

  // Mock follower data
  const mockFollowers = [
    { id: 1, name: 'Alice Smith', username: 'alice_smith', isFollowing: false },
    { id: 2, name: 'Bob Johnson', username: 'bob_j', isFollowing: true },
    { id: 3, name: 'Carol White', username: 'carol_w', isFollowing: false },
  ];

  const mockFollowing = [
    { id: 4, name: 'Diana Prince', username: 'diana_p', isFollowing: true },
    { id: 5, name: 'Eve Taylor', username: 'eve_t', isFollowing: true },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (!user) {
    return null;
  }

  const profileUser = {
    id: user.id,
    name: user.full_name || 'User',
    username: user.username || 'user',
    bio: 'Building better habits, one pact at a time',
    reputationScore: user.reputation_score || 0,
    badges: completedPacts >= 5 ? ['trusted', 'onfire', 'consistent'] : [],
  };

  const stats = {
    pactsCreated: pacts.length,
    pactsCompleted: completedPacts,
    winRate,
    currentStreak: 12,
    totalEarned: Math.round(rewards),
    reputation: Math.round(user.reputation_score || 0),
  };

  const displayedPacts = pacts.slice(0, 5).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    daysRemaining: Math.ceil(Math.random() * 30),
    participantCount: Math.ceil(Math.random() * 10),
  }));

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
        <ProfileStats stats={stats} />

        {/* Tabs */}
        <ProfileTabs onTabChange={setActiveTab}>
          {activeTab === 'pacts' && <PactsTab pacts={displayedPacts} />}
          {activeTab === 'achievements' && <AchievementsBadges achievements={allAchievements} />}
          {activeTab === 'followers' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4">My Followers</h3>
                <button
                  onClick={() => setFollowModal({ isOpen: true, type: 'followers' })}
                  className="text-emerald-600 hover:underline text-sm"
                >
                  View all {mockFollowers.length} followers
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Following</h3>
                <button
                  onClick={() => setFollowModal({ isOpen: true, type: 'following' })}
                  className="text-emerald-600 hover:underline text-sm"
                >
                  View all {mockFollowing.length} following
                </button>
              </div>
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

        {/* Follow Modal */}
        <UserFollowModal
          isOpen={followModal.isOpen}
          onClose={() => setFollowModal({ ...followModal, isOpen: false })}
          type={followModal.type}
          users={followModal.type === 'followers' ? mockFollowers : mockFollowing}
        />
      </div>
    </>
  );
}
