'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Heart, MessageCircle, Share2, Upload, Camera, Image as ImageIcon, ChevronDown, Home, Users, Plus, Trophy, User as UserIcon, X, Zap, Target, Award, Bell } from 'lucide-react';
import ShareModal from './ShareModal';

const CirclePact = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentTab, setCurrentTab] = useState('feed');
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; pact: any | null }>({ isOpen: false, pact: null });
  const [selectedPactId, setSelectedPactId] = useState(null);
  const [pacts, setPacts] = useState([
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
  ]);

  const handleVote = (pactId: number, vote: string) => {
    setPacts(pacts.map(p => 
      p.id === pactId ? { ...p, userVote: p.userVote === vote ? null : vote } : p
    ));
  };

  const handleUploadProof = (pactId: number) => {
    router.push(`/pacts/${pactId}`);
  };

  const handleCreatePact = () => {
    router.push('/pacts/create');
  };

  const handleOpenCircles = () => {
    router.push('/circles');
  };

  const getUserName = () => {
    if (!user) return 'Friend';
    return user.full_name ? user.full_name.split(' ')[0] : user.username;
  };

  const getUserInitials = () => {
    if (!user) return 'CP';
    const name = user.full_name || user.username;
    return name
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  if (currentTab === 'feed') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Elegant Header with Welcome & Action Buttons */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {getUserInitials()}
              </div>
              <div>
                <p className="text-xs text-gray-500">Welcome back</p>
                <h1 className="text-sm font-bold text-gray-900">{getUserName()}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Create Pact Circular Button */}
              <button
                onClick={handleCreatePact}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
              {/* Open Circles List */}
              <button
                onClick={handleOpenCircles}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md"
              >
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
              <p className="text-sm font-bold text-gray-900">{pacts.length}</p>
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

        {/* Feed Cards - Instagram Style */}
        <div className="px-4 py-3 space-y-6">
          {pacts.map((pact) => (
            <div key={pact.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Card Header - Minimal */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-300 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                    {pact.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">@{pact.creator}</p>
                    <p className="text-xs text-gray-500">Day {pact.daysCurrent}/{pact.daysTotal}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Pact Title with Spacing */}
              <div className="px-4 py-2">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{pact.title}</h2>
              </div>

              {/* Spacer & Image Area - Instagram Style */}
              <div className="mx-4 my-3 aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-center shadow-sm">
                <div className="text-center">
                  <p className="text-6xl mb-3">{pact.avatar}</p>
                  <p className="text-xs text-gray-600 font-medium">{pact.proofClips.length} proof clips</p>
                </div>
              </div>

              {/* Stats - Compact and Subtle */}
              <div className="px-4 py-2 flex gap-3 justify-between text-xs">
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-0.5">Confidence</p>
                  <p className="font-bold text-emerald-600 text-sm">{pact.confidence}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-0.5">Believe</p>
                  <p className="font-bold text-blue-600 text-sm">{(pact.believers / 1000).toFixed(0)}k</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-0.5">Doubt</p>
                  <p className="font-bold text-red-600 text-sm">{(pact.doubters / 1000).toFixed(0)}k</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-0.5">Time Left</p>
                  <p className="font-bold text-orange-600 text-sm">{pact.timeRemaining}</p>
                </div>
              </div>

              {/* Progress Bar - Subtle */}
              <div className="px-4 py-2">
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"
                    style={{ width: `${pact.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Elegant Action Buttons - Like Instagram */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                <div className="flex gap-2">
                  {/* Subtle Believe Button */}
                  <button
                    onClick={() => handleVote(pact.id, 'believe')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      pact.userVote === 'believe'
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ✓ Believe
                  </button>
                  {/* Subtle Doubt Button */}
                  <button
                    onClick={() => handleVote(pact.id, 'doubt')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      pact.userVote === 'doubt'
                        ? 'bg-red-100 text-red-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    ✗ Doubt
                  </button>
                </div>
                {/* Upload Proof Subtle */}
                <button 
                  onClick={() => handleUploadProof(pact.id)}
                  className="text-gray-500 hover:text-gray-700 transition text-xs font-medium flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  Proof
                </button>
              </div>

              {/* Circle Members - Small Circular Avatars */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 font-medium">Members:</p>
                  <div className="flex -space-x-2">
                    {[
                      { name: 'A', bg: 'from-emerald-400 to-emerald-600' },
                      { name: 'P', bg: 'from-blue-400 to-blue-600' },
                      { name: 'R', bg: 'from-purple-400 to-purple-600' },
                      { name: 'S', bg: 'from-pink-400 to-pink-600' },
                    ].map((member, idx) => (
                      <div 
                        key={idx}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${member.bg} flex items-center justify-center text-white text-xs font-bold border-2 border-white hover:scale-110 transition-transform cursor-pointer`}
                        title={`Member ${member.name}`}
                      >
                        {member.name}
                      </div>
                    ))}
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white text-center">
                      +2
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Footer */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs">
                <button className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  {Math.floor(pact.believers * 0.8)}
                </button>
                <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition font-medium">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {pact.comments.length}
                </button>
                <div className="flex items-center gap-2">
                  {/* Social Icons */}
                  <div className="flex gap-1.5">
                    {/* Instagram */}
                    <button 
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                      title="Share on Instagram"
                      onClick={() => setShareModal({ isOpen: true, pact })}
                    >
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                      </svg>
                    </button>

                    {/* LinkedIn */}
                    <button 
                      className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                      title="Share on LinkedIn"
                      onClick={() => setShareModal({ isOpen: true, pact })}
                    >
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </button>

                    {/* X */}
                    <button 
                      className="w-5 h-5 rounded-full bg-black hover:bg-gray-900 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                      title="Share on X"
                      onClick={() => setShareModal({ isOpen: true, pact })}
                    >
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.223-6.831-5.974 6.831H2.882l7.732-8.835L1.227 2.25h6.802l4.721 6.247 5.462-6.247zM17.002 18.807h1.844L6.603 3.552H4.674l12.328 15.255z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-4 bg-gray-200" />

                  {/* Share Button */}
                  <button 
                    onClick={() => setShareModal({ isOpen: true, pact })}
                    className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition font-medium"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Share Modal */}
        <ShareModal 
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, pact: null })}
          pact={shareModal.pact}
        />
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

          <button
            onClick={() => router.push('/circles/create')}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
          >
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
