'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Navbar from '@/components/Navbar';
import { circleService, circleJoinRequestService, joinRequestService } from '@/services/api';
import { Circle, Pact } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Globe, Lock, Target, Plus, Trophy } from 'lucide-react';
import CircleLeaderboard from '@/components/CircleLeaderboard';
import InviteMembersModal from '@/components/InviteMembersModal';

export default function CircleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isInitialized } = useRequireAuth();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);

  const circleId = parseInt(params.id as string);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        const circleRes = await circleService.getById(circleId);
        setCircle(circleRes.data);

        const membersRes = await circleJoinRequestService.listMembers(circleId);
        const fetchedMembers = membersRes.data || [];
        setMembers(fetchedMembers);

        // Use is_member field from API response
        setIsMember(circleRes.data?.is_member || false);

        // Fetch pacts for this circle
        const pactsRes = await circleService.listPacts(circleId);
        setPacts(pactsRes.data || []);
      } catch (error: any) {
        toast.error('Failed to load circle');
        router.push('/circles');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, user, router, circleId]);

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

  const handleJoinCircle = async () => {
    try {
      if (circle?.visibility === 'public') {
        await circleService.join(circleId);
        toast.success('Joined circle!');
      } else {
        await circleJoinRequestService.sendRequest(circleId);
        toast.success('Join request sent!');
      }

      // Refresh circle data to get updated is_member status
      const circleRes = await circleService.getById(circleId);
      setCircle(circleRes.data);
      setIsMember(circleRes.data?.is_member || false);

      const membersRes = await circleJoinRequestService.listMembers(circleId);
      setMembers(membersRes.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to join circle');
    }
  };

  const handleLeaveCircle = async () => {
    if (!window.confirm('Are you sure you want to leave this circle?')) return;
    
    try {
      await circleService.leave(circleId);
      toast.success('Left circle');
      router.push('/circles');
    } catch (error: any) {
      toast.error('Failed to leave circle');
    }
  };

  const handleRequestJoinPact = async (pactId: number) => {
    try {
      await joinRequestService.sendRequest(pactId);
      toast.success('Join request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to request to join circle pact');
    }
  };

  const canViewPacts = circle?.is_public || isMember;
  const isOwner =
    (typeof user.id === 'number' && circle?.owner_id === user.id) ||
    (typeof user.username === 'string' && circle?.owner_username === user.username);

  if (!circle || loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  // Mock leaderboard data for demo
  const mockLeaderboardEntries = [
    {
      rank: 1,
      userId: 1,
      username: 'alice_doe',
      avatar: '👩',
      pactsCompleted: 12,
      winRate: 92,
      rewardsEarned: 5200,
      streak: 12,
    },
    {
      rank: 2,
      userId: 2,
      username: 'bob_smith',
      avatar: '👨',
      pactsCompleted: 8,
      winRate: 85,
      rewardsEarned: 3400,
      streak: 7,
    },
    {
      rank: 3,
      userId: 3,
      username: 'charlie_brown',
      avatar: '🧔',
      pactsCompleted: 6,
      winRate: 78,
      rewardsEarned: 2100,
      streak: 5,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Circles
          </button>

          {/* Circle Header */}
          <div className="card mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{circle.name}</h1>
                <p className="text-slate-600 text-lg">{circle.description}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                  circle.visibility === 'public'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {circle.visibility === 'public' ? (
                  <>
                    <Globe className="w-4 h-4" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Private
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-200 border-b">
              <div>
                <p className="text-slate-600 text-sm">Members</p>
                <p className="text-2xl font-bold text-slate-900">
                  {circle.member_count ?? members.length}
                </p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Pacts</p>
                <p className="text-2xl font-bold text-slate-900">{pacts.length}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Created</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Date(circle.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {isMember ? (
                <>
                  <button
                    onClick={() => router.push('/pacts/create')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Pact
                  </button>
                  <button
                    onClick={() => setInviteModal(true)}
                    className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-5 h-5" />
                    Invite Members
                  </button>
                  {!isOwner && (
                    <button
                      onClick={handleLeaveCircle}
                      className="btn-secondary"
                    >
                      Leave Circle
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleJoinCircle}
                  className="btn-primary"
                >
                  {circle.visibility === 'public' ? 'Join Circle' : 'Request to Join'}
                </button>
              )}
            </div>
          </div>

          {/* Members Section */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Members
            </h2>
            {members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member: any) => (
                  <div
                    key={`${member.user_id}-${member.role}`}
                    className="p-4 rounded-lg border border-slate-200 hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.username}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200">
                          {member.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{member.full_name}</p>
                        <p className="text-sm text-slate-600">@{member.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium capitalize">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No members yet</p>
            )}
          </div>

          {/* Leaderboard Section */}
          {isMember && (
            <div className="card mb-8">
              <CircleLeaderboard
                entries={[
                  {
                    rank: 1,
                    userId: 1,
                    username: 'alice_doe',
                    avatar: '👩',
                    pactsCompleted: 12,
                    winRate: 92,
                    rewardsEarned: 5200,
                    streak: 12,
                  },
                  {
                    rank: 2,
                    userId: 2,
                    username: 'bob_smith',
                    avatar: '👨',
                    pactsCompleted: 8,
                    winRate: 85,
                    rewardsEarned: 3400,
                    streak: 7,
                  },
                  {
                    rank: 3,
                    userId: 3,
                    username: 'charlie_brown',
                    avatar: '🧔',
                    pactsCompleted: 6,
                    winRate: 78,
                    rewardsEarned: 2100,
                    streak: 5,
                  },
                ]}
              />
            </div>
          )}

          {/* Pacts Section */}
          <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600" />
              Pacts in This Circle
            </h2>
            {!canViewPacts ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 mb-4">Join this circle to view and request its pacts.</p>
                <button onClick={handleJoinCircle} className="btn-primary">
                  {circle.is_public ? 'Join Circle' : 'Request to Join'}
                </button>
              </div>
            ) : pacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pacts.map((pact) => (
                  <div
                    key={pact.id}
                    onClick={() => router.push(`/pacts/${pact.id}`)}
                    className="card border-2 border-purple-200 hover:border-purple-600 cursor-pointer transition-colors"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {pact.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                      {pact.description}
                    </p>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pact.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : pact.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : pact.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pact.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Stake:</span>
                        <span className="font-bold text-purple-600">₹{pact.stake_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Deadline:</span>
                        <span className="font-medium">
                          {new Date((pact as any).deadline || (pact as any).end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/pacts/${pact.id}`);
                        }}
                        className="w-full btn-secondary text-sm"
                        type="button"
                      >
                        View Pact
                      </button>
                      {pact.creator_id !== user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestJoinPact(pact.id);
                          }}
                          className="w-full btn-primary text-sm"
                          type="button"
                          disabled={!isMember && circle.visibility !== 'public'}
                        >
                          {!isMember && circle.visibility !== 'public'
                            ? 'Join Circle to request'
                            : 'Request to Join'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 mb-4">No pacts in this circle yet</p>
                {isMember && (
                  <button
                    onClick={() => router.push('/pacts/create')}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Pact
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Members Modal */}
      {circle && (
        <InviteMembersModal
          isOpen={inviteModal}
          onClose={() => setInviteModal(false)}
          circleId={circle.id}
          circleName={circle.name}
        />
      )}
    </>
  );
}
