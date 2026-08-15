'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, Flag, MessageCircle, Share2, FileImage, ArrowLeft, ArrowRight, Camera, PartyPopper, Loader2 } from 'lucide-react';
import ProofUploadModal from './ProofUploadModal';
import ProofMediaCarousel from './ProofMediaCarousel';
import Avatar from './Avatar';
import UserAvatarLink from './UserAvatarLink';
import PremiumJoinButton from './PremiumJoinButton';
import { useReportPact } from '@/hooks/usePactActions';
import { useCreateCheer } from '@/hooks/usePactMutations';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';
import toast from 'react-hot-toast';

// Support (the old swipe-right vote-support action) has been removed —
// Cheer and Join now cover that ground, so "skip" is the only remaining
// vote direction. Swipe-right/double-tap is repurposed below to open the
// Cheer flow (participants) or the Join nudge (non-participants) instead.
type VoteDirection = 'skip';
type RightAction = 'cheer' | 'join' | null;
type DragAxis = 'horizontal' | 'vertical' | null;

interface FeedPactCardProps {
  pact: any;
  userVote?: string | null;
  onVote?: (pactId: number, vote: VoteDirection) => Promise<void> | void;
  onDismiss?: (pactId: number) => void;
  onProofUpload?: (pactId: number, proof?: any) => void;
  detailHref?: string;
  dismissOnVote?: boolean;
  enableGestures?: boolean;
  showVoteActions?: boolean;
  canUploadProof?: boolean;
  canReport?: boolean;
  /**
   * Pages that render their own dedicated cheer widget alongside this card
   * (e.g. the pact detail page) should pass this through so swipe-right's
   * cheer shortcut respects the same "already cheered" gate as that widget,
   * instead of offering a second way to double-post a cheer.
   */
  hasCheered?: boolean;
}

const REPORT_OPTIONS = [
  {
    value: 'fake_or_ai' as const,
    title: 'Fake or AI-generated',
    description: 'Looks synthetic, staged, or not genuinely created by the author.',
  },
  {
    value: 'spam' as const,
    title: 'Spam',
    description: 'Repeated, promotional, or irrelevant content that clutters the feed.',
  },
  {
    value: 'offensive' as const,
    title: 'Offensive',
    description: 'Contains harassment, hate, or other harmful content.',
  },
];

const JOIN_MESSAGES: Record<string, string> = {
  creator: 'You created this pact',
  already_joined: "You're already part of this pact",
  full: 'This pact is full',
  not_active: 'This pact is no longer active',
  no_access: "You don't have access to this pact",
  unauthenticated: 'Sign in to join this pact',
};

function formatEndsIn(endDateRaw?: string) {
  if (!endDateRaw) return 'Ends soon';

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) return 'Ends soon';

  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return 'Ends today';
  if (days <= 6) return `${days} day${days === 1 ? '' : 's'} left`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'} left`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'} left`;
}

function formatCompactCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
}

function getProofs(pact: any) {
  const clips = Array.isArray(pact.proofClips) ? pact.proofClips : [];
  const normalizedProofs = clips
    .map((clip: any, index: number) => {
      const url = clip?.url || clip?.file_url || clip?.fileUrl || '';
      if (!url) return null;
      const type = (clip?.proof_type || clip?.type || 'image').toString().toLowerCase();
      return {
        id: clip?.id ?? `${pact.id ?? 'proof'}-${index}`,
        url,
        type: type === 'video' ? 'video' : 'image',
        description: clip?.caption || clip?.text || clip?.description || '',
        uploadedAt: clip?.uploaded_at || clip?.created_at || null,
        uploader: clip?.uploader || clip?.username || null,
        day: clip?.day ?? index + 1,
      };
    })
    .filter(Boolean);

  if (normalizedProofs.length > 0) {
    return normalizedProofs;
  }

  const fallbackUrl = typeof pact.proof_url === 'string' && pact.proof_url.trim().length > 0 ? pact.proof_url : '';
  if (!fallbackUrl) return [];

  return [{
    id: pact.id ?? 'single-proof',
    url: fallbackUrl,
    type: (pact.proof_type || 'image').toString().toLowerCase() === 'video' ? 'video' : 'image',
    description: pact.latest_proof_caption || '',
    uploadedAt: pact.latest_proof_upload_date || null,
    uploader: pact.creator || pact.creator_username || null,
    day: 1,
  }];
}

function getMedia(pact: any) {
  const proofs = getProofs(pact);
  const firstProof = proofs[0];
  const proofUrl = firstProof?.url || '';
  const proofType = firstProof?.type || 'image';
  const caption = firstProof?.description || '';

  return {
    proofUrl,
    proofType,
    caption,
    hasMedia: typeof proofUrl === 'string' && proofUrl.trim().length > 0,
  };
}

export default function FeedPactCard({
  pact,
  userVote,
  onVote,
  onDismiss,
  onProofUpload,
  detailHref,
  dismissOnVote = true,
  enableGestures,
  showVoteActions,
  canUploadProof,
  canReport = true,
  hasCheered = false,
}: FeedPactCardProps) {
  const { user } = useAuthStore();
  const reportMutation = useReportPact(pact.id);
  const createCheer = useCreateCheer(pact.id);
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dragAxis, setDragAxis] = useState<DragAxis>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<VoteDirection | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showActionTag, setShowActionTag] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const lastTapAt = useRef(0);
  const committedRef = useRef(false);
  const [displayVote, setDisplayVote] = useState<string | null>(null);
  const [displayCheerCount, setDisplayCheerCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheering, setIsCheering] = useState(false);
  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const cheerInputRef = useRef<HTMLInputElement>(null);
  // Swipe-right on a pact the user hasn't joined slides up an inline
  // "Join to cheer this pact" prompt over the card, instead of a dead-end
  // gesture — membership is already known client-side, so this shows
  // immediately rather than waiting on a failed API call.
  const [showJoinNudge, setShowJoinNudge] = useState(false);

  useEffect(() => {
    setDragX(0);
    setDragY(0);
    setDragAxis(null);
    setIsDragging(false);
    setExitDirection(null);
    setIsVoting(false);
    setShowActionTag(false);
    committedRef.current = false;
    setActiveProofIndex(0);
    setShowJoinNudge(false);
  }, [pact.id]);

  useEffect(() => {
    setDisplayVote(userVote === 'doubt' ? 'skip' : userVote ?? null);
  }, [userVote]);

  useEffect(() => {
    setDisplayCheerCount(Number(pact.active_cheer_count ?? 0));
  }, [pact.active_cheer_count, pact.id]);

  const creatorLabel = pact.creator || pact.creator_username || 'creator';
  const creatorUsername = pact.creator_username || null;
  const creatorProfileHref = creatorUsername ? `/profile/${encodeURIComponent(creatorUsername)}` : null;
  const creatorAvatarUrl = pact.creatorAvatarUrl || pact.creator_avatar_url || null;
  const circleLabel = pact.circle || pact.circle_name || pact.category || null;
  const cheerCount = displayCheerCount;
  const proofCount = Number(pact.proof_count ?? pact.proofClips?.length ?? 0);
  const commentCount = Number(pact.comment_count ?? pact.comments?.length ?? 0);
  const timeRemaining = pact.timeRemaining || formatEndsIn(pact.end_date || pact.deadline);
  const proofs = useMemo(() => getProofs(pact), [pact]);
  const media = useMemo(() => getMedia(pact), [pact]);
  const hasProof = proofs.length > 0;
  const activeProof = proofs[activeProofIndex] ?? proofs[0] ?? null;
  const isExiting = exitDirection !== null;
  const resolvedDetailHref = detailHref || `/pacts/${pact.id}`;
  // The feed-list endpoint (/api/pacts) never returns a participants array,
  // only an is_joined_by_me flag, unlike the pact detail endpoint. Fall back
  // to that flag here so membership-gated actions (e.g. proof upload) work
  // correctly on feed cards.
  const isParticipant = Array.isArray(pact.participants)
    ? pact.participants.some((participant: any) => participant.id === user?.id || participant.user_id === user?.id)
    : Boolean(pact.is_joined_by_me);
  const isCreator = Boolean(
    user && (
      pact.creator_id === user.id ||
      pact.user_id === user.id ||
      (pact.creator_username && pact.creator_username === user.username)
    )
  );
  const uploadAllowed = canUploadProof ?? Boolean(user && (pact.creator_id === user.id || isParticipant));
  const joinAllowed = Boolean(pact.can_join);
  // Swipe-right (and its double-tap shortcut) now branches on membership
  // instead of performing a vote: participants get the fast single-photo
  // Cheer flow, non-participants get the Join nudge. Neither goes through
  // `onVote` or hits the backend to find out — membership is already known
  // client-side, so the join case can be shown immediately rather than
  // waiting on a failed request.
  const rightAction: RightAction = isCreator
    ? null
    : isParticipant
      ? (hasCheered ? null : 'cheer')
      : joinAllowed
        ? 'join'
        : null;
  const canSkip = Boolean(onVote) && !isCreator && displayVote !== 'skip';
  const gesturesEnabled = (enableGestures ?? true) && (canSkip || rightAction !== null);
  const voteActionsVisible = (showVoteActions ?? Boolean(onVote)) && !isCreator;
  const voteStatusLabel = displayVote === 'skip' ? 'skipped' : null;

  const transformStyle = useMemo(() => {
    if (isExiting) {
      // Only "skip" ever exits the card off-screen — cheering or getting
      // nudged to join both leave the card in place in the feed.
      return { transform: 'translateX(-115%) rotate(-12deg)', opacity: 0, transition: 'transform 260ms ease, opacity 260ms ease' };
    }

    if (isDragging) {
      const rotate = Math.max(Math.min(dragX / 18, 10), -10);
      return { transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotate}deg)`, transition: 'none' };
    }

    return { transform: 'translate3d(0, 0, 0)', transition: 'transform 240ms ease, opacity 240ms ease' };
  }, [dragX, dragY, exitDirection, isDragging, isExiting]);

  const resetDrag = () => {
    if (isExiting) return;
    setDragX(0);
    setDragY(0);
    setDragAxis(null);
    setIsDragging(false);
    setShowActionTag(false);
    committedRef.current = false;
  };

  const completeVote = async (direction: VoteDirection) => {
    if (!canSkip || !onVote || isVoting || committedRef.current) return;
    committedRef.current = true;
    setIsVoting(true);

    const previousVote = displayVote;
    setDisplayVote(direction);

    try {
      await onVote(pact.id, direction);
      if (dismissOnVote && onDismiss) {
        setExitDirection(direction);
        window.setTimeout(() => onDismiss(pact.id), 250);
        return;
      }

      setIsVoting(false);
      resetDrag();
    } catch {
      setDisplayVote(previousVote);
      committedRef.current = false;
      setIsVoting(false);
      resetDrag();
    }
  };

  // Snaps the card back to center without touching committedRef — used by
  // the cheer/join branch of the swipe-right gesture, which (unlike skip)
  // never exits/dismisses the card, so the drag visuals just need to reset.
  const snapBack = () => {
    setDragX(0);
    setDragY(0);
    setDragAxis(null);
    setIsDragging(false);
    setShowActionTag(false);
  };

  const triggerRightAction = () => {
    if (!rightAction || committedRef.current) return;
    committedRef.current = true;
    snapBack();
    if (rightAction === 'cheer') {
      cheerInputRef.current?.click();
    } else {
      setShowJoinNudge(true);
    }
  };

  const handleCheerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    committedRef.current = false;
    if (!file) return;

    setIsCheering(true);
    try {
      await createCheer.mutateAsync(file);
      setDisplayCheerCount((count) => count + 1);
    } catch {
      // useCreateCheer already surfaces a toast on failure.
    } finally {
      setIsCheering(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled) return;
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;
    if (isVoting || isExiting) return;
    activePointerId.current = event.pointerId;
    startPoint.current = { x: event.clientX, y: event.clientY };
    setDragAxis(null);
    setIsDragging(false);
    setShowActionTag(false);
    committedRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled) return;
    if (activePointerId.current !== event.pointerId || isVoting || isExiting) return;

    const dx = event.clientX - startPoint.current.x;
    const dy = event.clientY - startPoint.current.y;

    if (!dragAxis && Math.abs(dx) > 8 && Math.abs(dy) > 8) {
      const nextAxis: DragAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      setDragAxis(nextAxis);
      if (nextAxis === 'vertical') {
        return;
      }
    }

    if (dragAxis === 'vertical') {
      return;
    }

    if (dragAxis === 'horizontal' || Math.abs(dx) > 8) {
      setDragAxis('horizontal');
      setIsDragging(true);
      setDragX(dx);
      setDragY(0);
      setShowActionTag(Math.abs(dx) >= 40);

      if (dx <= -90 && canSkip) {
        void completeVote('skip');
      } else if (dx >= 90 && rightAction) {
        triggerRightAction();
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled) return;
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;

    if (isVoting || isExiting) return;

    if (dragAxis === 'horizontal' && Math.abs(dragX) >= 90) {
      if (dragX < 0 && canSkip) {
        void completeVote('skip');
        return;
      }
      if (dragX > 0 && rightAction) {
        triggerRightAction();
        return;
      }
    }

    resetDrag();
  };

  const handleMediaTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;
    if (!gesturesEnabled || isVoting || isExiting) return;

    const now = Date.now();
    const tappedTwice = now - lastTapAt.current < 300;
    lastTapAt.current = now;

    if (tappedTwice && rightAction) {
      triggerRightAction();
    }
  };

  const handleReport = async (reason: 'fake_or_ai' | 'spam' | 'offensive') => {
    try {
      await reportMutation.mutateAsync(reason);
      setReportSheetOpen(false);
    } catch {
      setReportSheetOpen(false);
    }
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}${resolvedDetailHref}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers/contexts without the Clipboard API.
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Pact visibility is enforced (or not) entirely by the backend when the
      // link is opened, not by anything on this button — warn the creator so
      // a "Just me"/private pact link isn't shared assuming it's locked down.
      if (pact.visibility === 'private') {
        toast('Link copied — heads up, this pact is private so only people with access can open it', { icon: '🔒' });
      } else {
        toast.success('Link copied');
      }
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleProofUploadClick = () => {
    if (!uploadAllowed) {
      toast.error('Join this pact to upload proof');
      return;
    }
    setProofUploadModal(true);
  };

  const handleJoinPact = async () => {
    if (isJoining || !joinAllowed) return;
    setIsJoining(true);
    try {
      await pactService.join(pact.id);
      toast.success('Joined pact');
      window.location.href = resolvedDetailHref;
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: '0 20px 70px rgba(2,6,23,0.45), 0 12px 28px rgba(139,107,255,0.25)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="mx-2 overflow-hidden rounded-[32px] border border-white/20 bg-slate-950 text-white shadow-[0_20px_70px_rgba(2,6,23,0.45)] sm:mx-0">
        <div
          className="relative isolate overflow-hidden rounded-[32px] touch-pan-y"
          style={transformStyle}
        >
          <div
            className="relative aspect-[4/5] min-h-[560px] w-full select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={resetDrag}
            onDoubleClick={(event) => {
              if ((event.target as HTMLElement | null)?.closest('button,a')) return;
              if (rightAction) triggerRightAction();
            }}
            onClick={handleMediaTap}
          >
            {media.hasMedia ? (
              <ProofMediaCarousel
                proofs={proofs}
                fallbackLabel={creatorLabel}
                fallbackAvatarUrl={creatorAvatarUrl}
                className="h-full w-full"
                onIndexChange={setActiveProofIndex}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#EDE9FE_0%,#C4B5FD_40%,#A78BFA_100%)]">
                <div className="relative h-full w-full overflow-hidden">
                  {/* Soft large letter watermark */}
                  <div className="absolute inset-0 flex items-center justify-center text-[140px] font-black text-violet-300/20 select-none">
                    {creatorLabel.charAt(0).toUpperCase()}
                  </div>
                  {/* Anchored to the upper portion of the media area so it never collides with the title/stats block pinned to the bottom */}
                  <div className="absolute inset-x-0 top-16 z-10 flex flex-col items-center gap-3 px-8 text-center">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/70 shadow-[0_8px_32px_rgba(139,92,246,0.20)] backdrop-blur-sm">
                      <Avatar name={creatorLabel} avatarUrl={creatorAvatarUrl} size={96} />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-4 w-4 text-violet-600" />
                      <p className="max-w-[220px] text-sm font-semibold uppercase tracking-[0.18em] text-violet-900">
                        {uploadAllowed ? 'no proof uploaded yet — be the first' : 'No proof uploaded yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasProof ? (
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/85" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-transparent to-violet-900/5" />
            )}

            <div className="absolute left-4 top-4 right-4 z-10 flex items-start justify-between gap-3">
              <div className={`flex items-center gap-3 rounded-full px-3 py-2 backdrop-blur-md ${hasProof ? 'bg-black/15' : 'bg-white/70 shadow-[0_2px_8px_rgba(139,92,246,0.12)]'}`}>
                <div className={`h-10 w-10 overflow-hidden rounded-full border ${hasProof ? 'border-white/20' : 'border-violet-200'}`}>
                  {creatorProfileHref ? (
                    <UserAvatarLink
                      name={creatorLabel}
                      avatarUrl={creatorAvatarUrl}
                      username={creatorUsername}
                      size={40}
                      stopPropagation
                    />
                  ) : (
                    <Avatar name={creatorLabel} avatarUrl={creatorAvatarUrl} size={40} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {creatorProfileHref ? (
                      <Link href={creatorProfileHref} className={`truncate text-sm font-bold ${hasProof ? 'text-white' : 'text-[#14121F]'}`}>
                        @{creatorLabel}
                      </Link>
                    ) : (
                      <p className={`truncate text-sm font-bold ${hasProof ? 'text-white' : 'text-[#14121F]'}`}>@{creatorLabel}</p>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${hasProof ? 'border border-white/20 bg-white/10 text-white/80' : 'bg-violet-100 text-violet-700'}`}>
                      {circleLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${hasProof ? 'border border-white/15 bg-black/20 text-white/90' : 'bg-white/70 text-[#14121F] shadow-[0_2px_8px_rgba(139,92,246,0.12)]'}`}>
                {timeRemaining}
              </div>
            </div>

            {/* z-20: must stay above the bottom title/caption overlay (z-10) below,
                which renders later in the DOM and would otherwise swallow clicks
                on these buttons in the overlapping bottom-right region. */}
            <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleProofUploadClick}
                className={`flex w-12 flex-col items-center gap-1 rounded-full px-2 py-3 backdrop-blur-md transition ${hasProof ? 'border border-white/10 bg-black/25 text-white hover:bg-black/40' : 'border border-violet-200/80 bg-white/80 text-violet-700 shadow-[0_2px_8px_rgba(139,92,246,0.12)] hover:bg-white'} ${uploadAllowed ? '' : 'opacity-60'}`}
              >
                <FileImage className="h-4 w-4" />
                <span className="text-[10px] font-semibold">{formatCompactCount(proofCount)}</span>
              </button>

              <Link
                href={resolvedDetailHref}
                className={`flex w-12 flex-col items-center gap-1 rounded-full px-2 py-3 backdrop-blur-md transition ${hasProof ? 'border border-white/10 bg-black/25 text-white hover:bg-black/40' : 'border border-violet-200/80 bg-white/80 text-violet-700 shadow-[0_2px_8px_rgba(139,92,246,0.12)] hover:bg-white'}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-[10px] font-semibold">{formatCompactCount(commentCount)}</span>
              </Link>

              {cheerCount > 0 && (
                <Link
                  href={resolvedDetailHref}
                  className="flex w-12 flex-col items-center gap-1 rounded-full border border-[var(--pact-gold)]/50 bg-[var(--pact-gold)]/15 px-2 py-3 text-[var(--pact-gold)] backdrop-blur-md transition hover:bg-[var(--pact-gold)]/25"
                  aria-label={`${cheerCount} cheers`}
                >
                  <PartyPopper className="h-4 w-4" />
                  <span className="text-[10px] font-semibold">{formatCompactCount(cheerCount)}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className={`flex w-12 items-center justify-center rounded-full px-2 py-3 backdrop-blur-md transition ${hasProof ? 'border border-white/10 bg-black/25 text-white hover:bg-black/40' : 'border border-violet-200/80 bg-white/80 text-violet-700 shadow-[0_2px_8px_rgba(139,92,246,0.12)] hover:bg-white'}`}
                aria-label="copy pact link"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {canReport && (
                <button
                  type="button"
                  onClick={() => setReportSheetOpen(true)}
                  className={`flex w-12 items-center justify-center rounded-full px-2 py-3 backdrop-blur-md transition ${hasProof ? 'border border-red-400/70 bg-black/25 text-red-300 hover:bg-black/40' : 'border border-red-300/70 bg-white/80 text-red-500 shadow-[0_2px_8px_rgba(139,92,246,0.12)] hover:bg-red-50'}`}
                  aria-label="report pact"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </div>

            {gesturesEnabled &&
              dragAxis === 'horizontal' &&
              showActionTag &&
              !isExiting &&
              (dragX < 0 ? canSkip : Boolean(rightAction)) && (
                <div className="absolute inset-x-0 top-24 z-10 flex px-4">
                  <div
                    className={`rounded-full border px-4 py-1 text-xs font-black uppercase tracking-[0.25em] ${
                      dragX > 0
                        ? `ml-auto ${rightAction === 'join' ? 'border-emerald-400 text-emerald-300' : 'border-[var(--pact-gold)] text-[var(--pact-gold)]'}`
                        : 'mr-auto border-rose-400 text-rose-300'
                    }`}
                  >
                    {dragX > 0 ? (rightAction === 'join' ? 'join' : 'cheer') : 'skip'}
                  </div>
                </div>
              )}

            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-4 pt-16">
              <div className="space-y-3 pr-16">
                <Link href={resolvedDetailHref} className="block">
                  <h2
                    className="max-w-[85%] text-3xl font-black leading-[1.02] tracking-tight text-white sm:text-4xl"
                    style={{ fontFamily: 'var(--font-pact-display), sans-serif' }}
                  >
                    {pact.title}
                  </h2>
                </Link>

                {activeProof && (
                  <div className="mb-3 rounded-[24px] border border-white/10 bg-black/20 px-3.5 py-2.5 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">
                          {activeProof.day ? `Day ${activeProof.day}` : 'latest proof'}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">
                          {activeProof.description || media.caption || 'Latest update'}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                        {activeProof.type === 'video' ? 'video' : 'photo'}
                      </span>
                    </div>
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-lg font-black text-white">
                  <PartyPopper className="h-4 w-4 text-[var(--pact-gold)]" />
                  {formatCompactCount(cheerCount)} cheering this pact
                </p>

                {joinAllowed && (
                  <PremiumJoinButton onClick={handleJoinPact} loading={isJoining} size="sm" />
                )}

                {!joinAllowed && pact.join_block_reason && (
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                    {JOIN_MESSAGES[pact.join_block_reason] ?? 'Joining is not available'}
                    {pact.join_block_reason === 'full' && pact.max_participants
                      ? ` — ${pact.max_participants}/${pact.max_participants} joined`
                      : ''}
                  </p>
                )}

                {voteStatusLabel && (
                  <div className="pt-2">
                    <p className="inline-flex items-center rounded-full border border-rose-400/70 bg-rose-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-200">
                      {voteStatusLabel}
                    </p>
                  </div>
                )}

                {voteActionsVisible && !voteStatusLabel && (
                  <div className="flex gap-2 pt-2">
                    {canSkip && (
                      <button
                        type="button"
                        onClick={() => void completeVote('skip')}
                        disabled={isVoting}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/8"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Skip
                      </button>
                    )}
                    {/*
                      Only render this pill for "cheer" — when rightAction is
                      "join" the bling PremiumJoinButton below the title is
                      already the join CTA, and rendering both put two
                      differently-styled "join" affordances on screen at
                      once. Swipe-right/double-tap still work either way:
                      they call triggerRightAction directly and don't depend
                      on this button being rendered.
                    */}
                    {rightAction === 'cheer' && (
                      <button
                        type="button"
                        onClick={triggerRightAction}
                        disabled={isCheering}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--pact-gold)]/50 bg-[var(--pact-gold)]/12 px-4 py-2 text-sm font-semibold text-[var(--pact-gold)] transition hover:bg-[var(--pact-gold)]/18 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCheering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'cheer'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Swipe-right on a pact the user hasn't joined used to bounce
                them out to a blocking "must be a participant" error toast —
                a dead end right when they showed positive intent. This
                slides up an inline join prompt over the card instead. */}
            <AnimatePresence>
              {showJoinNudge && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-slate-950/92 px-6 text-center backdrop-blur-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15">
                    <ArrowRight className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">Join to cheer this pact</p>
                    <p className="mt-1.5 text-sm text-white/65">
                      Only members can cheer — join {creatorLabel ? `@${creatorLabel}'s` : 'this'} pact to back it.
                    </p>
                  </div>
                  <PremiumJoinButton onClick={handleJoinPact} loading={isJoining} size="md" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinNudge(false);
                      committedRef.current = false;
                    }}
                    className="text-sm font-semibold text-white/50 transition hover:text-white/80"
                  >
                    Not now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Hidden file input backing the fast single-photo cheer flow
          triggered by swipe-right / double-tap / the cheer button. */}
      <input
        ref={cheerInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCheerFileChange}
      />

      {uploadAllowed && (
        <ProofUploadModal
          isOpen={proofUploadModal}
          onClose={() => setProofUploadModal(false)}
          pactId={pact.id}
          onUpload={(pactId, proof) => onProofUpload?.(pactId, proof)}
        />
      )}

      {reportSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm">
          <button
            type="button"
            aria-label="close report sheet"
            className="absolute inset-0 cursor-default"
            onClick={() => setReportSheetOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[28px] border border-white/10 bg-slate-950 text-white shadow-2xl">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="px-5 pb-5 pt-4">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">report this pact</p>
                  <h3 className="mt-2 text-2xl font-black">report this pact</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportSheetOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  close
                </button>
              </div>

              <div className="space-y-3">
                {REPORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => void handleReport(option.value)}
                    className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4 text-left transition hover:border-red-400/40 hover:bg-white/8"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{option.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-white/60">{option.description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
