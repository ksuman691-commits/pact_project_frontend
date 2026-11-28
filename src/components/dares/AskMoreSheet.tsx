'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, X } from 'lucide-react';
import BodyPortal from '@/components/BodyPortal';
import { useAskMore } from '@/hooks/useDareMutations';

/** The most a dare can carry (the server's REWARD_MAX). */
const REWARD_MAX = 500;

/**
 * "Ask for more": before saying yes, the person dared names a bigger reward,
 * once, with an optional note. The creator agrees, keeps it, or calls it off.
 */
export default function AskMoreSheet({
  isOpen,
  onClose,
  dareId,
  current,
  creatorName,
}: {
  isOpen: boolean;
  onClose: () => void;
  dareId: number;
  /** The reward on the dare now (0 when there is none). */
  current: number;
  creatorName: string;
}) {
  const ask = useAskMore();
  const suggestions = Array.from(new Set([current ? current * 2 : 50, current + 25, current + 50, current + 100]))
    .filter((value) => value > current && value <= REWARD_MAX)
    .sort((a, b) => a - b)
    .slice(0, 3);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (isOpen) {
      setAmount(String(suggestions[0] ?? Math.min(REWARD_MAX, current + 1)));
      setNote('');
    }
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  if (!isOpen) return null;

  const value = Number(amount);
  const valid = Number.isInteger(value) && value > current && value <= REWARD_MAX;
  const hint = !amount
    ? `More than ₹${current}, up to ₹${REWARD_MAX}`
    : value <= current
      ? `Ask for more than ₹${current}`
      : value > REWARD_MAX
        ? `Up to ₹${REWARD_MAX}`
        : `${creatorName} can agree, keep it at ₹${current}, or call it off. You can ask once.`;

  const send = () => {
    if (!valid || ask.isPending) return;
    ask.mutate({ dareId, amount: value, note: note.trim() || undefined }, { onSuccess: onClose });
  };

  return (
    <BodyPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ask-more-title"
          className="w-full max-w-md rounded-t-[28px] bg-[var(--card)] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--hairline)]" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="ask-more-title" className="text-[20px] font-extrabold text-[var(--ink)]">Ask for more</h2>
              <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">
                {current ? `${creatorName} is offering ₹${current}.` : `${creatorName} didn't put money on this one.`}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center text-[var(--muted)]">
              <X className="size-5" />
            </button>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Amount in rupees</span>
            <span className="flex h-16 items-center gap-1 rounded-[18px] border-[1.5px] border-[var(--ink)] bg-white px-4">
              <IndianRupee className="size-6 text-[var(--ink)]" strokeWidth={2.4} aria-hidden="true" />
              <input
                type="number"
                inputMode="numeric"
                min={current + 1}
                max={REWARD_MAX}
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                className="min-w-0 flex-1 bg-transparent text-[30px] font-extrabold tabular-nums text-[var(--ink)] outline-none"
              />
            </span>
          </label>
          {suggestions.length > 0 && (
            <div className="mt-2.5 flex gap-2">
              {suggestions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAmount(String(option))}
                  aria-pressed={value === option}
                  className="h-10 rounded-full px-4 text-[14px] font-extrabold"
                  style={value === option ? { background: 'var(--ink)', color: 'var(--dare)' } : { background: 'var(--card-muted)', color: 'var(--ink)' }}
                >
                  ₹{option}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-[12.5px] text-[var(--muted)]" aria-live="polite">{hint}</p>

          <label className="mt-3 block">
            <span className="text-[13px] font-bold text-[var(--ink)]">Why? (optional)</span>
            <input
              type="text"
              value={note}
              maxLength={200}
              onChange={(event) => setNote(event.target.value)}
              placeholder="It's a big one"
              className="mt-1 h-11 w-full rounded-full border border-[var(--hairline)] bg-white px-4 text-[14px] text-[var(--ink)] outline-none"
            />
          </label>

          <button
            type="button"
            onClick={send}
            disabled={!valid || ask.isPending}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[var(--ink)] text-[15px] font-extrabold text-[var(--dare)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {ask.isPending ? 'Sending…' : valid ? `Ask for ₹${value}` : 'Ask for more'}
          </button>
        </div>
      </div>
    </BodyPortal>
  );
}
