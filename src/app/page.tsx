'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/auth';
import { circleService, pactService } from '@/services/api';
import { Circle, Pact } from '@/types';
import { Users, Target, Plus, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [loading, setLoading] = useState(true);
  const [circlesSort, setCirclesSort] = useState<'people' | 'created'>('people');
  const [pactsSort, setPactsSort] = useState<'value' | 'deadline'>('value');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [circlesRes, pactsRes] = await Promise.all([
          circleService.list(),
          pactService.list(),
        ]);
        setCircles(circlesRes.data || []);
        setPacts(pactsRes.data || []);
      } catch (error: any) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const sortedCircles = [...circles].sort((a, b) => {
    if (circlesSort === 'people') {
      return (b.members?.length || 0) - (a.members?.length || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sortedPacts = [...pacts].sort((a, b) => {
    if (pactsSort === 'value') {
      return b.stake_amount - a.stake_amount;
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
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

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                A Social Network Built on{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Execution
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                Create real-world commitments inside trusted circles, stake your reputation, and prove yourself through verified execution.
              </p>

              <div className="flex gap-4 justify-center">
                <Link href="/auth/login" className="btn-primary text-lg px-8 py-3">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-secondary text-lg px-8 py-3">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
              <div className="card text-center">
                <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Create Pacts</h3>
                <p className="text-slate-600 text-sm">Set structured commitments with deadlines and stakes</p>
              </div>

              <div className="card text-center">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Trusted Circles</h3>
                <p className="text-slate-600 text-sm">Build accountability within close-knit communities</p>
              </div>

              <div className="card text-center">
                <TrendingUp className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">4-Point Verification</h3>
                <p className="text-slate-600 text-sm">Rigorous verification system ensures real accountability</p>
              </div>

              <div className="card text-center">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-900 mb-2">Build Reputation</h3>
                <p className="text-slate-600 text-sm">Earn credibility through verified execution</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome back, {user.full_name}!
            </h1>
            <p className="text-slate-600">
              Reputation Score: <span className="font-bold text-blue-600">{user.reputation_score.toFixed(2)}</span>
            </p>
          </div>

          {/* Two Column Layout with Curved Boxes */}
          {loading ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* My Circles Section */}
              <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-8 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        Circles
                      </h2>
                  <span className="text-3xl font-bold text-blue-600">{circles.length}</span>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setCirclesSort('people')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      circlesSort === 'people'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-blue-300 hover:border-blue-600'
                    }`}
                  >
                    By People
                  </button>
                  <button
                    onClick={() => setCirclesSort('created')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      circlesSort === 'created'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-blue-300 hover:border-blue-600'
                    }`}
                  >
                    Newest
                  </button>
                </div>

                {/* Circles List */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {sortedCircles.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600">No circles yet</p>
                    </div>
                  ) : (
                    sortedCircles.map((circle) => (
                      <div
                        key={circle.id}
                        onClick={() => router.push(`/circles/${circle.id}`)}
                        className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 transform"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-900 flex-1">{circle.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(circle.id);
                            }}
                            className="ml-2"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                favorites.has(circle.id)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300 hover:text-yellow-400'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-1 mb-3">
                          {circle.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            👥 {circle.members?.length || 0} members
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            circle.is_public ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {circle.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => router.push('/circles')}
                  className="w-full btn-primary py-3 rounded-2xl font-bold"
                >
                  View All Circles
                </button>
              </div>

              {/* My Pacts Section */}
              <div className="rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-8 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-8 h-8 text-purple-600" />
                    Pacts
                  </h2>
                  <span className="text-3xl font-bold text-purple-600">{pacts.length}</span>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setPactsSort('value')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      pactsSort === 'value'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-700 border border-purple-300 hover:border-purple-600'
                    }`}
                  >
                    By Value
                  </button>
                  <button
                    onClick={() => setPactsSort('deadline')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      pactsSort === 'deadline'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-700 border border-purple-300 hover:border-purple-600'
                    }`}
                  >
                    By Deadline
                  </button>
                </div>

                {/* Pacts List */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {sortedPacts.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-2xl">
                      <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600">No pacts yet</p>
                    </div>
                  ) : (
                    sortedPacts.map((pact) => (
                      <div
                        key={pact.id}
                        onClick={() => router.push(`/pacts/${pact.id}`)}
                        className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 transform"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-900 flex-1 line-clamp-1">
                            {pact.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(pact.id + 1000);
                            }}
                            className="ml-2"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                favorites.has(pact.id + 1000)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300 hover:text-yellow-400'
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-1 mb-3">
                          {pact.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-purple-600">₹{pact.stake_amount}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pact.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : pact.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : pact.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {pact.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                          📅 {new Date(pact.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => router.push('/pacts')}
                  className="w-full btn-primary bg-purple-600 hover:bg-purple-700 py-3 rounded-2xl font-bold mb-3"
                >
                  View All Pacts
                </button>
                <button
                  onClick={() => router.push('/pacts/create')}
                  className="w-full btn-secondary py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create New Pact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
