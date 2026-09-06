'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import type { Dare } from '@/types';
import { useClaimDare } from '@/hooks/useDareMutations';
import { getTimeRing, isDareExpired } from '@/lib/dareCountdown';

interface FeaturedDareCardProps {
  dare: Dare;
}

/**
 * Photo-forward "featured dare" hero for the top of the Dares page —
 * structurally matching the approved mockup's dare-of-the-day treatment,
 * but honestly labeled "Featured dare" rather than "Dare of the Day":
 * there's no daily-rotation/curation mechanic in the data model, so the
 * page picks the single most time-critical open public dare from Discover
 * instead of implying an editorial pick that doesn't exist. Every number
 * shown (recipient_count, the countdown) is a real field off the Dare
 * object, same as DareCard.
 */
export default function FeaturedDareCard({ dare }: FeaturedDareCardProps) {
  const router = useRouter();
  const claimMutation = useClaimDare();
  const target = dare.expires_at ?? dare.respond_by;
  const ring = getTimeRing(target, dare.created_at);
  const isExpired = isDareExpired(dare);
  const recipientCount = dare.recipient_count ?? dare.recipients?.length ?? 0;
  const isPublicUnclaimed = dare.audience === 'public' && !dare.my_recipient_status;

  return (
    <div
      onClick={() => router.push(`/dares/${dare.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/dares/${dare.id}`); }}
      className="pact-card cursor-pointer overflow-hidden rounded-[28px]"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      <div className="relative flex aspect-[16/9] w-full items-end p-4" style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}>
        <Zap className="pointer-events-none absolute right-4 top-4 h-14 w-14 text-white/25" strokeWidth={1.5} aria-hidden="true" />
        <div className="relative z-10">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <Zap className="h-2.5 w-2.5" />
            Featured dare
          </span>
          <h3 className="text-xl font-black leading-tight text-white text-balance">{dare.title}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <p className="text-sm text-[var(--pact-text-muted)]">
          <span className="font-bold text-[var(--pact-text)]">{recipientCount}</span> {recipientCount === 1 ? 'person' : 'people'} accepted
        </p>
        {!isExpired && (
          <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--pact-surface-2)', color: ring.color }}>
            {ring.label}
          </span>
        )}
      </div>
      {isPublicUnclaimed && !isExpired && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); claimMutation.mutate(dare.id); }}
            disabled={claimMutation.isPending}
            className="pact-btn-glow flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
          >
            <Zap className="h-4 w-4" />
            {claimMutation.isPending ? 'Accepting…' : 'Accept Dare'}
          </button>
        </div>
      )}
    </div>
  );
}
