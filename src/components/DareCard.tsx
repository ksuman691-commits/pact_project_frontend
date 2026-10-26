'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Clock, Link2, MoreHorizontal, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Dare, DareState } from '@/types';
import Avatar from '@/components/Avatar';
import AutoPlayVideo from '@/components/media/AutoPlayVideo';
import ConfirmModal from '@/components/ConfirmModal';
import DareProofUploadModal from '@/components/DareProofUploadModal';
import DareRewardPaySheet from '@/components/dares/DareRewardPaySheet';
import { useAuthStore } from '@/store/auth';
import { useAcceptDare, useCancelDare, useClaimDare, useDareRewardStep, useDeclineDare, useReviewDare } from '@/hooks/useDareMutations';
import { copyText } from '@/lib/circleInvite';
import { parseApiDate } from '@/lib/dareCountdown';
import {
  STATE_LABEL,
  activeDeadline,
  creatorFace,
  dareRole,
  dareState,
  firstName,
  nextStep,
  recipientFace,
  rewardOwed,
  timeLeft,
  type DareFace,
  type DareRole,
} from '@/lib/dareView';

interface DareCardProps {
  dare: Dare;
  /** Kept for older call sites; the card works out the viewer's side itself. */
  viewerContext?: 'for-you' | 'sent' | 'discover';
  /** The detail page shows the card without tapping through, plus the description. */
  variant?: 'feed' | 'detail';
}

const ACTIVE: DareState[] = ['awaiting_response', 'in_progress', 'awaiting_review', 'open'];

function ago(raw?: string | null): string {
  const at = parseApiDate(raw);
  if (!at) return '';
  const minutes = Math.max(0, Math.round((Date.now() - at.getTime()) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function shortDate(raw?: string | null): string {
  const at = parseApiDate(raw);
  return at ? at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

/**
 * A dare, drawn like a Pact card so it clearly belongs to CirclePact: the same
 * rounded card, edge-to-edge media with dark gradients, the person on top and
 * the title in bold white at the bottom. What makes it a dare is the short
 * clock, the status and one clear next step, not a different palette.
 */
export default function DareCard({ dare, variant = 'feed' }: DareCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = dareRole(dare, user?.id);
  const state = dareState(dare);
  const next = nextStep(dare, role);
  const deadline = activeDeadline(dare);
  const creator = creatorFace(dare);
  const recipient = recipientFace(dare);

  // Re-render every 30s so the clock moves; the timestamps stay the server's.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  const left = deadline ? timeLeft(deadline.target) : null;

  const [mediaFailed, setMediaFailed] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmNotDone, setConfirmNotDone] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const accept = useAcceptDare();
  const decline = useDeclineDare();
  const claim = useClaimDare();
  const review = useReviewDare();
  const rewardStep = useDareRewardStep();
  const cancel = useCancelDare();

  // Who sits on top of the card: whoever the viewer is dealing with.
  const face: DareFace = role === 'creator' ? recipient ?? { name: 'Someone' } : role === 'viewer' && recipient && state === 'completed' ? recipient : creator;
  const headerSub =
    role === 'creator'
      ? `Your dare · ${ago(dare.created_at)}`
      : role === 'doer'
        ? `Dared you · ${ago(dare.created_at)}`
        : state === 'completed'
          ? `Dared by ${firstName(creator.name)} · ${shortDate(dare.completed_at)}`
          : `Dare · ${ago(dare.created_at)}`;

  const showMedia = Boolean(dare.proof_url) && !mediaFailed && (state === 'awaiting_review' || state === 'completed' || state === 'not_completed');
  const isVideo = dare.proof_type === 'video';
  const inactive = !ACTIVE.includes(state) && state !== 'completed';
  const involved = role !== 'viewer';
  const reward = involved && dare.reward_amount ? dare.reward_amount : null;
  const canNavigate = variant === 'feed';
  const shareable = Boolean(dare.shared_publicly) || dare.audience === 'public';
  const otherName = role === 'creator' ? firstName(recipient?.name ?? 'them') : firstName(creator.name);

  const open = () => canNavigate && router.push(`/dares/${dare.id}`);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const menuItems: { label: string; icon: React.ReactNode; onSelect: () => void; danger?: boolean }[] = [];
  if (role === 'creator' && state === 'awaiting_response') {
    menuItems.push({ label: 'Cancel dare', icon: <X className="size-4" aria-hidden="true" />, onSelect: () => setConfirmCancel(true), danger: true });
  }
  if (shareable) {
    menuItems.push({
      label: 'Copy link',
      icon: <Link2 className="size-4" aria-hidden="true" />,
      onSelect: async () => {
        if (await copyText(`${window.location.origin}/dares/${dare.id}/public`)) toast.success('Link copied');
      },
    });
  }

  const statusPill = (
    <span
      className={`flex items-center gap-1 rounded-[9px] px-2.5 py-[3px] text-[11.5px] font-extrabold ${inactive ? 'text-white' : 'bg-white text-[var(--navy)]'}`}
      style={inactive ? { backgroundColor: 'rgba(255,255,255,0.24)' } : undefined}
    >
      {state === 'completed' ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : <Zap className="size-3" strokeWidth={2.6} aria-hidden="true" />}
      {STATE_LABEL[state]}
    </span>
  );

  const caption = (
    <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5 text-white">
      <div className="flex flex-wrap items-center gap-1.5">
        {statusPill}
        {reward && (
          <span className="rounded-[9px] px-2.5 py-[3px] text-[11.5px] font-extrabold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.24)' }}>
            ₹{reward} reward
          </span>
        )}
      </div>
      <h2 className="mt-1.5 line-clamp-2 text-balance text-[20px] font-extrabold leading-[1.15] tracking-[-0.02em]" style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
        {dare.title}
      </h2>
      {left && (
        <p className="mt-1 flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
          <Clock className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          {left} to {deadline!.verb}
        </p>
      )}
    </div>
  );

  const identity = (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2.5 pl-3.5 pr-0.5 pt-2">
      <span className="inline-flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
        <Avatar name={face.name} avatarUrl={face.avatarUrl} size={34} />
      </span>
      <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>
        <div className="truncate text-[14.5px] font-bold">{face.name}</div>
        <div className="truncate text-[12px]" style={{ opacity: 0.92 }}>{headerSub}</div>
      </div>
      {menuItems.length > 0 && (
        <div className="pointer-events-auto relative" onClick={stop}>
          <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Dare options" aria-expanded={menuOpen} className="flex size-11 items-center justify-center text-white">
            <MoreHorizontal className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-2 top-11 z-20 min-w-[170px] overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--card)] py-1 shadow-lg">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    item.onSelect();
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 px-4 text-left text-[14px] font-semibold"
                  style={{ color: item.danger ? '#B3261E' : 'var(--ink)' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const primary = 'flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--navy)] px-4 text-[14px] font-extrabold text-white transition hover:bg-[var(--navy-hover)] active:scale-95 disabled:opacity-50';
  const secondary = 'flex h-11 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[var(--line)] px-4 text-[14px] font-extrabold text-[var(--ink)] transition active:scale-95 disabled:opacity-50';
  const note = 'min-w-0 flex-1 text-[13px] leading-[1.35] text-[var(--muted)]';

  let bar: React.ReactNode = null;
  if (next === 'respond') {
    bar = (
      <div className="grid w-full grid-cols-2 gap-2">
        <button type="button" className={secondary} disabled={decline.isPending || accept.isPending} onClick={() => decline.mutate(dare.id)}>
          Decline
        </button>
        <button type="button" className={primary} disabled={accept.isPending || decline.isPending} onClick={() => accept.mutate(dare.id)}>
          <Zap className="size-4" strokeWidth={2.4} aria-hidden="true" />
          {accept.isPending ? 'Accepting…' : 'Accept dare'}
        </button>
      </div>
    );
  } else if (next === 'post_proof') {
    bar = (
      <>
        <p className={note}>{dare.verification_method === 'video' ? 'Video' : 'Photo'} proof goes straight to {otherName}</p>
        <button type="button" className={primary} onClick={() => setProofOpen(true)}>
          <Camera className="size-4" strokeWidth={2.2} aria-hidden="true" />
          Post proof
        </button>
      </>
    );
  } else if (next === 'review') {
    bar = (
      <div className="grid w-full grid-cols-2 gap-2">
        <button type="button" className={secondary} disabled={review.isPending} onClick={() => setConfirmNotDone(true)}>
          Not done
        </button>
        <button type="button" className={primary} disabled={review.isPending} onClick={() => review.mutate({ dareId: dare.id, done: true })}>
          <Check className="size-4" strokeWidth={2.6} aria-hidden="true" />
          Mark done
        </button>
      </div>
    );
  } else if (next === 'pay') {
    bar = (
      <>
        <p className={note}>{dare.reward?.status === 'not_received' ? `${otherName} hasn't received it yet` : `${otherName} did it. Time to pay.`}</p>
        <button type="button" className={primary} onClick={() => setPayOpen(true)}>
          Pay ₹{dare.reward_amount}
        </button>
      </>
    );
  } else if (next === 'confirm_reward') {
    bar = (
      <div className="w-full">
        <p className="mb-2 text-[13px] text-[var(--muted)]">{otherName} says they paid ₹{dare.reward_amount}. Did it arrive?</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={secondary} disabled={rewardStep.isPending} onClick={() => rewardStep.mutate({ dareId: dare.id, step: 'not-received' })}>
            Not yet
          </button>
          <button type="button" className={primary} disabled={rewardStep.isPending} onClick={() => rewardStep.mutate({ dareId: dare.id, step: 'received' })}>
            Got it
          </button>
        </div>
      </div>
    );
  } else if (next === 'add_upi') {
    bar = (
      <>
        <p className={note}>Add your UPI ID so {otherName} can pay you ₹{dare.reward_amount}</p>
        <button type="button" className={primary} onClick={() => router.push('/profile/tips')}>
          Add UPI ID
        </button>
      </>
    );
  } else if (next === 'claim') {
    bar = (
      <>
        <p className={note}>Open to anyone</p>
        <button type="button" className={primary} disabled={claim.isPending} onClick={() => claim.mutate(dare.id)}>
          <Zap className="size-4" strokeWidth={2.4} aria-hidden="true" />
          {claim.isPending ? 'Claiming…' : 'Claim dare'}
        </button>
      </>
    );
  } else {
    bar = <p className={note}>{quietLine(dare, state, role, otherName, left)}</p>;
  }

  return (
    <>
      <article
        onClick={open}
        onKeyDown={(e) => {
          if (canNavigate && e.key === 'Enter' && e.target === e.currentTarget) open();
        }}
        role={canNavigate ? 'link' : undefined}
        tabIndex={canNavigate ? 0 : undefined}
        aria-label={canNavigate ? `${dare.title}, ${STATE_LABEL[state]}` : undefined}
        className={`pact-card relative mx-1.5 overflow-visible rounded-[22px] sm:mx-0 ${canNavigate ? 'cursor-pointer' : ''}`}
      >
        <div className="relative w-full overflow-hidden rounded-t-[22px]">
          {showMedia ? (
            <div className="relative aspect-[4/5] w-full bg-[var(--ink)]">
              {isVideo ? (
                <AutoPlayVideo src={dare.proof_url as string} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dare.proof_url as string} alt={`Proof for ${dare.title}`} onError={() => setMediaFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 to-transparent" />
            </div>
          ) : (
            // No photo yet: the same dark tile a new pact gets, a little taller so
            // the title and clock have room. Finished-without-success dares go grey.
            <div
              className="relative aspect-[16/10] w-full"
              style={{
                background: inactive
                  ? 'radial-gradient(120% 90% at 30% 20%, #3A3C44 0%, #1E1F24 60%, #141519 100%)'
                  : 'radial-gradient(120% 90% at 30% 20%, #2A3A6E 0%, #141A2E 55%, #0F1014 100%)',
              }}
            >
              <Zap className="pointer-events-none absolute -right-3 top-10 size-36 text-white/[0.06]" strokeWidth={1.4} aria-hidden="true" />
            </div>
          )}
          {identity}
          {caption}
        </div>

        {variant === 'detail' && (dare.description || dare.proof_caption) && (
          <div className="space-y-2 px-4 pt-3 text-[14.5px] leading-[1.45] text-[var(--ink)]">
            {dare.description && <p className="whitespace-pre-wrap">{dare.description}</p>}
            {dare.proof_caption && (
              <p className="text-[var(--muted)]">
                <span className="font-semibold text-[var(--ink)]">{recipient ? firstName(recipient.name) : 'They'}:</span> {dare.proof_caption}
              </p>
            )}
          </div>
        )}

        <div className="flex min-h-[60px] items-center gap-3 px-3.5 py-2.5" onClick={stop}>
          {bar}
        </div>
      </article>

      {/* Sheets and dialogs sit outside the card so taps inside them never open the dare. */}
      {role === 'doer' && state === 'in_progress' && (
        <div onClick={stop}>
          <DareProofUploadModal isOpen={proofOpen} onClose={() => setProofOpen(false)} dareId={dare.id} />
        </div>
      )}
      {role === 'creator' && (
        <DareRewardPaySheet dareId={dare.id} payeeName={recipient ? firstName(recipient.name) : 'them'} open={payOpen} onClose={() => setPayOpen(false)} />
      )}
      <ConfirmModal
        isOpen={confirmNotDone}
        onClose={() => setConfirmNotDone(false)}
        onConfirm={async () => {
          await review.mutateAsync({ dareId: dare.id, done: false });
          setConfirmNotDone(false);
        }}
        title="Mark as not done?"
        description={`${otherName} will be told, and this can't be changed.${reward ? ` No reward is paid.` : ''}`}
        confirmLabel="Not done"
        destructive
        loading={review.isPending}
      />
      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          await cancel.mutateAsync(dare.id);
          setConfirmCancel(false);
        }}
        title="Cancel this dare?"
        description={`${otherName} won't be able to accept it.`}
        confirmLabel="Cancel dare"
        cancelLabel="Keep it"
        destructive
        loading={cancel.isPending}
      />
    </>
  );
}

/** The one line shown when there's nothing for the viewer to tap. */
function quietLine(dare: Dare, state: DareState, role: DareRole, other: string, left: string | null): string {
  switch (state) {
    case 'awaiting_response':
      return role === 'creator' ? `Waiting for ${other} to respond${left ? ` · ${left} left` : ''}` : 'Waiting for a response';
    case 'in_progress':
      return role === 'creator' ? `${other} is on it${left ? ` · ${left} left` : ''}` : 'In progress';
    case 'awaiting_review':
      return role === 'doer' ? `Proof sent. Waiting for ${other} to check it.` : 'Proof submitted';
    case 'completed': {
      const when = shortDate(dare.completed_at);
      if (role === 'viewer') return `Completed${when ? ` · ${when}` : ''}`;
      if (rewardOwed(dare)) {
        if (dare.reward?.status === 'sent') return role === 'creator' ? `Waiting for ${other} to confirm ₹${dare.reward_amount} arrived` : `Completed${when ? ` · ${when}` : ''}`;
        if (role === 'creator' && !dare.payee_upi_ready) return `Waiting for ${other} to add a UPI ID`;
        if (role === 'doer') return `Completed. ${other} will pay you ₹${dare.reward_amount} over UPI.`;
        return `Completed${when ? ` · ${when}` : ''}`;
      }
      return dare.reward_amount && dare.reward?.status === 'received' ? `Completed · ₹${dare.reward_amount} paid` : `Completed${when ? ` · ${when}` : ''}`;
    }
    case 'not_completed':
      return dare.proof_url ? 'Marked not done' : "Time ran out before proof came in";
    case 'declined':
      return role === 'creator' ? `${other} passed on this one` : 'You passed on this one';
    case 'expired':
      return 'Nobody answered in time';
    case 'cancelled':
      return 'Cancelled';
    default:
      return STATE_LABEL[state];
  }
}
