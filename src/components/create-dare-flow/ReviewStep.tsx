'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

export default function ReviewStep() {
  const { draft, isSubmitting, submit } = useCreateDareFlow();
  const who = draft.recipients[0];
  const whoName = who?.full_name || (who ? `@${who.username}` : 'Someone');
  const count = draft.recipients.length;
  const names = draft.recipients.map((r) => (r.full_name || r.username).split(' ')[0]);

  const rows: { label: string; value: string }[] = [
    ...(count > 1 ? [{ label: 'Sent to', value: names.join(', ') }] : []),
    { label: 'Time to accept', value: `${draft.respondByHours} ${draft.respondByHours === 1 ? 'hour' : 'hours'}` },
    { label: 'Time to do it', value: `${draft.completeByHours} hours from accepting` },
    { label: 'Proof', value: draft.verificationMethod === 'video' ? 'A short video' : 'A photo' },
    { label: 'Reward', value: draft.rewardAmount ? (count > 1 ? `₹${draft.rewardAmount} each, you pay whoever does it (up to ₹${draft.rewardAmount * count})` : `₹${draft.rewardAmount}, you pay after you mark it done`) : 'None' },
  ];

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-[32px] font-extrabold leading-[1.04] tracking-[-0.035em] text-[var(--pact-text)] text-balance">Ready to send?</h1>

      {/* The growing card above already shows the dare; this is the small print. */}
      <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--card)]">
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
          {isSubmitting ? 'Sending…' : count > 1 ? `Send dare to ${count} people` : `Send dare to ${whoName.split(' ')[0]}`}
        </button>
      </div>
    </div>
  );
}
