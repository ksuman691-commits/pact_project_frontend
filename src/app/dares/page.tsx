'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Zap } from 'lucide-react';
import DareCard from '@/components/DareCard';
import SparkRing from '@/components/dares/SparkRing';
import CreateDareModal from '@/components/CreateDareModal';
import RefreshButton from '@/components/RefreshButton';
import { useDareFeed, useMyDares } from '@/hooks/useDareQueries';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { dareRole, dareState, isActive, nextStep } from '@/lib/dareView';
import type { Dare } from '@/types';

type Tab = 'for-you' | 'sent' | 'discover' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'sent', label: 'Sent' },
  { id: 'discover', label: 'Discover' },
  { id: 'history', label: 'History' },
];

const EMPTY: Record<Tab, { title: string; body: string; cta?: 'create' | 'discover' }> = {
  'for-you': { title: 'No dares waiting on you', body: 'When someone dares you, it shows up here with a clock.', cta: 'discover' },
  sent: { title: 'Your next challenge starts with you', body: 'Dare one person to do one thing, soon.', cta: 'create' },
  discover: { title: 'Nothing shared yet', body: 'Finished dares people choose to show off appear here.', cta: 'create' },
  history: { title: 'Your past dares will appear here', body: 'Completed, declined and expired dares move here.' },
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
    for (const dare of all) {
      const role = dareRole(dare, user?.id);
      const mineToAct = nextStep(dare, role) !== null;
      if (isActive(dare)) {
        ;(role === 'creator' ? sent : forYou).push(dare);
        if (mineToAct) yourMove += 1;
        else inPlay += 1;
      } else {
        history.push(dare);
      }
      if (role === 'doer' && dareState(dare) === 'completed') doneByYou += 1;
    }
    // Things you need to act on come first; then whatever runs out soonest.
    const byUrgency = (a: Dare, b: Dare) => {
      const actA = nextStep(a, dareRole(a, user?.id)) ? 0 : 1;
      const actB = nextStep(b, dareRole(b, user?.id)) ? 0 : 1;
      if (actA !== actB) return actA - actB;
      return new Date(a.respond_by).getTime() - new Date(b.respond_by).getTime();
    };
    forYou.sort(byUrgency);
    sent.sort(byUrgency);
    return { forYou, sent, history, yourMove, inPlay, doneByYou };
  }, [all, user?.id]);

  const youOweForYou = lists.forYou.filter((d) => nextStep(d, 'doer')).length;
  const youOweSent = lists.sent.filter((d) => nextStep(d, 'creator')).length;
  const counts: Record<Tab, number | null> = {
    'for-you': mine.isSuccess ? youOweForYou : null,
    sent: mine.isSuccess ? youOweSent : null,
    discover: null,
    history: null,
  };

  const shown = tab === 'for-you' ? lists.forYou : tab === 'sent' ? lists.sent : tab === 'history' ? lists.history : discover;
  const query = tab === 'discover' ? feed : mine;
  const loading = tab === 'discover' ? feed.isLoading : mine.isLoading || !isInitialized;
  const stats: { label: string; value: number; tab: Tab }[] = [
    { label: 'Your move', value: lists.yourMove, tab: lists.forYou.some((d) => nextStep(d, 'doer')) || !lists.sent.some((d) => nextStep(d, 'creator')) ? 'for-you' : 'sent' },
    { label: 'In play', value: lists.inPlay, tab: lists.sent.some((d) => !nextStep(d, 'creator')) ? 'sent' : 'for-you' },
    { label: 'Done by you', value: lists.doneByYou, tab: 'history' },
  ];

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-3 px-6 pb-3 pt-9">
          <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.045em]">Dares</h1>
          <RefreshButton label="Refresh dares" onRefresh={() => Promise.all([mine.refetch(), feed.refetch()])} />
        </header>

        <section
          className="relative mx-[10px] mb-4 overflow-hidden rounded-[22px] px-5 pb-5 pt-5 text-white sm:mx-6"
          style={{ background: 'radial-gradient(120% 100% at 80% 10%, #2F4486 0%, #141A2E 55%, #0C0D11 100%)' }}
          aria-label="Your dares at a glance"
        >
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              {mine.isSuccess && lists.yourMove > 0 ? (
                <>
                  <p className="text-[64px] font-extrabold leading-[0.9] tracking-[-0.06em]">{lists.yourMove}</p>
                  <p className="mt-1.5 text-[22px] font-extrabold leading-[1.1] tracking-[-0.025em]">{lists.yourMove === 1 ? 'dare needs you' : 'dares need you'}</p>
                </>
              ) : (
                <>
                  <p className="text-[32px] font-extrabold leading-[1.02] tracking-[-0.035em]">Dare someone.</p>
                  <p className="mt-2 text-[14.5px] leading-[1.4]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    One person, one challenge, a short clock.
                  </p>
                </>
              )}
            </div>
            <SparkRing size={112} tone="dark" duration="30s" left={lists.yourMove > 0 ? null : 1}>
              <Zap className="size-9" strokeWidth={2.2} fill="#FFD84D" color="#FFD84D" aria-hidden="true" />
            </SparkRing>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[16px] font-extrabold text-[var(--navy)] transition active:scale-[0.98]"
            >
              <Zap className="size-4" strokeWidth={2.6} fill="currentColor" aria-hidden="true" />
              New dare
            </button>
            {mine.isSuccess && (lists.inPlay > 0 || lists.doneByYou > 0) && (
              <p className="flex shrink-0 flex-col text-right text-[12.5px] font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {stats.slice(1).map((stat) => (
                  <button key={stat.label} type="button" onClick={() => setTab(stat.tab)} className="min-h-6 text-right underline-offset-4 hover:underline">
                    {stat.value} {stat.label.toLowerCase()}
                  </button>
                ))}
              </p>
            )}
          </div>
        </section>

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
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition ${
                  selected ? 'bg-[var(--ink)] text-[var(--card)]' : 'border border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                {item.label}
                {count != null && count > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${selected ? 'bg-white text-[var(--ink)]' : 'bg-[var(--navy)] text-white'}`}
                    aria-label={`${count} need you`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <section className="space-y-4 px-[10px] sm:px-6" aria-live="polite">
          {loading ? (
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
              <button type="button" onClick={() => query.refetch()} className="mt-4 inline-flex h-11 items-center rounded-full bg-[var(--navy)] px-6 text-[14px] font-extrabold text-white">
                Try again
              </button>
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-6 py-8 text-center">
              <span className="mx-auto flex justify-center">
                <SparkRing size={96} tone="light" duration="30s">
                  <Zap className="size-7 text-[var(--navy)]" strokeWidth={2.2} fill="currentColor" aria-hidden="true" />
                </SparkRing>
              </span>
              <h2 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em]">{EMPTY[tab].title}</h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--muted)]">{EMPTY[tab].body}</p>
              {EMPTY[tab].cta === 'create' && (
                <button type="button" onClick={() => setCreateOpen(true)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--navy)] px-6 text-[14px] font-extrabold text-white">
                  <Plus className="size-4" aria-hidden="true" />
                  Create a dare
                </button>
              )}
              {EMPTY[tab].cta === 'discover' && (
                <button type="button" onClick={() => setTab('discover')} className="mt-5 inline-flex h-11 items-center rounded-full border-[1.5px] border-[var(--navy)] px-6 text-[14px] font-extrabold text-[var(--navy)]">
                  Browse Discover
                </button>
              )}
            </div>
          ) : (
            shown.map((dare, index) => (
              <div key={dare.id} className="pact-list-item" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                <DareCard dare={dare} />
              </div>
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
