'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCircles } from '@/hooks/useCircles';
import { useAuthStore } from '@/store/auth';
import { Circle } from '@/types';
import toast from 'react-hot-toast';
import PremiumLayout from '@/layouts/PremiumLayout';
import PremiumCard from '@/components/premium/PremiumCard';
import CircleStats from '@/components/premium/CircleStats';
import Leaderboard from '@/components/premium/Leaderboard';
import CircleMembers from '@/components/premium/CircleMembers';
import { Plus, Users, Lock, Globe, Search, TrendingUp } from 'lucide-react';

export default function CirclesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: circlesData = [], isLoading } = useCircles();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'members' | 'active' | 'trending'>('members');

  const circles = circlesData as Circle[];
  const filtered = circles.filter((circle) =>
    circle.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'members') return (b.members?.length || 0) - (a.members?.length || 0);
    return 0;
  });

  if (!user) {
    return null;
  }

  return (
    <PremiumLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Circles</h1>
            <p className="text-sm text-slate-600 mt-1">Trusted communities</p>
          </div>
          <button
            onClick={() => router.push('/circles/create')}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search circles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['members', 'active', 'trending'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all ${
                sortBy === sort
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sort === 'members' ? 'By Members' : sort === 'active' ? 'Most Active' : 'Trending'}
            </button>
          ))}
        </div>

        {/* Circles */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <PremiumCard>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No circles found</p>
              <p className="text-sm text-slate-500">Create one or join existing circles</p>
            </div>
          </PremiumCard>
        ) : (
          <div className="space-y-3">
            {sorted.map((circle) => (
              <div
                key={circle.id}
                onClick={() => router.push(`/circles/${circle.id}`)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{circle.name}</h3>
                    <p className="text-xs text-slate-600">{circle.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    circle.is_public
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {circle.is_public ? 'Public' : 'Private'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{circle.members?.length || 0} members</span>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PremiumLayout>
  );
}
