'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import TopNav from '@/components/TopNav';
import { pactService } from '@/services/api';
import { Pact } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Star, TrendingUp } from 'lucide-react';

export default function PactsPage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'deadline' | 'newest'>('value');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchPacts = async () => {
      try {
        const params = filterStatus !== 'all' ? { status_filter: filterStatus } : {};
        const response = await pactService.list(params);
        setPacts(response.data);
      } catch (error: any) {
        toast.error('Failed to load pacts');
      } finally {
        setLoading(false);
      }
    };

    fetchPacts();
  }, [isInitialized, user, router, filterStatus]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sortedPacts = [...pacts].sort((a, b) => {
    if (sortBy === 'value') {
      return (b.stake_amount ?? 0) - (a.stake_amount ?? 0);
    } else if (sortBy === 'deadline') {
      return new Date(a.deadline ?? a.end_date ?? '').getTime() - new Date(b.deadline ?? b.end_date ?? '').getTime();
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav showBack={true} />
      <div className="pt-32 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900">All Pacts</h1>
            <button
              onClick={() => router.push('/pacts/create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Pact
            </button>
          </div>

          {/* Filter and Sort Buttons */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {/* Status Filters */}
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSortBy('value')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1 ${
                  sortBy === 'value'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                By Value
              </button>
              <button
                onClick={() => setSortBy('deadline')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  sortBy === 'deadline'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-600'
                }`}
              >
                By Deadline
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  sortBy === 'newest'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-600'
                }`}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Pacts List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : pacts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-600 mb-4">No pacts found</p>
              <button
                onClick={() => router.push('/pacts/create')}
                className="btn-primary"
              >
                Create Your First Pact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPacts.map((pact) => (
                <div
                  key={pact.id}
                  onClick={() => router.push(`/pacts/${pact.id}`)}
                  className="card cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all relative"
                >
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(pact.id);
                    }}
                    className="absolute top-4 right-4 z-10"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        favorites.has(pact.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>

                  <div className="mb-4 pr-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {pact.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {pact.description}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span
                        className={`badge text-xs font-medium ${
                          pact.status === 'completed'
                            ? 'badge-success'
                            : pact.status === 'failed'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {pact.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Stake:</span>
                      <span className="font-bold text-purple-600">₹{pact.stake_amount ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Deadline:</span>
                      <span className="font-medium">
                        {new Date(pact.deadline ?? pact.end_date ?? '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button className="w-full btn-secondary text-sm">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
