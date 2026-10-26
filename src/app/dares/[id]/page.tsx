'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import DetailPageHeader from '@/components/DetailPageHeader';
import DareCard from '@/components/DareCard';
import Avatar from '@/components/Avatar';
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory';
import { useDareDetail } from '@/hooks/useDareQueries';
import { useShareDare } from '@/hooks/useDareMutations';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { parseApiDate } from '@/lib/dareCountdown';
import { creatorFace, dareRole, dareState, firstName, recipientFace, type DareFace } from '@/lib/dareView';

function when(raw?: string | null): string {
  const at = parseApiDate(raw);
  return at ? at.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '–';
}

export default function DareDetailPage() {
  const params = useParams();
  const dareId = parseInt(params.id as string);
  const { user, isInitialized } = useRequireAuth();
  useSeedBackHistory('/dares');

  // Gate on auth: this page can mount before the session is restored.
  const dareQuery = useDareDetail(dareId, { enabled: isInitialized });
  const share = useShareDare();
  const dare = dareQuery.data?.data;

  if (!isInitialized || dareQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <DetailPageHeader title="Loading dare…" fallbackHref="/dares" />
        <div className="mx-auto max-w-2xl px-[10px] py-4 sm:px-6">
          <div className="pact-shimmer aspect-[4/5] rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (!dare) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <DetailPageHeader title="Dare" backHref="/dares" />
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6 text-center">
          <div>
            <p className="text-[18px] font-extrabold text-[var(--ink)]">This dare isn&apos;t available</p>
            <p className="mt-2 text-[14px] text-[var(--muted)]">It may be private to the two people in it, or it was removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const role = dareRole(dare, user?.id);
  const state = dareState(dare);
  const creator = creatorFace(dare);
  const recipient = recipientFace(dare);
  const involved = role !== 'viewer';
  const canShare = role === 'doer' && state === 'completed';
  const canUnshare = involved && Boolean(dare.shared_publicly);

  const facts: { label: string; value: string }[] = [
    { label: 'Sent', value: when(dare.created_at) },
    state === 'awaiting_response' ? { label: 'Answer by', value: when(dare.respond_by) } : null,
    state === 'in_progress' ? { label: 'Proof due', value: when(dare.complete_by) } : null,
    dare.proof_submitted_at ? { label: 'Proof posted', value: when(dare.proof_submitted_at) } : null,
    dare.completed_at ? { label: 'Marked done', value: when(dare.completed_at) } : null,
    { label: 'Proof', value: dare.verification_method === 'video' ? 'Video' : dare.verification_method === 'photo' ? 'Photo' : 'Any' },
    involved && dare.reward_amount
      ? {
          label: 'Reward',
          value: `₹${dare.reward_amount}${
            dare.reward?.status === 'received' ? ', paid' : dare.reward?.status === 'sent' ? ', sent, waiting to be confirmed' : state === 'completed' ? ', to be paid' : ', paid after it is marked done'
          }`,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-[var(--paper)] pb-[120px] text-[var(--ink)]">
      <DetailPageHeader title="Dare" fallbackHref="/dares" />
      <div className="mx-auto max-w-2xl space-y-4 px-[10px] py-3 sm:px-6">
        <DareCard dare={dare} variant="detail" />

        <section className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-4 py-2" aria-label="Who's in this dare">
          <Person label="Dared by" face={creator} you={role === 'creator'} />
          {recipient && <Person label="Dared" face={recipient} you={role === 'doer'} />}
        </section>

        <section className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-4" aria-label="Dare details">
          <dl className="divide-y divide-[var(--line)]">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-baseline justify-between gap-4 py-3 text-[14px]">
                <dt className="text-[var(--muted)]">{fact.label}</dt>
                <dd className="text-right font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {(canShare || canUnshare) && (
          <section className="flex items-center gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--card)] px-4 py-3" aria-label="Discover">
            <Globe className="size-5 shrink-0 text-[var(--navy)]" strokeWidth={2} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold">{dare.shared_publicly ? 'Showing in Discover' : 'Show in Discover'}</p>
              <p className="text-[13px] leading-[1.4] text-[var(--muted)]">
                {dare.shared_publicly
                  ? 'Anyone on CirclePact can see the proof. The reward is never shown.'
                  : `Let people see you did it. ${firstName(creator.name)}'s name shows as the one who dared you; the reward stays private.`}
              </p>
            </div>
            {dare.shared_publicly ? (
              <button
                type="button"
                disabled={share.isPending}
                onClick={() => share.mutate({ dareId: dare.id, shared: false })}
                className="h-11 shrink-0 rounded-full border-[1.5px] border-[var(--line)] px-4 text-[14px] font-extrabold disabled:opacity-50"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                disabled={share.isPending}
                onClick={() => share.mutate({ dareId: dare.id, shared: true })}
                className="h-11 shrink-0 rounded-full bg-[var(--navy)] px-4 text-[14px] font-extrabold text-white disabled:opacity-50"
              >
                Share
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Person({ label, face, you }: { label: string; face: DareFace; you: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar name={face.name} avatarUrl={face.avatarUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[var(--muted)]">{label}</p>
        <p className="truncate text-[15px] font-bold">{you ? 'You' : face.name}</p>
      </div>
    </div>
  );
}
