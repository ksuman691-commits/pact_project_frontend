'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import TopNav from '@/components/TopNav';
import { pactService } from '@/services/api';
import { Pact } from '@/types';
import toast from 'react-hot-toast';
import { Plus, TrendingUp } from 'lucide-react';
import PactCard from '@/components/PactCard';
import { useSkipPact, useSupportPact } from '@/hooks/usePactActions';

export default function PactsPage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'deadline' | 'newest'>('value');
  const supportMutation = useSupportPact();
  const skipMutation = useSkipPact();

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

  const handleVote = async (pactId: number, vote: string) => {
    if (vote === 'support') {
      await supportMutation.mutateAsync(pactId);
      return;
    }
    await skipMutation.mutateAsync(pactId);
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
            <div className="space-y-6">
              {sortedPacts.map((pact) => (
                <PactCard
                  key={pact.id}
                  pact={pact}
                  userVote={(pact as any).user_vote || (pact as any).userVote}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
