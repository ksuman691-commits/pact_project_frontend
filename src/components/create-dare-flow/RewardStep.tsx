'use client';

import React, { useState } from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { REWARD_MAX } from '@/lib/createDareFlow/toApiPayload';

const PRESETS = [21, 51, 101];

/**
 * Optional reward. You pay it, over UPI, after you've seen the proof and
 * marked the dare done. The person you dare never pays or risks anything.
 */
export default function RewardStep() {
  const { draft, updateDraft, goNext } = useCreateDareFlow();
  const [custom, setCustom] = useState(draft.rewardAmount != null && !PRESETS.includes(draft.rewardAmount) ? String(draft.rewardAmount) : '');
  const name = draft.recipients[0]?.full_name?.split(' ')[0] || (draft.recipients[0] ? `@${draft.recipients[0].username}` : 'them');

  const chip = (selected: boolean) =>
    `h-11 rounded-full px-4 text-[14px] font-semibold transition ${selected ? 'bg-[var(--navy)] text-white' : 'border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]'}`;

  const setCustomAmount = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    setCustom(digits);
    updateDraft({ rewardAmount: digits ? Number(digits) : null });
  };

  const overMax = draft.rewardAmount != null && draft.rewardAmount > REWARD_MAX;

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Add a reward?</h1>
      <p className="mt-2 text-sm leading-[1.5] text-[var(--pact-text-dim)]">
        Optional. You pay {name} over UPI after you mark the dare done. They never pay anything.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Reward amount">
        <button type="button" aria-pressed={draft.rewardAmount == null} className={chip(draft.rewardAmount == null)} onClick={() => { setCustom(''); updateDraft({ rewardAmount: null }); }}>
          No reward
        </button>
        {PRESETS.map((amount) => (
          <button key={amount} type="button" aria-pressed={draft.rewardAmount === amount} className={chip(draft.rewardAmount === amount)} onClick={() => { setCustom(''); updateDraft({ rewardAmount: amount }); }}>
            ₹{amount}
          </button>
        ))}
      </div>

      <label className="mt-4 flex h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 text-[15px]">
        <span className="font-semibold text-[var(--muted)]">₹</span>
        <input
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder={`Other amount, up to ${REWARD_MAX}`}
          aria-label="Other reward amount in rupees"
          className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
      </label>
      {overMax && <p className="mt-2 text-[13px] font-semibold" style={{ color: '#B3261E' }}>The most you can offer is ₹{REWARD_MAX}.</p>}

      <p className="mt-4 rounded-[16px] bg-[var(--card)] px-4 py-3 text-[13px] leading-[1.5] text-[var(--muted)]">
        Keep it safe: don&apos;t offer money for anything risky, harmful or against the law.
      </p>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={goNext}
          disabled={overMax}
          className="w-full rounded-full bg-[var(--navy)] py-3 font-bold text-white disabled:opacity-40"
        >
          {draft.rewardAmount ? `Continue with ₹${draft.rewardAmount}` : 'Continue without a reward'}
        </button>
      </div>
    </div>
  );
}
