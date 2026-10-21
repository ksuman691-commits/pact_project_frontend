'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AddToCircleSheet from '@/components/AddToCircleSheet';
import FeedPactCard from '@/components/FeedPactCard';
import ProfileHeader, { profileButton } from '@/components/profile/ProfileHeader';
import SegmentTabs from '@/components/profile/SegmentTabs';
import PeopleSheet from '@/components/profile/PeopleSheet';
import TipButton from '@/components/tips/TipButton';
import { useAuthStore } from '@/store/auth';
import { userService } from '@/services/api';
import {
  useAcceptFollow,
  useFollowers,
  useFollowing,
  useFollowState,
  useRejectFollow,
  useRemoveFollow,
  useRequestFollow,
} from '@/hooks/useFollows';
import { useUserByUsername, useUserStats, useUserRelationship, useUserCircles } from '@/hooks/useUserQueries';
import { useSmartBack } from '@/hooks/useSmartBack';
import { useSupporters } from '@/hooks/useTips';

const INK = '#17181D';
const MUTED = '#5A5C63';

type Tab = 'active' | 'completed' | 'circles';

export default function PublicProfilePage() {
  const router = useRouter();
  const goBack = useSmartBack('/feed');
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();

  const isOwnProfile =
    typeof currentUser?.username === 'string' && currentUser.username.trim().toLowerCase() === username.trim().toLowerCase();

  // Your own profile lives at /profile, with the editing controls.
  useEffect(() => {
    if (isOwnProfile) router.replace('/profile');
  }, [isOwnProfile, router]);

  const [tab, setTab] = useState<Tab>('active');
  const [peopleSheet, setPeopleSheet] = useState<'followers' | 'following' | null>(null);
  const [showAddToCircle, setShowAddToCircle] = useState(false);

  const userByUsernameQuery = useUserByUsername(username);
  const profileUser = userByUsernameQuery.data?.data;
  const profileUserId = profileUser?.id;

  const relationshipQuery = useUserRelationship(profileUserId || 0);
  const relationship = relationshipQuery.data?.data;
  const sharedCircleIds: number[] = relationship?.shared_circle_ids ?? relationship?.sharedCircleIds ?? [];
  const profileCirclesQuery = useUserCircles(profileUserId || 0);
  const profileCircles = (profileCirclesQuery.data?.data ?? []) as any[];
  const sharedCircles = profileCircles.filter((circle: any) => sharedCircleIds.includes(Number(circle.id)));

  const userStatsQuery = useUserStats(profileUserId || 0);
  const profilePactsQuery = useQuery({
    queryKey: ['profile-user-pacts', profileUserId],
    queryFn: () => userService.getPacts(profileUserId as number),
    enabled: typeof profileUserId === 'number' && profileUserId > 0,
    staleTime: 1000 * 60,
  });
  const pacts = useMemo(() => (profilePactsQuery.data?.data || []) as any[], [profilePactsQuery.data]);
  const activePacts = useMemo(() => pacts.filter((p) => p.status === 'active'), [pacts]);
  const completedPacts = useMemo(() => pacts.filter((p) => p.status === 'completed'), [pacts]);

  const supportersQuery = useSupporters(profileUserId);
  const supporters = supportersQuery.data;
  const followersQuery = useFollowers(profileUserId);
  const followingQuery = useFollowing(profileUserId);
  const followers = (followersQuery.data?.data || []) as any[];
  const following = (followingQuery.data?.data || []) as any[];
  const followStateQuery = useFollowState(profileUserId);
  const requestFollow = useRequestFollow(profileUserId);
  const acceptFollow = useAcceptFollow(profileUserId);
  const rejectFollow = useRejectFollow(profileUserId);
  const removeFollow = useRemoveFollow(profileUserId);

  const followState = followStateQuery.data?.data;
  const outgoingStatus = followState?.outgoing_status || null;
  const outgoingFollowId = followState?.outgoing_follow_id || null;
  const incomingStatus = followState?.incoming_status || null;
  const incomingFollowId = followState?.incoming_follow_id || null;
  const isBusy = requestFollow.isPending || acceptFollow.isPending || rejectFollow.isPending || removeFollow.isPending;

  const handleFollow = async () => {
    if (typeof profileUserId !== 'number') return;
    if (incomingStatus === 'pending' && incomingFollowId) {
      await acceptFollow.mutateAsync(incomingFollowId);
      return;
    }
    if ((outgoingStatus === 'accepted' || outgoingStatus === 'pending') && outgoingFollowId) {
      await removeFollow.mutateAsync(outgoingFollowId);
      return;
    }
    await requestFollow.mutateAsync(profileUserId);
  };

  if (userByUsernameQuery.isLoading || isOwnProfile) {
    return (
      <main className="min-h-screen px-4 pt-16" style={{ background: 'var(--paper)' }}>
        <div className="flex items-center gap-4">
          <div className="pact-shimmer size-[84px] rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="pact-shimmer h-6 w-40 rounded-full" />
            <div className="pact-shimmer h-4 w-28 rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!profileUser) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-[15px]" style={{ background: 'var(--paper)', color: MUTED }}>
        We couldn&apos;t find that profile.
      </main>
    );
  }

  const name = profileUser.full_name || profileUser.username;
  const firstName = name.split(' ')[0];
  const followLabel =
    incomingStatus === 'pending' ? 'Accept' : outgoingStatus === 'accepted' ? 'Following' : outgoingStatus === 'pending' ? 'Requested' : 'Follow';
  const followStyle = followLabel === 'Following' || followLabel === 'Requested' ? profileButton.quiet : profileButton.primary;
  const listed = tab === 'active' ? activePacts : completedPacts;

  return (
    <main className="min-h-screen pb-28" style={{ background: 'var(--paper)', color: INK }}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 px-2" style={{ background: 'rgba(244,239,228,0.94)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={goBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0 flex-1 truncate text-[16px] font-bold" style={{ color: INK }}>@{profileUser.username}</div>
      </header>

      <div className="mx-auto max-w-md">
        <ProfileHeader
          name={name}
          avatarUrl={profileUser.avatar_url}
          bio={profileUser.bio}
          followers={followers.length}
          following={following.length}
          streak={userStatsQuery.data?.data?.current_streak ?? null}
          activeCount={activePacts.length}
          completedCount={userStatsQuery.data?.data?.pacts_completed ?? completedPacts.length}
          onFollowersClick={() => setPeopleSheet('followers')}
          onFollowingClick={() => setPeopleSheet('following')}
          actions={
            <>
              <button type="button" onClick={() => void handleFollow()} disabled={isBusy} className="h-11 flex-1 rounded-full text-[15px] font-extrabold disabled:opacity-60" style={followStyle}>
                {followLabel}
              </button>
              <TipButton creatorId={profileUser.id} creatorName={name} creatorAvatarUrl={profileUser.avatar_url} className="!h-11 flex-1 justify-center !shadow-none" />
              <button type="button" onClick={() => setShowAddToCircle(true)} aria-label={`Add ${firstName} to a circle`} className="flex size-11 shrink-0 items-center justify-center rounded-full" style={profileButton.quiet}>
                <UserPlus className="size-5" />
              </button>
            </>
          }
          footer={
            <>
              {incomingStatus === 'pending' && incomingFollowId && (
                <button type="button" onClick={() => rejectFollow.mutate(incomingFollowId)} disabled={isBusy} className="h-10 rounded-full text-[14px] font-bold" style={profileButton.quiet}>
                  Decline follow request
                </button>
              )}
              {supporters && supporters.count > 0 && (
                <div className="flex items-center gap-2.5 rounded-[16px] px-3 py-2.5" style={{ background: 'var(--card)', border: '1px solid var(--hairline)' }}>
                  <span className="flex shrink-0">
                    {supporters.supporters.slice(0, 3).map((person, index) => (
                      <span key={person.id} className="flex size-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-extrabold" style={{ background: INK, color: '#FFFFFF', border: '2px solid var(--card)', marginLeft: index ? -8 : 0 }}>
                        {person.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.avatar_url} alt="" className="size-full object-cover" />
                        ) : (
                          (person.full_name || person.username).charAt(0).toUpperCase()
                        )}
                      </span>
                    ))}
                  </span>
                  <span className="text-[13px] leading-snug" style={{ color: MUTED }}>
                    <span className="font-extrabold" style={{ color: INK }}>Tipped by {supporters.count} {supporters.count === 1 ? 'person' : 'people'}</span> · confirmed by {firstName}
                  </span>
                </div>
              )}
              {sharedCircles.length > 0 && (
                <div className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
                  <span className="relative flex size-[22px] items-center justify-center overflow-hidden rounded-full text-[11px]" style={{ background: 'var(--navy)', color: '#FFFFFF' }}>
                    {sharedCircles[0].photo_url ? <Image src={sharedCircles[0].photo_url} alt="" fill sizes="22px" className="object-cover" /> : sharedCircles[0].icon_emoji || sharedCircles[0].name?.charAt(0)}
                  </span>
                  <span>
                    You&apos;re both in <span className="font-bold" style={{ color: INK }}>{sharedCircles[0].name}</span>
                    {sharedCircles.length > 1 ? ` and ${sharedCircles.length - 1} more` : ''}
                  </span>
                </div>
              )}
            </>
          }
        />

        <SegmentTabs
          className="px-4 pb-3 pt-5"
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'active', label: 'Active', count: activePacts.length },
            { id: 'completed', label: 'Completed', count: completedPacts.length },
            { id: 'circles', label: 'Circles', count: profileCircles.length },
          ]}
        />

        <div className="flex flex-col gap-3.5 px-4">
          {tab === 'circles' ? (
            profileCircles.length === 0 ? (
              <EmptyNote text={`${firstName} isn't in any circles you can see yet.`} />
            ) : (
              profileCircles.map((circle: any) => (
                <button
                  key={circle.id}
                  type="button"
                  onClick={() => router.push(`/circles/${circle.id}`)}
                  className="flex items-center gap-3 rounded-[20px] p-3 text-left"
                  style={{ background: 'var(--card)', border: '1px solid var(--hairline)' }}
                >
                  <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-full text-xl" style={{ background: 'var(--card-muted)' }}>
                    {circle.photo_url ? <Image src={circle.photo_url} alt="" fill sizes="44px" className="object-cover" /> : circle.icon_emoji || circle.name?.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold" style={{ color: INK }}>{circle.name}</span>
                    <span className="block text-[13px]" style={{ color: MUTED }}>
                      {circle.member_count ?? 0} members{sharedCircleIds.includes(Number(circle.id)) ? ' · you’re in it' : ''}
                    </span>
                  </span>
                </button>
              ))
            )
          ) : profilePactsQuery.isLoading ? (
            <div className="pact-shimmer h-[360px] rounded-[24px]" aria-hidden="true" />
          ) : listed.length === 0 ? (
            <EmptyNote text={tab === 'active' ? `${firstName} has no active pacts you can see.` : 'No completed pacts yet.'} />
          ) : (
            listed.map((pact: any) => <FeedPactCard key={pact.id} pact={pact} />)
          )}
        </div>
      </div>

      <PeopleSheet open={peopleSheet === 'followers'} title="Followers" people={followers} emptyText={`No one follows ${firstName} yet.`} onClose={() => setPeopleSheet(null)} />
      <PeopleSheet open={peopleSheet === 'following'} title="Following" people={following} emptyText={`${firstName} isn't following anyone yet.`} onClose={() => setPeopleSheet(null)} />
      <AddToCircleSheet isOpen={showAddToCircle} onClose={() => setShowAddToCircle(false)} targetUserId={profileUser.id} targetName={name} />
    </main>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] px-5 py-8 text-center text-[14px]" style={{ border: '1.5px dashed var(--hairline)', color: MUTED }}>
      {text}
    </div>
  );
}
