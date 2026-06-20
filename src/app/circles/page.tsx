'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { circleService, circleJoinRequestService } from '@/services/api';
import { Circle } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Users, Lock, Globe, Star } from 'lucide-react';

export default function CirclesPage() {
  const router = useRouter();
  const { user, isInitialized } = useRequireAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'people' | 'newest' | 'favorites'>('people');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCircles = async () => {
      try {
        const response = await circleService.list();
        setCircles(response.data || []);
      } catch (error: any) {
        toast.error('Failed to load circles');
      } finally {
        setLoading(false);
      }
    };

    fetchCircles();
  }, [user, isInitialized, router]);

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

  const filteredCircles = circles.filter((circle) => {
    const matchesSearch = circle.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterBy === 'all' ||
      (filterBy === 'public' && circle.is_public) ||
      (filterBy === 'private' && !circle.is_public);
    return matchesSearch && matchesFilter;
  });

  const sortedCircles = [...filteredCircles].sort((a, b) => {
    if (sortBy === 'people') {
      return (b.members?.length || 0) - (a.members?.length || 0);
    } else if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      // favorites
      return (favorites.has(b.id) ? 1 : 0) - (favorites.has(a.id) ? 1 : 0);
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

  const handleJoinCircle = async (circle: Circle, e: React.MouseEvent) => {
    if (!circle || typeof circle.is_public !== 'boolean') {
      toast.error('Invalid circle data. Please refresh and try again.');
      return;
    }

    e.stopPropagation();
    try {
      if (circle.is_public) {
        await circleService.join(circle.id);
        toast.success('Joined circle!');
      } else {
        await circleJoinRequestService.sendRequest(circle.id);
        toast.success('Join request sent!');
      }

      const response = await circleService.list();
      setCircles(response.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to join circle');
    }
  };

  const isUserMemberOf = (circle: Circle): boolean => {
    if (!user) return false;
    return circle.members?.some((m: any) => m.id === user.id) || false;
  };

  const isUserCreator = (circle: Circle): boolean => {
    return circle.owner_id === user?.id;
  };

  const getButtonText = (circle: Circle): string => {
    if (isUserCreator(circle)) return 'View Circle';
    if (isUserMemberOf(circle)) return 'View Circle';
    return circle.is_public ? 'Join Circle' : 'Request to Join';
  };

  const handleCircleAction = (circle: Circle, e: React.MouseEvent) => {
    if (isUserCreator(circle) || isUserMemberOf(circle)) {
      // Navigate to circle details if creator or member
      router.push(`/circles/${circle.id}`);
    } else {
      // Join circle if not member
      handleJoinCircle(circle, e);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Circles</h1>
              <p className="text-slate-600 mt-2">Discover and join trusted circles</p>
            </div>
            <button
              onClick={() => router.push('/circles/create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Circle
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterBy === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterBy('public')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterBy === 'public'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-600'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => setFilterBy('private')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterBy === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-600'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setSortBy('people')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  sortBy === 'people'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-600'
                }`}
              >
                By People
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
              <button
                onClick={() => setSortBy('favorites')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1 ${
                  sortBy === 'favorites'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-600'
                }`}
              >
                <Star className="w-4 h-4" />
                Favorites
              </button>
            </div>
          </div>

          {/* Circles Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : sortedCircles.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-4">
                {search ? 'No circles found matching your search' : 'No circles yet'}
              </p>
              <button
                onClick={() => router.push('/circles/create')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Circle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCircles.map((circle) => (
                <div
                  key={circle.id}
                  onClick={() => router.push(`/circles/${circle.id}`)}
                  className="card cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all relative"
                >
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(circle.id);
                    }}
                    className="absolute top-4 right-4 z-10"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        favorites.has(circle.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>

                  {/* Circle Header */}
                  <div className="mb-4 pr-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{circle.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          circle.is_public
                            ? 'bg-green-100 text-green-700 flex items-center gap-1'
                            : 'bg-slate-100 text-slate-700 flex items-center gap-1'
                        }`}
                      >
                        {circle.is_public ? (
                          <>
                            <Globe className="w-3 h-3" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Private
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {circle.description || 'No description provided'}
                    </p>
                  </div>

                  {/* Circle Stats */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Members:</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {circle.members?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Created:</span>
                      <span className="font-medium">
                        {new Date(circle.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Member Preview */}
                  {circle.members && circle.members.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 mb-2">Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {circle.members.slice(0, 3).map((member) => (
                          <span
                            key={member.id}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                          >
                            {member.full_name}
                          </span>
                        ))}
                        {circle.members.length > 3 && (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                            +{circle.members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => handleCircleAction(circle, e)}
                    className={`w-full text-sm py-2 rounded-lg font-medium transition-colors ${
                      isUserCreator(circle) || isUserMemberOf(circle)
                        ? 'btn-secondary'
                        : 'btn-primary'
                    }`}
                  >
                    {getButtonText(circle)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
