'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import DetailPageHeader from '@/components/DetailPageHeader';
import { circleService, circleJoinRequestService, joinRequestService, userService } from '@/services/api';
import { Circle, Pact } from '@/types';
import toast from 'react-hot-toast';
import { Users, Globe, Target, Plus, Trophy, Calendar, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import CircleLeaderboard from '@/components/CircleLeaderboard';
import InviteMembersModal from '@/components/InviteMembersModal';
import ConfirmModal from '@/components/ConfirmModal';
import PactCard from '@/components/PactCard';
import { useCountUp } from '@/components/pact-ui/useCountUp';
import UserAvatarLink from '@/components/UserAvatarLink';

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
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Real per-member stats for this circle — no fallback to placeholder/demo
  // entries. The backend has no dedicated circle-leaderboard endpoint (both
  // /api/circles/{id}/leaderboard and /api/leaderboards/circles/{id} 404),
  // so this is built client-side from each member's real
  // /api/users/{id}/stats response, fetched alongside the member list.
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    { rank: number; userId: number; username: string; avatarUrl: string | null; pactsCompleted: number; winRate: number; streak: number }[]
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

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

  // Build the leaderboard from each real member's real stats. There is no
  // dedicated circle-leaderboard endpoint on the backend, so this fetches
  // /api/users/{id}/stats per member (the same endpoint the profile page
  // uses) and ranks them client-side — Promise.allSettled so one member's
  // failed request doesn't blank out the whole leaderboard.
  useEffect(() => {
    if (members.length === 0) {
      setLeaderboardEntries([]);
      setLeaderboardLoading(false);
      return;
    }

    let cancelled = false;
    setLeaderboardLoading(true);

    Promise.allSettled(members.map((member: any) => userService.getStats(member.user_id))).then((results) => {
      if (cancelled) return;

      const entries = results
        .map((result, index) => {
          if (result.status !== 'fulfilled') return null;
          const member = members[index];
          const stats = result.value.data;
          return {
            userId: member.user_id,
            username: member.username,
            avatarUrl: member.avatar_url ?? null,
            pactsCompleted: stats?.pacts_completed ?? 0,
            winRate: stats?.win_rate ?? 0,
            streak: stats?.current_streak ?? 0,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => b.pactsCompleted - a.pactsCompleted || b.winRate - a.winRate)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboardEntries(entries);
      setLeaderboardLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [members]);

  if (!isInitialized) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--pact-violet)' }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleJoinCircle = async () => {
    try {
      await circleService.join(circleId);
      toast.success('Joined circle!');

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
    setLeaving(true);
    try {
      await circleService.leave(circleId);
      toast.success('Left circle');
      router.push('/circles');
    } catch (error: any) {
      toast.error('Failed to leave circle');
    } finally {
      setLeaving(false);
      setLeaveModal(false);
    }
  };

  const handleRequestJoinPact = async (pactId: number) => {
    try {
      await joinRequestService.sendRequest(pactId);
      toast.success('Pact join request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to request to join circle pact');
    }
  };

  const canViewPacts = isMember;
  const isOwner =
    (typeof user.id === 'number' && circle?.owner_id === user.id) ||
    (typeof user.username === 'string' && circle?.owner_username === user.username);

  if (!circle || loading) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--pact-violet)' }} />
      </div>
    );
  }

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      <DetailPageHeader title={circle.name || 'Circle'} backHref="/circles" maxWidthClassName="max-w-4xl" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Circle Header */}
        <div className="pact-card relative overflow-hidden rounded-[28px] p-6 sm:p-8 mb-8">
          {/* Ambient accent glow, matching the app's pink/violet identity */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--pact-pink), transparent 70%)' }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
              >
                {circle.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-[var(--pact-text)]">{circle.name}</h1>
                {circle.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--pact-text-dim)]">{circle.description}</p>
                )}
              </div>
            </div>
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
            >
              <Globe className="w-3.5 h-3.5" /> Circle
            </span>
          </div>

          {/* Stats row — connected as a single unified surface with icon chips
              instead of a bare grid, so it reads as part of the card rather
              than a disconnected data table. */}
          <div
            className="relative mt-6 flex items-stretch gap-1 rounded-2xl p-1.5"
            style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
          >
            <StatPill icon={Users} label="Members" value={<StatCount value={circle.member_count ?? members.length} />} />
            <div className="w-px self-center h-8" style={{ background: 'var(--pact-hairline)' }} />
            <StatPill icon={Target} label="Pacts" value={<StatCount value={pacts.length} />} />
            <div className="w-px self-center h-8" style={{ background: 'var(--pact-hairline)' }} />
            <StatPill
              icon={Calendar}
              label="Created"
              value={new Date(circle.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            />
          </div>

          {/* Action Buttons */}
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            {isMember ? (
              <>
                <button
                  onClick={() => router.push(`/pacts/create?circleId=${circleId}`)}
                  className="pact-btn-glow flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Pact
                </button>
                <button
                  onClick={() => setInviteModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition"
                  style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text)', border: '1px solid var(--pact-hairline)' }}
                >
                  <Users className="w-4 h-4" />
                  Invite Members
                </button>
                {!isOwner && (
                  <button
                    onClick={() => setLeaveModal(true)}
                    className="ml-auto text-sm font-medium text-[var(--pact-text-faint)] transition hover:text-[var(--pact-pink)]"
                  >
                    Leave Circle
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleJoinCircle}
                className="pact-btn-glow px-6 py-2.5 rounded-full text-sm font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
              >
                Join Circle
              </button>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="pact-card rounded-[28px] mb-8">
          <h2 className="text-2xl font-bold text-[var(--pact-text)] mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: 'var(--pact-violet)' }} />
            Members
          </h2>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member: any, index: number) => (
                <motion.div
                  key={`${member.user_id}-${member.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                  className="p-4 rounded-[24px] transition-colors"
                  style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatarLink name={member.username} avatarUrl={member.avatar_url} username={member.username} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-snug text-[var(--pact-text)]">{member.full_name}</p>
                      <p className="truncate text-sm leading-snug text-[var(--pact-text-faint)]">@{member.username}</p>
                    </div>
                    {member.role === 'owner' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-300">
                        <Crown className="h-3 w-3" />
                        Owner
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--pact-text-faint)]">
                        {member.role}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--pact-text-faint)]">No members yet. Be the first to join this circle.</p>
          )}
        </div>

        {/* Leaderboard Section — real data only, no fabricated entries.
            A circle with too few active members to produce a meaningful
            leaderboard (e.g. a brand-new circle) gets a dedicated empty
            state instead of an empty-looking table. */}
        {isMember && !leaderboardLoading && members.length < 2 && leaderboardEntries.length === 0 && (
          <div className="pact-card rounded-[28px] mb-8 px-6 py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--pact-text-faint)' }} />
            <p className="text-[var(--pact-text-dim)] font-medium">Leaderboard unlocks once your circle gets moving</p>
            <p className="text-sm text-[var(--pact-text-faint)] mt-1">
              Invite a few friends and start completing pacts together to see rankings here.
            </p>
          </div>
        )}
        {isMember && (leaderboardLoading || members.length >= 2 || leaderboardEntries.length > 0) && (
          <div className="mb-8">
            <CircleLeaderboard entries={leaderboardEntries} loading={leaderboardLoading} />
          </div>
        )}

        {/* Pacts Section */}
        <div className="pact-card rounded-[28px]">
          <h2 className="text-2xl font-bold text-[var(--pact-text)] mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" style={{ color: 'var(--pact-pink)' }} />
            Pacts in This Circle
          </h2>
          {!canViewPacts ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--pact-text-faint)' }} />
              <p className="text-[var(--pact-text-faint)] mb-4">Join this circle to view and request its pacts.</p>
              <button
                onClick={handleJoinCircle}
                className="pact-btn-glow px-6 py-3 rounded-full font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
              >
                Join Circle
              </button>
            </div>
          ) : pacts.length > 0 ? (
            <div className="space-y-6">
              {pacts.map((pact) => (
                <div key={pact.id} className="space-y-3">
                  <PactCard pact={pact} userVote={(pact as any).user_vote || (pact as any).userVote} />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push(`/pacts/${pact.id}`)}
                      className="w-full px-4 py-2.5 rounded-full font-medium text-sm transition"
                      style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text-dim)', border: '1px solid var(--pact-hairline)' }}
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
                        className="pact-btn-glow w-full px-4 py-2.5 rounded-full font-medium text-sm text-white transition disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                        type="button"
                        disabled={!isMember}
                      >
                        {!isMember ? 'Join Circle to join pact' : 'Join Pact'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--pact-text-faint)' }} />
              <p className="text-[var(--pact-text-faint)] mb-4">No pacts in this circle yet</p>
              {isMember && (
                <button
                  onClick={() => router.push(`/pacts/create?circleId=${circleId}`)}
                  className="pact-btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
                >
                  <Plus className="w-5 h-5" />
                  Create First Pact
                </button>
              )}
            </div>
          )}
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

      {/* Leave Circle Confirmation */}
      <ConfirmModal
        isOpen={leaveModal}
        onClose={() => setLeaveModal(false)}
        onConfirm={handleLeaveCircle}
        title="Leave circle?"
        description={`You'll lose access to ${circle.name}'s pacts and leaderboard until you rejoin.`}
        confirmLabel="Leave Circle"
        destructive
        loading={leaving}
      />
    </div>
  );
}

function StatCount({ value }: { value: number }) {
  const count = useCountUp(value);
  return <>{count}</>;
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--pact-surface)', color: 'var(--pact-violet)' }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-base font-bold leading-tight text-[var(--pact-text)]">{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] leading-tight text-[var(--pact-text-faint)]">
          {label}
        </p>
      </div>
    </div>
  );
}
