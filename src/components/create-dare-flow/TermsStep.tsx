'use client';

import React, { useEffect, useState } from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';
import { REWARD_MAX } from '@/lib/createDareFlow/toApiPayload';
import { usePaused } from '@/lib/appStatus';
import PausedNote from '@/components/app/PausedNote';
import { FlowFooter, FlowLabel, Segmented } from '@/components/flow/FlowHero';
import SlideToSend from './SlideToSend';

// Small, lucky-number amounts: enough to make it fun, never enough to make it a bet.
const PRESETS = [9, 21, 51, 101];

/**
 * Step 3, Send. Everything that used to be four screens (the clock, proof,
 * reward and a review list) on one, with good defaults already picked. The
 * ticket above shows each choice as you make it, so there's no review list.
 */
export default function TermsStep() {
  const { draft, updateDraft, isSubmitting, submit } = useCreateDareFlow();
  const [custom, setCustom] = useState(draft.rewardAmount != null && !PRESETS.includes(draft.rewardAmount) ? String(draft.rewardAmount) : '');
  const [otherOpen, setOtherOpen] = useState(Boolean(custom));
  const moneyPaused = usePaused('dare_money');
  useEffect(() => {
    if (moneyPaused && draft.rewardAmount != null) updateDraft({ rewardAmount: null });
  }, [moneyPaused, draft.rewardAmount, updateDraft]);

  const who = draft.recipients[0];
  const circle = draft.circle ?? null;
  const count = circle ? circle.others : draft.recipients.length;
  const names = draft.recipients.map((r) => (r.full_name || r.username).split(' ')[0]);
  const first = names[0] || 'them';
  const overMax = draft.rewardAmount != null && draft.rewardAmount > REWARD_MAX;

  const chip = (on: boolean) =>
    `h-10 rounded-full px-3.5 text-[14px] font-bold transition active:scale-95 ${on ? 'bg-[var(--ink)] text-[var(--dare)]' : 'bg-[var(--card)] text-[var(--ink)]'}`;
  const chipStyle = (on: boolean) => (on ? undefined : { boxShadow: 'inset 0 0 0 1px var(--line)' });

  const setCustomAmount = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    setCustom(digits);
    updateDraft({ rewardAmount: digits ? Number(digits) : null });
  };

  const sendLabel = `${circle ? `Slide to dare ${circle.name}` : count > 2 ? `Slide to dare ${count} people` : count === 2 ? `Slide to dare ${names[0]} & ${names[1]}` : `Slide to dare ${first}`}${draft.rewardAmount && count <= 1 ? ` for ₹${draft.rewardAmount}` : ''}`;

  return (
    <>
      <div className="pact-step-enter flex flex-1 flex-col px-5 pt-6">
        <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink)]">Set the terms</h2>
        <p className="mt-1.5 text-[14.5px] text-[var(--muted)]">Good defaults are picked. Change what you like, then send.</p>

        <section className="mt-5">
          <FlowLabel hint={names.length === 1 && !circle ? `${first} has this long to answer` : 'How long they have to answer'}>Time to say yes</FlowLabel>
          <Segmented
            tone="dare"
            label="Time to say yes"
            value={draft.respondByHours}
            options={[1, 6, 12, 24].map((h) => ({ value: h, label: `${h}h` }))}
            onChange={(h) => updateDraft({ respondByHours: h })}
          />
        </section>

        <section className="mt-5">
          <FlowLabel hint="Starts when they accept">Time to do it</FlowLabel>
          <Segmented
            tone="dare"
            label="Time to do it"
            value={draft.completeByHours}
            options={[24, 48].map((h) => ({ value: h, label: `${h} hours` }))}
            onChange={(h) => updateDraft({ completeByHours: h })}
          />
        </section>

        <section className="mt-5">
          <FlowLabel hint="You see it and mark it done">Proof</FlowLabel>
          <Segmented
            tone="dare"
            label="Proof"
            value={draft.verificationMethod}
            options={[
              { value: 'photo' as const, label: 'Photo' },
              { value: 'video' as const, label: 'Video' },
            ]}
            onChange={(m) => updateDraft({ verificationMethod: m })}
          />
        </section>

        <section className="mt-5">
          <FlowLabel hint="Optional">Put something on it?</FlowLabel>
          {moneyPaused ? (
            <PausedNote text={moneyPaused} />
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Reward amount">
                <button type="button" aria-pressed={draft.rewardAmount == null} className={chip(draft.rewardAmount == null)} style={chipStyle(draft.rewardAmount == null)} onClick={() => { setCustom(''); setOtherOpen(false); updateDraft({ rewardAmount: null }); }}>
                  No reward
                </button>
                {PRESETS.map((amount) => {
                  const on = draft.rewardAmount === amount && !custom;
                  return (
                    <button key={amount} type="button" aria-pressed={on} className={chip(on)} style={chipStyle(on)} onClick={() => { setCustom(''); setOtherOpen(false); updateDraft({ rewardAmount: amount }); }}>
                      ₹{amount}
                    </button>
                  );
                })}
                <button type="button" aria-pressed={otherOpen} className={chip(otherOpen)} style={chipStyle(otherOpen)} onClick={() => setOtherOpen(true)}>
                  Other
                </button>
              </div>
              {otherOpen && (
                <label className="mt-2 flex h-12 items-center gap-2 rounded-full bg-[var(--card)] px-4 text-[15px]" style={{ boxShadow: 'inset 0 0 0 1.5px var(--ink)' }}>
                  <span className="font-semibold text-[var(--muted)]">₹</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={custom}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Any amount up to ${REWARD_MAX}`}
                    aria-label="Other reward amount in rupees"
                    className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  />
                </label>
              )}
              {overMax && <p className="mt-2 text-[13px] font-semibold" style={{ color: '#B3261E' }}>The most you can offer is ₹{REWARD_MAX}.</p>}
              <p className="mt-2.5 text-[12.5px] leading-[1.45] text-[var(--muted)]">
                {draft.rewardAmount
                  ? `You pay ${count > 1 ? 'each person who does it' : first} over UPI, only after you see the proof and mark it done. They never pay anything.`
                  : 'Keep it safe: never offer money for anything risky, harmful or against the law.'}
              </p>
            </>
          )}
        </section>
      </div>

      <FlowFooter>
        <SlideToSend label={sendLabel} busy={isSubmitting} disabled={(!who && !circle) || overMax} onSend={submit} />
        <p className="mt-2 text-center text-[12.5px] text-[var(--muted)]">You can call it off any time before it&apos;s marked done.</p>
      </FlowFooter>
    </>
  );
}
