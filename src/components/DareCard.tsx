'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Upload, Zap, Eye, Lock } from 'lucide-react';
import type { Dare } from '@/types';
import DareTimeRing from '@/components/DareTimeRing';
import { useAuthStore } from '@/store/auth';
import { useAcceptDare, useDeclineDare, useClaimDare } from '@/hooks/useDareMutations';
import { getDisplayName } from '@/lib/displayName';
import { isDareExpired } from '@/lib/dareCountdown';
import DareProofUploadModal from '@/components/DareProofUploadModal';

interface DareCardProps {
  dare: Dare;
  /**
   * Who this row's avatar/name line should represent — the page decides
   * this per tab, since the same Dare object is viewed from different
   * angles: "For You" cares who sent it, "Sent by You" cares who it went
   * to, "Discover" has no personal recipient yet.
   */
  viewerContext?: 'for-you' | 'sent' | 'discover';
}

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--pact-pink)' },
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
export default function DareCard({ dare, viewerContext = 'for-you' }: DareCardProps) {
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
  const isPrivate = dare.audience !== 'public';
  const target = dare.expires_at ?? (isPending ? dare.respond_by : dare.complete_by);
  const isExpired = isDareExpired(dare);

  // Live-updating clock so the ring/label recompute as time passes without
  // a page refresh. The server timestamp in `target` stays the source of
  // truth; this interval only triggers a re-render.
  const [, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isExpired) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [isExpired]);

  // A dare/recipient that already reached a real outcome (completed/failed/
  // declined) always wins over the deadline check — that status is more
  // informative than "expired" and isDareExpired() already excludes these
  // from being flagged as expired in the first place. Otherwise, once the
  // deadline has passed, the badge must say "Expired" rather than falling
  // back to whatever transient status (e.g. "pending") the dare was in
  // right before it expired — showing "Pending" + an "Expired" subtitle
  // together was the contradiction being fixed here.
  const resolvedStatus = dare.my_recipient_status || dare.status;
  const isTerminalOutcome = Boolean(resolvedStatus) && ['completed', 'failed', 'declined'].includes(resolvedStatus);
  const statusPill = isTerminalOutcome
    ? STATUS_PILL[resolvedStatus]
    : isExpired
      ? { label: 'Expired', color: 'var(--pact-text-faint)' }
      : dare.my_recipient_status ? STATUS_PILL[dare.my_recipient_status] : STATUS_PILL[dare.status] ?? null;

  // First-recipient name comes from the full recipients array when it's
  // loaded (dare detail), but list/feed responses only return
  // `recipient_count` — falling back to a count keeps "Sent by You" honest
  // rather than guessing a name that isn't actually in the payload.
  const firstRecipient = dare.recipients?.[0];
  const recipientCount = dare.recipient_count ?? dare.recipients?.length ?? 0;
  const extraRecipients = Math.max(0, recipientCount - 1);
  const recipientSummary = firstRecipient
    ? `${getDisplayName(firstRecipient.user_id, firstRecipient.full_name || firstRecipient.username)}${extraRecipients > 0 ? ` +${extraRecipients}` : ''}`
    : `${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}`;

  const senderName = getDisplayName(dare.creator_id, dare.creator_full_name || dare.creator_username);
  const relationLabel = viewerContext === 'sent' ? `To ${recipientSummary}` : viewerContext === 'discover' ? `By ${senderName}` : `From ${senderName}`;
  const ringName = viewerContext === 'sent' ? firstRecipient?.full_name || firstRecipient?.username || 'User' : senderName;
  const ringAvatarUrl = viewerContext === 'sent' ? firstRecipient?.avatar_url : dare.creator_avatar_url;
  const ringUsername = viewerContext === 'sent' ? firstRecipient?.username : dare.creator_username;

  return (
    <>
      <div
      onClick={() => router.push(`/dares/${dare.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/dares/${dare.id}`);
      }}
      className={`pact-card cursor-pointer overflow-hidden rounded-[28px] transition ${isExpired ? 'opacity-60' : ''}`}
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DareTimeRing
              name={ringName}
              avatarUrl={ringAvatarUrl}
              username={ringUsername}
              target={target}
              windowStart={dare.created_at}
              size={44}
              showLabel={!isExpired}
            />
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-[var(--pact-text)] truncate">
                {relationLabel}
              </p>
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
            {/* Visible label, not just a `title` tooltip — this app runs as
                a mobile web view where hover tooltips are unreachable, so a
                touch user previously had no way to know what this icon
                meant. */}
            <span
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
              style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text-faint)' }}
              title={isPrivate ? 'Private Dare' : 'Public Dare'}
            >
              {isPrivate ? <Lock className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
        </div>

        <h3 className="mb-1 font-bold text-base text-[var(--pact-text)] truncate">{dare.title}</h3>
        <p className="text-sm text-[var(--pact-text-dim)] truncate">{dare.description}</p>
      </div>

      {/* Fast inline actions — no need to open the detail page for these */}
      {!isExpired && (isPending || isAccepted || isPublicUnclaimed) && (
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
