'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { dareService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const REASONS: { id: 'scam' | 'unsafe' | 'mean' | 'spam' | 'other'; label: string; hint: string }[] = [
  { id: 'scam', label: 'Scam or fraud', hint: 'Asking you to pay first, fake rewards, or something feels off with money' },
  { id: 'unsafe', label: 'Harmful or dangerous', hint: 'Could hurt someone, illegal, or risky for health' },
  { id: 'mean', label: "It's mean or humiliating", hint: 'Bullying, pressure, or harassment' },
  { id: 'spam', label: "It's spam", hint: 'Ads, links, or the same thing over and over' },
  { id: 'other', label: 'Something else', hint: 'Tell us below' },
];

/**
 * Report a dare. Reporting takes you out of the dare and removes it from your
 * lists; the person who sent it is never told who reported.
 */
export default function ReportDareSheet({ dareId, onClose, onDone }: { dareId: number; onClose: () => void; onDone?: () => void }) {
  const [reason, setReason] = useState<(typeof REASONS)[number]['id'] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await dareService.report(dareId, reason, note.trim());
      toast.success(reason === 'scam' ? "Reported. Don't send any money; we've paused payments on it while we check." : "Reported. It's gone from your dares.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.dares.all });
      onDone?.();
      onClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "Couldn't send that report. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 px-3 pb-3" role="dialog" aria-modal="true" aria-labelledby="report-dare-title">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative z-10 w-full max-w-md rounded-[26px] border border-[var(--line)] bg-[var(--card)] px-[18px] pb-4 pt-5 text-[var(--ink)] shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-[var(--muted)]">
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 id="report-dare-title" className="pr-10 text-[22px] font-bold tracking-[-0.03em]">Report this dare</h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.5] text-[var(--muted)]">You&apos;ll be taken out of it and it won&apos;t count against you. We don&apos;t tell them who reported.</p>

        <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Why are you reporting it?">
          {REASONS.map((item) => {
            const picked = reason === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={picked}
                onClick={() => setReason(item.id)}
                className="flex min-h-[56px] items-center gap-3 rounded-[16px] border px-3.5 text-left transition active:scale-[0.99]"
                style={picked ? { background: 'var(--ink)', borderColor: 'var(--ink)', color: 'white' } : { borderColor: 'var(--line)' }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">{item.label}</span>
                  <span className="block text-[12.5px]" style={{ color: picked ? '#C9C8CF' : 'var(--muted)' }}>{item.hint}</span>
                </span>
                {picked && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--dare)] text-[var(--ink)]">
                    <Check className="size-3.5" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {reason && (
          <div className="cp-pop-in mt-3">
            <label htmlFor="report-dare-note" className="mb-1 block text-[13px] font-bold">
              Anything we should know? {reason === 'other' ? '' : <span className="font-medium text-[var(--muted)]">(up to you)</span>}
            </label>
            <textarea
              id="report-dare-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={2}
              className="w-full resize-none rounded-[14px] border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[16px] outline-none focus:border-[var(--ink)]"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!reason || busy || (reason === 'other' && !note.trim())}
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-[#B3261E] text-[16px] font-bold text-white disabled:opacity-40"
        >
          {busy ? 'Sending…' : 'Report dare'}
        </button>
      </div>
    </div>
  );
}
