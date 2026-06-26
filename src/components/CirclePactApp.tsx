'use client';

import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Upload, Camera, Image as ImageIcon, ChevronDown, Home, Users, Plus, Trophy, User as UserIcon, X, Zap, Target, Award, Bell } from 'lucide-react';

const CirclePact = () => {
  const [currentTab, setCurrentTab] = useState('feed');
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
    alert(`Upload proof for pact ${pactId}`);
  };

  if (currentTab === 'feed') {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        {/* Enhanced Header with Welcome & Notification */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                MC
              </div>
              <div>
                <p className="text-xs text-gray-500">Welcome back</p>
                <h1 className="text-lg font-bold text-gray-900">Maya</h1>
              </div>
            </div>
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
            </button>
          </div>

          {/* Streak Card - Dark Navy with Week Tracker */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-300 mb-1">Current streak</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">14</span>
                  <span className="text-lg text-slate-300">days</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">
                🔥
              </div>
            </div>
            {/* Week Tracker */}
            <div className="flex justify-between gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx < 3 || idx === 4 || idx > 5 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {idx < 3 || idx === 4 || idx > 5 ? '✓' : ''}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">4</p>
              <p className="text-xs text-gray-600 font-medium">Active</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-xs text-gray-600 font-medium">Circles</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md transition">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">27</p>
              <p className="text-xs text-gray-600 font-medium">Done</p>
            </div>
          </div>
        </div>

        {/* Feed Cards - Facebook Style */}
        <div className="px-4 py-4 space-y-4">
          {pacts.map((pact) => (
            <div key={pact.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold">
                      {pact.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">@{pact.creator}</p>
                      <p className="text-xs text-gray-500">{pact.category} • Day {pact.daysCurrent}/{pact.daysTotal}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                    {pact.category}
                  </span>
                </div>
              </div>

              {/* Card Title */}
              <div className="px-4 py-4">
                <h2 className="text-xl font-black text-gray-900 mb-2">{pact.title}</h2>
                <p className="text-sm text-gray-600">{pact.proofClips.length} proof clips submitted</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Confidence</p>
                  <p className="font-black text-lg text-blue-600">{pact.confidence}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Believers</p>
                  <p className="font-black text-lg text-green-600">{(pact.believers / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Doubters</p>
                  <p className="font-black text-lg text-red-600">{(pact.doubters / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Time Left</p>
                  <p className="font-black text-lg text-orange-600">{pact.daysCurrent}d</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-4 py-3 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">PROGRESS</span>
                  <span className="text-sm font-bold text-gray-900">{pact.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${pact.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Proof Clips Preview */}
              <div className="px-4 py-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Recent Proof</p>
                <div className="flex flex-wrap gap-2">
                  {pact.proofClips.slice(-3).map((clip, idx) => (
                    <div key={idx} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-lg">
                      Day {clip.day}: {clip.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Proof Button */}
              <div className="px-4 py-2 border-t border-gray-200 flex gap-2">
                <button 
                  onClick={() => handleUploadProof(pact.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-sm rounded-lg transition"
                >
                  <Camera className="w-4 h-4" />
                  Photo
                </button>
                <button 
                  onClick={() => handleUploadProof(pact.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-sm rounded-lg transition"
                >
                  <Upload className="w-4 h-4" />
                  File
                </button>
                <button 
                  onClick={() => handleUploadProof(pact.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-sm rounded-lg transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  Gallery
                </button>
              </div>

              {/* Vote Buttons */}
              <div className="grid grid-cols-2 gap-2 px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() => handleVote(pact.id, 'doubt')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    pact.userVote === 'doubt'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                  }`}
                >
                  🚫 DOUBT
                </button>
                <button
                  onClick={() => handleVote(pact.id, 'believe')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    pact.userVote === 'believe'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  ✅ BELIEVE
                </button>
              </div>

              {/* Engagement Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition text-sm">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">{Math.floor(pact.believers * 0.8)}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{pact.comments.length}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition text-sm">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">Share</span>
                </button>
              </div>
            </div>
          ))}
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
              isActive 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CirclePact;
