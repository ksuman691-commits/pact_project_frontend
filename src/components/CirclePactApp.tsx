'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Home, Users, Plus, Trophy, User as UserIcon, Bell } from 'lucide-react';
import { usePersonalizedFeed } from '@/hooks/useFeedQueries';
import { useBelievePact, useDoubtPact } from '@/hooks/usePactMutations';
import { useInView } from 'react-intersection-observer';
import PactCard from './PactCard';
import toast from 'react-hot-toast';

const CirclePact = () => {
  const [currentTab, setCurrentTab] = useState('feed');
  const { ref, inView } = useInView();
  
  // Fetch feed data with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = usePersonalizedFeed();

  // Mutations for voting
  const believeMutation = useBelievePact();
  const doubtMutation = useDoubtPact();

  // Trigger load more when near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten paginated data
  const pacts = data?.pages?.flatMap(page => page.data) || [];

  // Fallback mock data if API fails
  const mockPacts = [
    {
      id: 1,
      creator: 'Aniket',
      avatar: '🔥',
      title: 'Ship MVP in 7 days',
      category: 'Startup',
      daysTotal: 7,
      daysCurrent: 2,
      supportPool: 42000,
      confidence: 73,
      believers: 3420,
      doubters: 1250,
      timeRemaining: '2d 14h',
      progressPercentage: 28,
      proofClips: [
        { day: 1, type: 'coding', text: 'Started backend setup' },
        { day: 2, type: 'checkpoint', text: 'API endpoints complete' },
      ],
      comments: [
        { user: 'dev_pro', text: 'Always delivers 🔥', likes: 234 },
        { user: 'startup_judge', text: '7 days is tough', likes: 145 },
      ],
      userVote: null,
    },
    {
      id: 2,
      creator: 'Priya',
      avatar: '💪',
      title: 'Lose 5kg in 60 days',
      category: 'Fitness',
      daysTotal: 60,
      daysCurrent: 11,
      supportPool: 28500,
      confidence: 82,
      believers: 5643,
      doubters: 892,
      timeRemaining: '49d 3h',
      progressPercentage: 18,
      proofClips: [
        { day: 3, type: 'scale', text: '68kg (down 0.8kg)' },
        { day: 11, type: 'scale', text: '67.1kg (down 1.7kg) 🔥' },
      ],
      comments: [
        { user: 'fitness_mentor', text: 'Consistency wins', likes: 1203 },
      ],
      userVote: 'believe',
    },
    {
      id: 3,
      creator: 'Rohan',
      avatar: '📚',
      title: '100 consecutive days of code',
      category: 'Coding',
      daysTotal: 100,
      daysCurrent: 34,
      supportPool: 15800,
      confidence: 65,
      believers: 2345,
      doubters: 1234,
      timeRemaining: '66d 8h',
      progressPercentage: 34,
      proofClips: [
        { day: 10, type: 'commit', text: 'Built React component' },
        { day: 34, type: 'commit', text: 'Database optimization' },
      ],
      comments: [
        { user: 'code_reviewer', text: 'Quality matters', likes: 456 },
      ],
      userVote: null,
    },
  ];

  const displayPacts = pacts.length > 0 ? pacts : mockPacts;

  const handleVote = async (pactId: number, vote: string) => {
    try {
      if (vote === 'believe') {
        await believeMutation.mutateAsync(pactId);
      } else {
        await doubtMutation.mutateAsync(pactId);
      }
      toast.success(`You voted to ${vote} this pact!`);
    } catch (error) {
      toast.error('Failed to submit vote');
    }
  };

  const handleProofUpload = (pactId: number) => {
    toast.success('Proof uploaded! Verification in progress...');
  };

  if (currentTab === 'feed') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Elegant Header with Welcome & Action Buttons */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                MC
              </div>
              <div>
                <p className="text-xs text-gray-500">Welcome back</p>
                <h1 className="text-sm font-bold text-gray-900">Maya</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Create Pact Circular Button */}
              <button className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5" />
              </button>
              {/* Create/Join Circle Circular Button */}
              <button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md">
                <Users className="w-5 h-5" />
              </button>
              {/* Notification */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <Bell className="w-4 h-4 text-gray-700" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              </button>
            </div>
          </div>

          {/* Elegant Stats Row - Minimal */}
          <div className="flex justify-between gap-4 px-2">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Active</p>
              <p className="text-sm font-bold text-gray-900">4</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Circles</p>
              <p className="text-sm font-bold text-gray-900">3</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Streak</p>
              <p className="text-sm font-bold text-emerald-600">14d 🔥</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Done</p>
              <p className="text-sm font-bold text-gray-900">27</p>
            </div>
          </div>
        </div>

        {/* Feed Cards */}
        <div className="px-4 py-3 space-y-6">
          {displayPacts.map((pact) => (
            <PactCard
              key={pact.id}
              pact={pact}
              onVote={handleVote}
              userVote={pact.userVote}
              onProofUpload={handleProofUpload}
            />
          ))}

          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={ref} className="py-8 flex justify-center">
              {isFetchingNextPage ? (
                <div className="text-gray-600 text-sm">Loading more pacts...</div>
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-full font-medium transition"
                >
                  Load More
                </button>
              )}
            </div>
          )}

          {pacts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No pacts found. Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentTab === 'circles') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Your Circles</h1>
          
          <div className="space-y-4">
            {[
              { name: 'Fitness Crew', members: 12, desc: 'Daily gym accountability' },
              { name: 'Startup Builders', members: 8, desc: 'Shipping together' },
              { name: 'Study Group', members: 5, desc: 'Exam prep 2024' },
            ].map((circle, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{circle.name}</h3>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{circle.members} members</span>
                </div>
                <p className="text-sm text-gray-600">{circle.desc}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
            + New Circle
          </button>
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  if (currentTab === 'create') {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-black text-gray-900 mb-6">Create a Pact</h1>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">What's your challenge?</label>
              <input 
                type="text" 
                placeholder="e.g., Ship MVP in 7 days" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Duration (days)</label>
              <input 
                type="number" 
                placeholder="7" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Fitness</option>
                <option>Startup</option>
                <option>Coding</option>
                <option>Creator</option>
                <option>Study</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
              <textarea 
                placeholder="What are you committing to?" 
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition">
              Launch Pact
            </button>
          </form>
        </div>
        
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  if (currentTab === 'leaderboard') {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-black text-gray-900 mb-2">🏆 Leaderboard</h1>
          <p className="text-sm text-gray-600 mb-6">Top predictors this week</p>
          
          <div className="space-y-2">
            {[
              { rank: 1, name: 'Aniket', score: 8950, streak: '🔥 15 day', medal: '🥇' },
              { rank: 2, name: 'Priya', score: 7640, streak: '💪 12 day', medal: '🥈' },
              { rank: 3, name: 'Rohan', score: 6320, streak: '📚 34 day', medal: '🥉' },
              { rank: 4, name: 'Zara', score: 5280, streak: '🎬 8 day', medal: '4️⃣' },
              { rank: 5, name: 'Akshay', score: 4950, streak: '💻 6 day', medal: '5️⃣' },
            ].map(user => (
              <div key={user.rank} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.medal}</span>
                  <div>
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.streak}</p>
                  </div>
                </div>
                <p className="font-black text-2xl text-blue-600">{user.score}</p>
              </div>
            ))}
          </div>
        </div>
        
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  if (currentTab === 'profile') {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-4xl">
              😎
            </div>
            <p className="text-xl font-black mb-1">You</p>
            <p className="text-blue-100">@your_username</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Score</p>
              <p className="text-2xl font-black text-blue-600">2,450</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Rank</p>
              <p className="text-2xl font-black text-green-600">#247</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 font-semibold mb-1">Streak</p>
              <p className="text-2xl font-black text-orange-600">5🔥</p>
            </div>
          </div>

          {/* Activity */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Your Pacts</h3>
            <div className="space-y-2">
              {[
                { title: 'Lose 5kg in 60 days', status: '18% done', voted: 'BELIEVE' },
                { title: 'Learn React', status: '45% done', voted: 'BELIEVE' },
              ].map((pact, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{pact.title}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      pact.voted === 'BELIEVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {pact.voted}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{pact.status}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition">
            Sign Out
          </button>
        </div>
        
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  return null;
};

// Bottom Navigation Component
const BottomNav = ({ currentTab, setCurrentTab }: { currentTab: string; setCurrentTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'circles', icon: Users, label: 'Circles' },
    { id: 'create', icon: Plus, label: 'Create' },
    { id: 'leaderboard', icon: Trophy, label: 'Top' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 max-w-md mx-auto">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
              isActive 
                ? 'text-white bg-gradient-to-br from-emerald-500 to-blue-500 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CirclePact;
