'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import ProfileHero from '@/components/ProfileHero';
import ProfileStats from '@/components/ProfileStats';
import ProfileTabs, { PactsTab, AchievementsTab, FollowersTab } from '@/components/ProfileTabs';
import AchievementsBadges from '@/components/AchievementsBadges';
import UserFollowModal from '@/components/UserFollowModal';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const [activeTab, setActiveTab] = useState('pacts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({
    isOpen: false,
    type: 'followers',
  });

  // Mock user data - in real app, fetch from API based on username
  const user = {
    id: 123,
    name: 'John Developer',
    username: username,
    bio: 'Building the future of accountability. Coffee lover ☕',
    avatar: undefined,
    reputationScore: 8.7,
    badges: ['trusted', 'consistent'],
  };

  const stats = {
    pactsCreated: 24,
    pactsCompleted: 18,
    winRate: 75,
    currentStreak: 8,
    totalEarned: 12500,
    reputation: 87,
  };

  const allAchievements = [
    {
      id: 'first-pact',
      name: 'First Pact',
      description: 'Create your first pact',
      icon: '🎯',
      rarity: 'common' as const,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    },
    {
      id: 'on-fire',
      name: 'On Fire',
      description: 'Reach 7-day streak',
      icon: '🔥',
      rarity: 'rare' as const,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    },
    {
      id: 'winner',
      name: 'Winner',
      description: 'Complete 5 pacts',
      icon: '🏆',
      rarity: 'rare' as const,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    },
    {
      id: 'trusted',
      name: 'Trusted Member',
      description: 'Build 50 reputation',
      icon: '⭐',
      rarity: 'epic' as const,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    },
    {
      id: 'community',
      name: 'Community Hero',
      description: 'Join 10 circles',
      icon: '👥',
      rarity: 'epic' as const,
      unlocked: false,
      progress: 60,
    },
    {
      id: 'legendary',
      name: 'Legendary',
      description: 'Complete 50 pacts',
      icon: '👑',
      rarity: 'legendary' as const,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    },
  ];

  const mockFollowers = [
    { id: 1, name: 'Alice Smith', username: 'alice_smith', isFollowing: false },
    { id: 2, name: 'Bob Johnson', username: 'bob_j', isFollowing: true },
    { id: 3, name: 'Carol White', username: 'carol_w', isFollowing: false },
  ];

  const mockFollowing = [
    { id: 4, name: 'Diana Prince', username: 'diana_p', isFollowing: true },
    { id: 5, name: 'Eve Taylor', username: 'eve_t', isFollowing: true },
  ];

  const displayedPacts = [
    {
      id: 1,
      title: 'Learn React in 30 days',
      description: 'Complete React tutorial and build 2 projects',
      status: 'completed',
      daysRemaining: 0,
      participantCount: 12,
    },
    {
      id: 2,
      title: 'Gym 5x per week',
      description: 'Hit the gym at least 5 days every week',
      status: 'active',
      daysRemaining: 15,
      participantCount: 8,
    },
    {
      id: 3,
      title: 'Read 2 books per month',
      description: 'Complete reading 2 books every month',
      status: 'completed',
      daysRemaining: 0,
      participantCount: 5,
    },
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed' : 'Following');
  };

  const handleMessage = () => {
    toast.success('Opening direct messages...');
  };

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
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Hero */}
        <ProfileHero
          user={user}
          isOwnProfile={false}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onMessage={handleMessage}
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Followers</h3>
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
              <p className="font-medium mb-2">{user.name} is a member of 5 circles</p>
              <button className="text-emerald-600 hover:underline">View all circles</button>
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
  );
}
