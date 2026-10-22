'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUserJoinedPacts, useUserPacts } from '@/hooks/useFeedQueries';
import { useMyDares } from '@/hooks/useDareQueries';
import { useCircles } from '@/hooks/useCircles';
import { useMyMomentsToday } from '@/hooks/useMyMomentsToday';
import { useFollowers, useFollowing } from '@/hooks/useFollows';
import { useSmartBack } from '@/hooks/useSmartBack';
import StoryViewer from '@/components/stories/StoryViewer';
import { DaresTab } from '@/components/ProfileTabs';
import CpScoreCard from '@/components/profile/CpScoreCard';
import ProfilePactCard, { ProfileEmpty } from '@/components/profile/ProfilePactCard';
import ProfileHeader, { profileButton } from '@/components/profile/ProfileHeader';
import SegmentTabs from '@/components/profile/SegmentTabs';
import PeopleSheet from '@/components/profile/PeopleSheet';
import TipsEntryCard from '@/components/tips/TipsEntryCard';
import RequestsEntryCard from '@/components/requests/RequestsEntryCard';

const INK = '#17181D';
const MUTED = '#5A5C63';

type Tab = 'active' | 'completed' | 'circles' | 'dares';

// useSearchParams() must sit under its own Suspense boundary or `next build`
// fails to prerender this page. It is only used for the ?tab=dares deep link.
export default function Profile() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isInitialized } = useRequireAuth();
  const smartBack = useSmartBack('/feed');
  const logout = useAuthStore((state) => state.logout);
  const [tab, setTab] = useState<Tab>('active');
  const [peopleSheet, setPeopleSheet] = useState<'followers' | 'following' | null>(null);
  const [viewingMoment, setViewingMoment] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'dares') setTab('dares');
  }, [searchParams]);

  const userId = user?.id;
  const { data: createdPactsData } = useUserPacts(userId || 0);
  const { data: joinedPactsData } = useUserJoinedPacts(userId || 0);
  const myDaresQuery = useMyDares({ enabled: isInitialized && !!user });
  const createdPacts = useMemo(() => (createdPactsData?.pages || []).flatMap((page: any) => page.data || []) as any[], [createdPactsData]);
  const joinedPacts = useMemo(() => (joinedPactsData?.pages || []).flatMap((page: any) => page.data || []) as any[], [joinedPactsData]);
  const myDares = (myDaresQuery.data?.pages || []).flatMap((page: any) => page.data || []) as any[];
  const followers = (useFollowers(userId || 0).data?.data || []) as any[];
  const following = (useFollowing(userId || 0).data?.data || []) as any[];
  const myCircles = (useCircles().data || []) as any[];
  const { myStories, postedToday } = useMyMomentsToday(myCircles, user?.id);

  // Pacts you started and pacts you joined, once each, newest first.
  const allPacts = useMemo(() => {
    const byId = new Map<number, any>();
    [...createdPacts, ...joinedPacts].forEach((p: any) => p?.id != null && !byId.has(Number(p.id)) && byId.set(Number(p.id), p));
    return [...byId.values()].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }, [createdPacts, joinedPacts]);
  const activePacts = allPacts.filter((p: any) => p.status === 'active');
  const finishedPacts = allPacts.filter((p: any) => p.status !== 'active');

  if (!isInitialized) {
    return <main className="min-h-screen" style={{ background: 'var(--paper)' }} />;
  }
  if (!user) return null;

  const name = user.full_name || user.username || 'You';

  const shareProfile = async () => {
    const url = `${window.location.origin}/profile/${encodeURIComponent(user.username)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} on CirclePact`, url });
        return;
      }
    } catch {
      // Dismissed or unavailable; fall back to copying.
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <main className="min-h-screen pb-36" style={{ background: 'var(--paper)', color: INK }}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 px-2" style={{ background: 'rgba(244,239,228,0.94)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={smartBack} aria-label="Go back" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0 flex-1 truncate text-[16px] font-bold" style={{ color: INK }}>@{user.username}</div>
        <button type="button" onClick={() => router.push('/profile/edit')} aria-label="Settings" className="flex size-11 items-center justify-center rounded-full" style={{ color: INK }}>
          <Settings className="size-5" />
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push('/auth/login');
          }}
          aria-label="Log out"
          className="flex size-11 items-center justify-center rounded-full"
          style={{ color: MUTED }}
        >
          <LogOut className="size-5" />
        </button>
      </header>

      <div className="mx-auto max-w-md">
        <ProfileHeader
          isOwn
          name={name}
          avatarUrl={user.avatar_url}
          bio={user.bio}
          followers={followers.length}
          following={following.length}
          score={<div className="-mx-4"><CpScoreCard userId={user.id} username={user.username} isOwn /></div>}
          hasMoment={postedToday}
          onViewMoment={() => setViewingMoment(true)}
          onFollowersClick={() => setPeopleSheet('followers')}
          onFollowingClick={() => setPeopleSheet('following')}
          actions={
            <>
              <button type="button" onClick={() => void shareProfile()} className="h-11 flex-1 rounded-full text-[15px] font-extrabold transition active:scale-[0.98]" style={profileButton.primary}>
                Share Profile
              </button>
              <button type="button" onClick={() => router.push('/profile/edit')} className="h-11 flex-1 rounded-full text-[15px] font-extrabold transition active:scale-[0.98]" style={profileButton.ghost}>
                Edit Profile
              </button>
            </>
          }
          footer={<div className="flex flex-col gap-2"><RequestsEntryCard /><TipsEntryCard /></div>}
        />

        <SegmentTabs
          className="px-4 pb-3 pt-5"
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: 'active', label: 'Active', count: activePacts.length },
            { id: 'completed', label: 'Completed', count: finishedPacts.length },
            { id: 'circles', label: 'Circles', count: myCircles.length },
            ...(myDares.length > 0 ? [{ id: 'dares', label: 'Dares', count: myDares.length }] : []),
          ]}
        />

        <div className="px-4">
          {(tab === 'active' || tab === 'completed') && (
            <div className="flex flex-col gap-3.5">
              {(tab === 'active' ? activePacts : finishedPacts).length === 0 ? (
                tab === 'active' ? (
                  <ProfileEmpty
                    title="Nothing live right now"
                    text="Start a pact and shoot Day 1. It shows up here."
                    action={
                      <button type="button" onClick={() => router.push('/pacts/create')} className="h-11 rounded-full px-5 text-[14.5px] font-extrabold" style={profileButton.primary}>
                        Start a pact
                      </button>
                    }
                  />
                ) : (
                  <ProfileEmpty title="Nothing finished yet" text="Pacts you finish stay here." />
                )
              ) : (
                (tab === 'active' ? activePacts : finishedPacts).map((pact: any) => <ProfilePactCard key={pact.id} pact={pact} />)
              )}
            </div>
          )}
          {tab === 'dares' && <DaresTab dares={myDares} />}
          {tab === 'circles' &&
            (myCircles.length === 0 ? (
              <ProfileEmpty
                title="Not in any circles yet"
                text="Join one to start keeping each other honest."
                action={
                  <button type="button" onClick={() => router.push('/circles')} className="h-11 rounded-full px-5 text-[14.5px] font-extrabold" style={profileButton.primary}>
                    Browse circles
                  </button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {myCircles.map((circle: any) => (
                  <button
                    key={circle.id}
                    type="button"
                    onClick={() => router.push(`/circles/${circle.id}`)}
                    className="flex items-center gap-3 rounded-[22px] p-3.5 text-left"
                    style={{ background: '#FBF8F1', border: '1px solid #DCD3C1' }}
                  >
                    <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-full text-xl" style={{ background: 'var(--card-muted)' }}>
                      {circle.photo_url ? <Image src={circle.photo_url} alt="" fill sizes="44px" className="object-cover" /> : circle.icon_emoji || circle.name?.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold" style={{ color: INK }}>{circle.name}</span>
                      <span className="block text-[13px]" style={{ color: MUTED }}>{circle.member_count ?? 0} members</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
        </div>
      </div>

      <StoryViewer open={viewingMoment} onClose={() => setViewingMoment(false)} stories={myStories} />
      <PeopleSheet open={peopleSheet === 'followers'} title="Followers" people={followers} emptyText="No followers yet." onClose={() => setPeopleSheet(null)} />
      <PeopleSheet open={peopleSheet === 'following'} title="Following" people={following} emptyText="You're not following anyone yet." onClose={() => setPeopleSheet(null)} />
    </main>
  );
}
