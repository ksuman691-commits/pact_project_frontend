'use client';

import CircleMark from '@/components/brand/CircleMark'
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Check, Hourglass, Zap } from 'lucide-react';
import PageHero from '@/components/PageHero';
import HeroStats, { HeroSteps, TinyFace, type HeroStat } from '@/components/HeroStats';
import DareCard from '@/components/DareCard';
import CreateDareModal from '@/components/CreateDareModal';
import PausedNote from '@/components/app/PausedNote';
import { usePaused } from '@/lib/appStatus';
import { useDareFeed, useMyDares } from '@/hooks/useDareQueries';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { activeDeadline, creatorFace, dareRole, dareState, firstName, isActive, nextStep, recipientFace, timeLeft, type DareFace } from '@/lib/dareView';
import type { Dare } from '@/types';

type Tab = 'for-you' | 'sent' | 'discover' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'for-you', label: 'For you' },
  { id: 'sent', label: 'Sent' },
  { id: 'discover', label: 'Discover' },
  { id: 'history', label: 'Done by you' },
];

const EMPTY: Record<Tab, { title: string; body: string; cta?: 'create' | 'discover' }> = {
  'for-you': { title: 'No dares waiting on you', body: 'When someone dares you, it shows up here with a clock.', cta: 'discover' },
  sent: { title: 'Nothing in play right now', body: 'Dares you sent that finished or ran out of time are in Done by you. Dare one person to do one thing, soon.', cta: 'create' },
  discover: { title: 'Nothing shared yet', body: 'Finished dares people choose to show off appear here.', cta: 'create' },
  history: { title: 'Nothing done yet', body: 'Dares you finish, and dares you mark done for friends, land here.' },
};

// useSearchParams needs a Suspense boundary or `next build` fails prerendering.
export default function DaresPage() {
  return (
    <Suspense fallback={null}>
      <DaresPageInner />
    </Suspense>
  );
}

function DaresPageInner() {
  const searchParams = useSearchParams();
  const { user, isInitialized } = useRequireAuth();
  const [tab, setTab] = useState<Tab>('for-you');
  const [createOpen, setCreateOpen] = useState(false);

  // Deep links: ?tab=for-you|sent|discover|history, plus the older
  // ?tab=expired and ?status=accepted|completed links still land somewhere sensible.
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');
  const createdParam = searchParams.get('created');
  useEffect(() => {
    if (tabParam === 'for-you' || tabParam === 'sent' || tabParam === 'discover' || tabParam === 'history') setTab(tabParam);
    else if (tabParam === 'expired' || statusParam === 'completed') setTab('history');
    else if (statusParam === 'accepted') setTab('for-you');
  }, [tabParam, statusParam, createdParam]);

  // Gate on auth: on a hard reload this page mounts before the session is restored.
  const mine = useMyDares({ enabled: isInitialized && !!user });
  const feed = useDareFeed();
  const all: Dare[] = useMemo(() => mine.data?.pages?.flatMap((page: any) => page.data) || [], [mine.data]);
  const discover: Dare[] = useMemo(() => feed.data?.pages?.flatMap((page: any) => page.data) || [], [feed.data]);

  const lists = useMemo(() => {
    const forYou: Dare[] = [];
    const sent: Dare[] = [];
    const history: Dare[] = [];
    let yourMove = 0;
    let inPlay = 0;
    let doneByYou = 0;
    let won = 0;
    let paid = 0;
    let soonest: number | null = null;
    const waitingOn: DareFace[] = [];
    for (const dare of all) {
      const role = dareRole(dare, user?.id);
      const mineToAct = nextStep(dare, role) !== null;
      if (isActive(dare)) {
        ;(role === 'creator' ? sent : forYou).push(dare);
        if (mineToAct) {
          yourMove += 1;
          const dl = activeDeadline(dare);
          const at = dl ? new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(dl.target) ? dl.target : `${dl.target}Z`).getTime() : NaN;
          if (!Number.isNaN(at) && (soonest == null || at < soonest)) soonest = at;
        } else {
          inPlay += 1;
          const face = role === 'creator' ? recipientFace(dare) : creatorFace(dare);
          if (face && !waitingOn.some((f) => f.name === face.name)) waitingOn.push(face);
        }
      } else {
        history.push(dare);
      }
      // Counts dares you did and dares you sent and marked done: both are
      // "done" from where you sit, and both live in the Done by you list.
      if (role !== 'viewer' && dareState(dare) === 'completed') {
        doneByYou += 1;
        if (dare.reward_amount) {
          if (role === 'doer') won += Number(dare.reward_amount);
          else paid += Number(dare.reward_amount);
        }
      }
    }
    // Done first (newest on top), then the ones that didn't happen.
    const finishedAt = (d: Dare) => new Date(d.completed_at || d.created_at).getTime();
    history.sort((a, b) => {
      const doneA = dareState(a) === 'completed' ? 0 : 1;
      const doneB = dareState(b) === 'completed' ? 0 : 1;
      return doneA !== doneB ? doneA - doneB : finishedAt(b) - finishedAt(a);
    });
    // Things you need to act on come first; then whatever runs out soonest.
    const byUrgency = (a: Dare, b: Dare) => {
      const actA = nextStep(a, dareRole(a, user?.id)) ? 0 : 1;
      const actB = nextStep(b, dareRole(b, user?.id)) ? 0 : 1;
      if (actA !== actB) return actA - actB;
      return new Date(a.respond_by).getTime() - new Date(b.respond_by).getTime();
    };
    forYou.sort(byUrgency);
    sent.sort(byUrgency);
    return { forYou, sent, history, yourMove, inPlay, doneByYou, won, paid, soonest: soonest as number | null, waitingOn };
  }, [all, user?.id]);

  const youOweForYou = lists.forYou.filter((d) => nextStep(d, 'doer')).length;
  const youOweSent = lists.sent.filter((d) => nextStep(d, 'creator')).length;
  const counts: Record<Tab, number | null> = {
    'for-you': mine.isSuccess ? youOweForYou : null,
    sent: mine.isSuccess ? youOweSent : null,
    discover: null,
    history: null,
  };
  const firstNotDone = tab === 'history' ? lists.history.findIndex((d) => dareState(d) !== 'completed') : -1;

  const daresPaused = usePaused('dares');
  const discoverPaused = usePaused('discover');
  const shown = tab === 'for-you' ? lists.forYou : tab === 'sent' ? lists.sent : tab === 'history' ? lists.history : discover;
  const query = tab === 'discover' ? feed : mine;
  const loading = tab === 'discover' ? feed.isLoading : mine.isLoading || !isInitialized;
  const moveTab: Tab = lists.forYou.some((d) => nextStep(d, 'doer')) || !lists.sent.some((d) => nextStep(d, 'creator')) ? 'for-you' : 'sent';
  const playTab: Tab = lists.sent.some((d) => !nextStep(d, 'creator')) ? 'sent' : 'for-you';
  const nextLeft = lists.soonest != null ? timeLeft(new Date(lists.soonest).toISOString()) : null;
  const faces = lists.waitingOn;
  const nothingYet = mine.isSuccess && all.length === 0;

  // Each number says what it means for you right now, not just a count.
  const heroStats: HeroStat[] = [
    {
      key: 'move',
      label: 'Your move',
      value: mine.isSuccess ? lists.yourMove : null,
      sub: lists.yourMove > 0 ? (nextLeft ? `Next ends in ${nextLeft}` : 'Waiting on you') : 'All clear',
      icon: <Zap className="size-4 text-[var(--ink)]" strokeWidth={0} fill="currentColor" aria-hidden="true" />,
      iconBg: 'var(--dare)',
      visual: lists.yourMove > 0 ? <span className="cp-pulse-dot mr-1 size-2.5 rounded-full bg-[#E5363B]" aria-hidden="true" /> : undefined,
      hint: 'Dares waiting on you to answer, post proof or review',
      selected: tab === moveTab && lists.yourMove > 0,
      onSelect: () => setTab(moveTab),
    },
    {
      key: 'play',
      label: 'In play',
      value: mine.isSuccess ? lists.inPlay : null,
      sub: faces.length ? `With ${firstName(faces[0].name)}${faces.length > 1 ? ` +${faces.length - 1}` : ''}` : 'Nothing running',
      icon: <Hourglass className="size-4 text-white" strokeWidth={2.4} aria-hidden="true" />,
      iconBg: 'rgba(255,255,255,0.16)',
      visual: faces.length ? (
        <span className="flex -space-x-1.5">
          {faces.slice(0, 2).map((f) => (
            <TinyFace key={f.name} name={f.name} avatarUrl={f.avatarUrl} ring="var(--ink)" />
          ))}
        </span>
      ) : undefined,
      hint: 'Running dares waiting on someone else',
      onSelect: () => setTab(playTab),
    },
    {
      key: 'done',
      label: 'Done by you',
      value: mine.isSuccess ? lists.doneByYou : null,
      sub: lists.won > 0 ? `₹${lists.won} won` : lists.paid > 0 ? `₹${lists.paid} paid out` : lists.doneByYou > 0 ? 'Proof or it didn\u2019t happen' : 'None yet',
      icon: <Check className="size-4 text-white" strokeWidth={3} aria-hidden="true" />,
      iconBg: 'linear-gradient(160deg, #4ADE80, #16A34A)',
      hint: 'Dares you did, and dares you sent and marked done',
      selected: tab === 'history',
      onSelect: () => setTab('history'),
    },
  ];

  const heroLine = !mine.isSuccess
    ? 'Loading your dares…'
    : nothingYet
      ? 'Dare one friend to do one thing. They post proof before the clock runs out.'
      : lists.yourMove > 0
        ? <><b>{lists.yourMove} {lists.yourMove === 1 ? 'dare needs' : 'dares need'} you.</b> The clock is running.</>
        : lists.inPlay > 0
          ? <><b>{lists.inPlay} in play.</b> We&apos;ll tell you the moment they move.</>
          : lists.doneByYou > 0
            ? <><b>{lists.doneByYou} done.</b> Who&apos;s next?</>
            : 'Dare one person to do one thing, soon.';

  const sendAction = daresPaused ? undefined : { label: nothingYet ? 'Send your first dare' : 'Send a dare', onClick: () => setCreateOpen(true), icon: <Zap className="size-4" strokeWidth={0} fill="currentColor" aria-hidden="true" /> };

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <PageHero tone="dare" title="Dares" tagline="Proof or it didn't happen" line={heroLine} busy={mine.isFetching}>
          {nothingYet ? (
            <>
              <HeroSteps
                tone="dare"
                steps={[
                  { icon: <Zap className="size-4" strokeWidth={0} fill="currentColor" />, title: 'Dare a friend', body: 'One thing, a clock on it' },
                  { icon: <Camera className="size-4" strokeWidth={2.4} />, title: 'They post proof', body: 'Photo or video, in time' },
                  { icon: <Check className="size-4" strokeWidth={3} />, title: 'Mark it done', body: 'Add a reward from ₹9' },
                ]}
              />
              <HeroStats tone="dare" label="Start" stats={[]} action={sendAction} />
            </>
          ) : (
            <HeroStats tone="dare" label="Your dares at a glance" stats={heroStats} ready={mine.isSuccess} action={sendAction} />
          )}
          {daresPaused && <PausedNote text={daresPaused} className="mt-3" />}
        </PageHero>

        <div className="h-4" />

        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Dare lists">
          {TABS.map((item) => {
            const selected = tab === item.id;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={selected}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition ${
                  selected ? 'bg-[var(--dare)] text-[var(--ink)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                {item.label}
                {count != null && count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ink)] px-1.5 text-[11px] font-bold text-[var(--dare)]" aria-label={`${count} need you`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <section className="space-y-4 px-[10px] sm:px-6" aria-live="polite">
          {tab === 'discover' && discoverPaused ? (
            <PausedNote text={discoverPaused} />
          ) : loading ? (
            [0, 1].map((i) => (
              <div key={i} className="pact-card overflow-hidden rounded-[22px]">
                <div className="pact-shimmer aspect-[16/10]" />
                <div className="flex items-center gap-3 p-3.5">
                  <div className="pact-shimmer h-4 flex-1 rounded-full" />
                  <div className="pact-shimmer h-11 w-28 rounded-full" />
                </div>
              </div>
            ))
          ) : query.isError && shown.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-6 py-8 text-center">
              <p className="text-[16px] font-extrabold">Dares didn&apos;t load</p>
              <p className="mt-1 text-[14px] text-[var(--muted)]">Check your connection and try again.</p>
              <button type="button" onClick={() => query.refetch()} className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--ink)] px-6 text-[14px] font-extrabold text-[var(--dare)]">
                Try again
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-6 py-8 text-center">
              <span className="mx-auto flex justify-center">
                <CircleMark key={tab} size={72} animation="draw" />
              </span>
              <h2 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em]">{EMPTY[tab].title}</h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--muted)]">{EMPTY[tab].body}</p>
              {EMPTY[tab].cta === 'create' && !daresPaused && (
                <button type="button" onClick={() => setCreateOpen(true)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--ink)] px-6 text-[14px] font-extrabold text-[var(--dare)]">
                  <Zap className="size-4" strokeWidth={0} fill="currentColor" aria-hidden="true" />
                  Send a dare
                </button>
              )}
              {EMPTY[tab].cta === 'discover' && (
                <button type="button" onClick={() => setTab('discover')} className="mt-5 inline-flex h-11 items-center rounded-full border-[1.5px] border-[var(--ink)] px-6 text-[14px] font-extrabold text-[var(--ink)]">
                  Browse Discover
                </button>
              )}
            </div>
          ) : (
            shown.map((dare, index) => (
              <React.Fragment key={dare.id}>
                {index === firstNotDone && (
                  <h2 className="px-1 pt-2 text-[15px] font-bold text-[var(--muted)]">Didn&apos;t happen</h2>
                )}
                <div className="pact-list-item" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                  <DareCard dare={dare} />
                </div>
              </React.Fragment>
            ))
          )}

          {!loading && query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="h-11 rounded-full border-[1.5px] border-[var(--line)] px-6 text-[14px] font-semibold text-[var(--ink)] disabled:opacity-50"
              >
                {query.isFetchingNextPage ? 'Loading…' : tab === 'discover' ? 'Load more' : 'Load older dares'}
              </button>
            </div>
          )}
        </section>
      </div>

      <CreateDareModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
