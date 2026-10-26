'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

export default function ReviewStep() {
  const { draft, isSubmitting, submit } = useCreateDareFlow();
  const who = draft.recipients[0];
  const whoName = who?.full_name || (who ? `@${who.username}` : 'Someone');

  const rows: { label: string; value: string }[] = [
    { label: 'Time to accept', value: `${draft.respondByHours} ${draft.respondByHours === 1 ? 'hour' : 'hours'}` },
    { label: 'Time to do it', value: `${draft.completeByHours} hours from accepting` },
    { label: 'Proof', value: draft.verificationMethod === 'video' ? 'A short video' : 'A photo' },
    { label: 'Reward', value: draft.rewardAmount ? `₹${draft.rewardAmount}, you pay after you mark it done` : 'None' },
  ];

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Ready to send?</h1>

      {/* A small preview in the card's own look, so the sender sees what lands. */}
      <div className="mt-6 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--card)]">
        <div className="relative px-4 pb-4 pt-3 text-white" style={{ background: 'radial-gradient(120% 90% at 30% 20%, #2A3A6E 0%, #141A2E 55%, #0F1014 100%)' }}>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-[30px] overflow-hidden rounded-full ring-2 ring-white/70">
              <Avatar name={whoName} avatarUrl={who?.avatar_url} size={30} />
            </span>
            <span className="truncate text-[14px] font-bold">To {whoName}</span>
          </div>
          <span className="mt-6 inline-flex items-center gap-1 rounded-[9px] bg-white px-2.5 py-[3px] text-[11.5px] font-extrabold text-[var(--navy)]">
            <Zap className="size-3" strokeWidth={2.6} aria-hidden="true" />
            Dare
          </span>
          <p className="mt-1.5 line-clamp-2 text-[20px] font-extrabold leading-[1.15] tracking-[-0.02em]">{draft.title}</p>
        </div>
        {draft.description && <p className="px-4 pt-3 text-[14px] leading-[1.45] text-[var(--ink)]">{draft.description}</p>}
        <dl className="mt-1 divide-y divide-[var(--line)] px-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-[var(--muted)]">{row.label}</dt>
              <dd className="text-right font-semibold text-[var(--ink)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting || !who}
          className="w-full rounded-full bg-[var(--navy)] py-3 font-bold text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : `Send dare to ${whoName.split(' ')[0]}`}
        </button>
      </div>
    </div>
  );
}
