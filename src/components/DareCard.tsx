'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  pending: { label: 'Awaiting response', color: 'var(--navy)' },
  accepted: { label: 'Accepted', color: 'var(--navy)' },
  declined: { label: 'Declined', color: 'var(--muted)' },
  completed: { label: 'Completed', color: 'var(--navy)' },
  failed: { label: 'Not completed', color: 'var(--warn-text)' },
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

  // A photo is only ever real for a dare once its proof has been submitted
  // (proof_url on the Dare object, populated on completion) — pending/
  // accepted dares have no image field at all, so this card only goes
  // photo-forward for that completed slice rather than faking a cover image.
  const hasProofPhoto = Boolean(dare.proof_url) && dare.proof_type !== 'video';

  return (
    <>
      <div
      onClick={() => router.push(`/dares/${dare.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/dares/${dare.id}`);
      }}
      className={`cursor-pointer overflow-hidden rounded-[6px] transition ${isExpired ? 'bg-[var(--card-muted)]' : 'bg-[var(--card)]'}`}
      style={{ border: '1px solid var(--hairline)' }}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          <span className="truncate">Dare · {relationLabel}</span>
          <span className="flex flex-shrink-0 items-center gap-1">
            {isPrivate ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Eye className="h-3 w-3" aria-hidden="true" />}
            {isPrivate ? 'Private' : 'Public'}
          </span>
        </div>
        <div className="mb-3 h-px bg-[var(--hairline)]" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <DareTimeRing
            name={ringName}
            avatarUrl={ringAvatarUrl}
            username={ringUsername}
            target={target}
            windowStart={dare.created_at}
            size={44}
            showLabel={!isExpired}
          />
          {statusPill && (
            <span className="flex-shrink-0 text-xs font-semibold" style={{ color: statusPill.color }}>
              {statusPill.label}
            </span>
          )}
        </div>

        <h3 className="mb-1 truncate font-serif text-[22px] font-medium leading-tight text-[var(--ink)]">{dare.title}</h3>
        <p className="truncate text-[13px] text-[var(--muted)]">{dare.description}</p>
        {hasProofPhoto && (
          <div className="relative mt-3 flex items-center gap-3 rounded-[4px] border border-dashed border-[var(--seat-border)] p-3">
            <div className="relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-[3px] bg-[var(--tan)]">
              <Image src={dare.proof_url as string} alt={`Proof for ${dare.title}`} fill className="object-cover" sizes="52px" />
            </div>
            <p className="text-[13px] font-semibold text-[var(--ink)]">Proof submitted</p>
          </div>
        )}
        {/* Public dares show the same "N accepted" framing as the rest of
            the app's social-proof copy — `recipient_count` on a public dare
            counts everyone who has claimed it, a real field, not a fabricated
            engagement number. Private dares (fixed, named recipients) don't
            get this line since "accepted" isn't a meaningful open count there. */}
        {!isPrivate && recipientCount > 0 && (
          <p className="mt-1.5 text-xs text-[var(--pact-text-faint)]"><span className="font-bold text-[var(--pact-text)]">{recipientCount}</span> {recipientCount === 1 ? 'person' : 'people'} accepted</p>
        )}
      </div>

      {/* Fast inline actions — no need to open the detail page for these */}
      {!isExpired && (isPending || isAccepted || isPublicUnclaimed) && (
        <div className="flex gap-2 border-t border-[var(--hairline-soft)] px-5 py-3">
          {isPending && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  declineMutation.mutate(dare.id);
                }}
                disabled={declineMutation.isPending}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--dash)] text-[13px] font-semibold text-[var(--ink-soft)] transition disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Decline
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  acceptMutation.mutate(dare.id);
                }}
                disabled={acceptMutation.isPending}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--navy)] text-sm font-semibold text-[var(--card)] hover:bg-[var(--navy-hover)] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Accept
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
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--navy)] text-sm font-semibold text-[var(--card)] hover:bg-[var(--navy-hover)]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
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
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--navy)] text-sm font-semibold text-[var(--card)] hover:bg-[var(--navy-hover)] disabled:opacity-50"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
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
