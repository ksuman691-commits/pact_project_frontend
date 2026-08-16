'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, Upload, Zap } from 'lucide-react';
import type { Dare } from '@/types';
import UserAvatarLink from '@/components/UserAvatarLink';
import { useAuthStore } from '@/store/auth';
import { useAcceptDare, useDeclineDare, useClaimDare } from '@/hooks/useDareMutations';
import { formatCountdown, urgencyColor } from '@/lib/dareCountdown';
import DareProofUploadModal from '@/components/DareProofUploadModal';

interface DareCardProps {
  dare: Dare;
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--pact-gold)' },
  accepted: { label: 'Accepted', color: 'var(--pact-violet)' },
  declined: { label: 'Declined', color: 'var(--pact-text-faint)' },
  completed: { label: 'Completed', color: 'var(--pact-mint)' },
  failed: { label: 'Failed', color: 'var(--pact-pink)' },
};

/**
 * Whole card navigates to the dare detail page, but it also hosts direct
 * Accept/Decline/Upload Proof/Claim actions and a nested profile link — so
 * this uses a plain div + router.push (same pattern as FeedPactCard)
 * rather than wrapping everything in a <Link>. A modal opened from inside
 * an anchor tag would have every click inside it bubble up and navigate,
 * which a nested-<a> approach can't avoid.
 */
export default function DareCard({ dare }: DareCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const acceptMutation = useAcceptDare();
  const declineMutation = useDeclineDare();
  const claimMutation = useClaimDare();

  const isCreator = user?.id === dare.creator_id;
  const isRecipient = !isCreator && Boolean(dare.my_recipient_status);
  const isPending = dare.my_recipient_status === 'pending';
  const isAccepted = dare.my_recipient_status === 'accepted';
  const isPublicUnclaimed = dare.audience === 'public' && !isCreator && !dare.my_recipient_status;

  // Pending recipients count down to the response deadline; accepted
  // recipients (or anyone just browsing) count down to the completion
  // deadline — matches how the deadline actually applies to the viewer.
  const countdown = isPending
    ? formatCountdown(dare.respond_by, 'Respond')
    : formatCountdown(dare.complete_by, 'Complete');

  const statusPill = dare.my_recipient_status ? STATUS_PILL[dare.my_recipient_status] : null;

  return (
    <>
      <div
      onClick={() => router.push(`/dares/${dare.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/dares/${dare.id}`);
      }}
      className="pact-card cursor-pointer overflow-hidden rounded-[28px] transition"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatarLink
              name={dare.creator_full_name || dare.creator_username}
              avatarUrl={dare.creator_avatar_url}
              username={dare.creator_username}
              size={40}
              stopPropagation
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--pact-text)] truncate">
                {isCreator ? 'You' : dare.creator_full_name || dare.creator_username || 'Anonymous'}
              </p>
              <p className="text-xs text-[var(--pact-text-faint)] truncate">@{dare.creator_username || 'user'}</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {statusPill && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'var(--pact-surface-2)', color: statusPill.color }}
              >
                {statusPill.label}
              </span>
            )}
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: 'var(--pact-surface-2)', color: urgencyColor(countdown.urgency) }}
            >
              <Clock className="h-3 w-3" />
              {countdown.label}
            </span>
          </div>
        </div>

        <h3 className="mb-1 font-bold text-base text-[var(--pact-text)] line-clamp-2">{dare.title}</h3>
        <p className="text-sm text-[var(--pact-text-dim)] line-clamp-2">{dare.description}</p>
      </div>

      {/* Fast inline actions — no need to open the detail page for these */}
      {(isPending || isAccepted || isPublicUnclaimed) && (
        <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: 'var(--pact-hairline)' }}>
          {isPending && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  acceptMutation.mutate(dare.id);
                }}
                disabled={acceptMutation.isPending}
                className="pact-btn-glow flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  declineMutation.mutate(dare.id);
                }}
                disabled={declineMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 text-sm font-semibold transition disabled:opacity-50"
                style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text-dim)' }}
              >
                <XCircle className="h-4 w-4" />
                Decline
              </button>
            </>
          )}

          {isAccepted && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProofModalOpen(true);
              }}
              className="pact-btn-glow flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              <Upload className="h-4 w-4" />
              Upload Proof
            </button>
          )}

          {isPublicUnclaimed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                claimMutation.mutate(dare.id);
              }}
              disabled={claimMutation.isPending}
              className="pact-btn-glow flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
            >
              <Zap className="h-4 w-4" />
              {claimMutation.isPending ? 'Claiming...' : 'Claim Dare'}
            </button>
          )}
        </div>
      )}

    </div>

      {/* Rendered as a sibling of the card, not a descendant — the card
          carries backdrop-filter (for the frosted-glass look), which per
          spec creates a containing block for `position: fixed` children.
          A modal nested inside would be clipped/positioned relative to the
          card's box instead of the viewport (see FeedPactCard for the same
          pattern with ProofUploadModal). */}
      {isRecipient && isAccepted && (
        <div onClick={(e) => e.stopPropagation()}>
          <DareProofUploadModal isOpen={proofModalOpen} onClose={() => setProofModalOpen(false)} dareId={dare.id} />
        </div>
      )}
    </>
  );
}
