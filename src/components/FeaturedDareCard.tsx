'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Zap } from 'lucide-react';
import type { Dare } from '@/types';
import CircleMark from '@/components/brand/CircleMark';
import CreateDareModal from '@/components/CreateDareModal';
import { useClaimDare } from '@/hooks/useDareMutations';
import { isDareExpired, parseApiDate } from '@/lib/dareCountdown';

interface FeaturedDareCardProps {
  dare: Dare;
}

const two = (n: number) => String(n).padStart(2, '0');

/** A ticking h:mm:ss until the dare closes (days shown once it is more than a day away). */
function useClock(targetRaw?: string | null): string | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const target = parseApiDate(targetRaw);
  if (!target || now == null) return null;
  const seconds = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  if (seconds <= 0) return null;
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days}d ${Math.floor((seconds % 86400) / 3600)}h`;
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`;
}

/**
 * The big yellow dare on Home and at the top of Dares. Yellow on ink is the
 * dare colour everywhere; the red mark appears only when CirclePact itself
 * posted the dare. Every number is a real field on the dare: how many people
 * are in, and (when the server sends it) how many finished.
 */
export default function FeaturedDareCard({ dare }: FeaturedDareCardProps) {
  const router = useRouter();
  const claim = useClaimDare();
  const [sendOpen, setSendOpen] = useState(false);
  const clock = useClock(dare.expires_at ?? dare.respond_by);
  const expired = isDareExpired(dare);
  const live = dare.recipient_count ?? dare.recipients?.length ?? 0;
  const took = dare.completed_count;
  const canJoin = dare.audience === 'public' && !dare.my_recipient_status && !expired;
  const open = () => router.push(`/dares/${dare.id}`);

  return (
    <>
      <section
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) open();
        }}
        role="link"
        tabIndex={0}
        aria-label={dare.title}
        className="relative cursor-pointer overflow-hidden rounded-[24px] bg-[var(--dare)] p-4 text-[var(--ink)]"
      >
        <Zap className="pointer-events-none absolute -right-7 -top-4 h-36 w-36 opacity-[0.08]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold">
            {dare.is_official ? <CircleMark size={14} /> : <Zap className="h-3.5 w-3.5 shrink-0" fill="currentColor" strokeWidth={0} aria-hidden="true" />}
            <span className="truncate">{dare.is_official ? 'CirclePact dare of the day' : 'Featured dare'}</span>
          </span>
          {clock && !expired && (
            <span className="shrink-0 rounded-full bg-[var(--ink)] px-2.5 py-1 text-[12px] font-bold tabular-nums text-[var(--dare)]" aria-label={`${clock} left to join`}>
              {clock}
            </span>
          )}
        </div>
        <h2 className="relative mt-3 line-clamp-3 text-balance text-[24px] font-bold leading-[1.15] tracking-[-0.02em]">{dare.title}</h2>
        <div className="relative mt-3 flex items-center justify-between gap-3 text-[13px]">
          <span className="font-semibold">
            {live > 0 ? `${live.toLocaleString()} live with the dare` : 'Be the first to take it'}
          </span>
          {typeof took === 'number' && took > 0 && <span className="shrink-0 font-bold">{took.toLocaleString()} took it</span>}
        </div>
        <div className="relative mt-3.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canJoin ? (
            <button
              type="button"
              onClick={() => claim.mutate(dare.id)}
              disabled={claim.isPending}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--ink)] text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {claim.isPending ? 'Accepting…' : 'Accept dare'}
            </button>
          ) : (
            <button type="button" onClick={open} className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--ink)] text-[15px] font-bold text-white transition active:scale-[0.98]">
              {dare.my_recipient_status ? "You're in. Open dare" : 'See dare'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSendOpen(true)}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-[var(--ink)] text-[15px] font-bold text-[var(--ink)] transition active:scale-[0.98]"
          >
            <Send className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Dare a friend
          </button>
        </div>
      </section>
      <CreateDareModal isOpen={sendOpen} onClose={() => setSendOpen(false)} />
    </>
  );
}
