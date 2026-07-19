'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Flag, MessageCircle, Share2, FileImage, ArrowLeft, ArrowRight } from 'lucide-react';
import ProofUploadModal from './ProofUploadModal';
import ShareModal from './ShareModal';
import { useReportPact } from '@/hooks/usePactActions';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';
import toast from 'react-hot-toast';

type VoteDirection = 'support' | 'skip';
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
  if (!endDateRaw) return 'soon';

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) return 'soon';

  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return 'ended';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) return `${days}d ${hours}h`;
  if (totalHours > 0) return `${totalHours}h`;

  const minutes = Math.max(Math.floor(diffMs / (1000 * 60)), 1);
  return `${minutes}m`;
}

function formatCompactCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return `${count}`;
}

function getMedia(pact: any) {
  const firstClip = Array.isArray(pact.proofClips) && pact.proofClips.length > 0 ? pact.proofClips[0] : null;
  const proofUrl = pact.proof_url || firstClip?.url || firstClip?.file_url || '';
  const proofType = pact.proof_type || firstClip?.proof_type || firstClip?.type || 'photo';
  const caption = pact.latest_proof_caption || firstClip?.caption || firstClip?.text || '';

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
}: FeedPactCardProps) {
  const { user } = useAuthStore();
  const reportMutation = useReportPact(pact.id);
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
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
  const [displaySupportCount, setDisplaySupportCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setDragX(0);
    setDragY(0);
    setDragAxis(null);
    setIsDragging(false);
    setExitDirection(null);
    setIsVoting(false);
    setShowActionTag(false);
    committedRef.current = false;
  }, [pact.id]);

  useEffect(() => {
    const normalizedVote = userVote === 'believe' ? 'support' : userVote === 'doubt' ? 'skip' : userVote ?? null;
    setDisplayVote(normalizedVote);
  }, [userVote]);

  useEffect(() => {
    setDisplaySupportCount(Number(pact.support_count ?? pact.supportPool ?? 0));
  }, [pact.supportPool, pact.support_count]);

  const creatorLabel = pact.creator || pact.creator_username || 'creator';
  const creatorUsername = pact.creator_username || null;
  const creatorProfileHref = creatorUsername ? `/profile/${encodeURIComponent(creatorUsername)}` : null;
  const creatorAvatarUrl = pact.creatorAvatarUrl || pact.creator_avatar_url || null;
  const circleLabel = pact.circle || pact.circle_name || pact.category || null;
  const supportCount = displaySupportCount;
  const recentSupporters = Array.isArray(pact.recent_supporters) ? pact.recent_supporters : [];
  const proofCount = Number(pact.proof_count ?? pact.proofClips?.length ?? 0);
  const commentCount = Number(pact.comment_count ?? pact.comments?.length ?? 0);
  const timeRemaining = pact.timeRemaining || formatEndsIn(pact.end_date || pact.deadline);
  const media = useMemo(() => getMedia(pact), [pact]);
  const isExiting = exitDirection !== null;
  const resolvedDetailHref = detailHref || `/pacts/${pact.id}`;
  const isParticipant = Array.isArray(pact.participants)
    ? pact.participants.some((participant: any) => participant.id === user?.id || participant.user_id === user?.id)
    : false;
  const isCreator = Boolean(
    user && (
      pact.creator_id === user.id ||
      pact.user_id === user.id ||
      (pact.creator_username && pact.creator_username === user.username)
    )
  );
  const uploadAllowed = canUploadProof ?? Boolean(user && (pact.creator_id === user.id || isParticipant));
  const joinAllowed = Boolean(pact.can_join);
  const canVote = Boolean(onVote) && !isCreator && !displayVote;
  const gesturesEnabled = (enableGestures ?? Boolean(onVote)) && canVote;
  const voteActionsVisible = (showVoteActions ?? Boolean(onVote)) && !isCreator;
  const voteStatusLabel = displayVote === 'support' ? 'supported' : displayVote === 'skip' ? 'skipped' : null;

  const transformStyle = useMemo(() => {
    if (isExiting) {
      const exitX = exitDirection === 'support' ? '115%' : '-115%';
      return { transform: `translateX(${exitX}) rotate(${exitDirection === 'support' ? 12 : -12}deg)`, opacity: 0, transition: 'transform 260ms ease, opacity 260ms ease' };
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
    if (!canVote || !onVote || isVoting || committedRef.current) return;
    committedRef.current = true;
    setIsVoting(true);

    const previousVote = displayVote;
    setDisplayVote(direction);
    setDisplaySupportCount((currentCount) => {
      if (direction === 'support') {
        return previousVote === 'support' ? currentCount : currentCount + 1;
      }
      if (previousVote === 'support' && currentCount > 0) {
        return currentCount - 1;
      }
      return currentCount;
    });

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
      setDisplaySupportCount(Number(pact.support_count ?? pact.supportPool ?? 0));
      committedRef.current = false;
      setIsVoting(false);
      resetDrag();
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

      if (Math.abs(dx) >= 90) {
        void completeVote(dx > 0 ? 'support' : 'skip');
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled) return;
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;

    if (isVoting || isExiting) return;

    if (dragAxis === 'horizontal' && Math.abs(dragX) >= 90) {
      void completeVote(dragX > 0 ? 'support' : 'skip');
      return;
    }

    resetDrag();
  };

  const handleMediaTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;
    if (!gesturesEnabled || isVoting || isExiting) return;

    const now = Date.now();
    const tappedTwice = now - lastTapAt.current < 300;
    lastTapAt.current = now;

    if (tappedTwice) {
      void completeVote('support');
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

  const supporterStack = recentSupporters.slice(0, 3);

  return (
    <>
      <div className="mx-2 overflow-hidden rounded-[32px] border border-white/8 bg-slate-950 text-white shadow-[0_20px_70px_rgba(2,6,23,0.45)] sm:mx-0">
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
              void completeVote('support');
            }}
            onClick={handleMediaTap}
          >
            {media.hasMedia ? (
              media.proofType === 'video' ? (
                <video
                  src={media.proofUrl}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={media.proofUrl}
                  alt={media.caption || `${creatorLabel} proof`}
                  fill
                  priority={false}
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_35%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                  {creatorAvatarUrl ? (
                    <div className="absolute inset-0 scale-110 opacity-25 blur-[1px]">
                      <Image src={creatorAvatarUrl} alt={creatorLabel} fill sizes="100vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[120px] font-black text-white/10">
                      {creatorLabel.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-sm">
                      {creatorAvatarUrl ? (
                        <Image src={creatorAvatarUrl} alt={creatorLabel} fill sizes="112px" className="object-cover opacity-90" />
                      ) : (
                        <span className="text-5xl font-black text-white/80">{creatorLabel.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <p className="max-w-[240px] text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                      no proof uploaded yet — be the first
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/85" />

            <div className="absolute left-4 top-4 right-4 z-10 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 rounded-full bg-black/15 px-3 py-2 backdrop-blur-md">
                {creatorAvatarUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/20">
                    <Image src={creatorAvatarUrl} alt={creatorLabel} fill sizes="40px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white">
                    {creatorLabel.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {creatorProfileHref ? (
                      <Link href={creatorProfileHref} className="truncate text-sm font-bold text-white">
                        @{creatorLabel}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-bold text-white">@{creatorLabel}</p>
                    )}
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                      {circleLabel}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/70">
                    {pact.category || circleLabel}
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                ends in {timeRemaining}
              </div>
            </div>

            <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setProofUploadModal(true)}
                className="flex w-12 flex-col items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-3 text-white backdrop-blur-md transition hover:bg-black/40"
              >
                <FileImage className="h-4 w-4" />
                <span className="text-[10px] font-semibold">{formatCompactCount(proofCount)}</span>
              </button>

              <Link href={resolvedDetailHref} className="flex w-12 flex-col items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-3 text-white backdrop-blur-md transition hover:bg-black/40">
                <MessageCircle className="h-4 w-4" />
                <span className="text-[10px] font-semibold">{formatCompactCount(commentCount)}</span>
              </Link>

              <button
                type="button"
                onClick={() => setShareModal(true)}
                className="flex w-12 items-center justify-center rounded-full border border-white/10 bg-black/25 px-2 py-3 text-white backdrop-blur-md transition hover:bg-black/40"
                aria-label="share pact"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {canReport && (
                <button
                  type="button"
                  onClick={() => setReportSheetOpen(true)}
                  className="flex w-12 items-center justify-center rounded-full border border-red-400/70 bg-black/20 px-2 py-3 text-red-300 backdrop-blur-md transition hover:bg-red-500/10"
                  aria-label="report pact"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </div>

            {gesturesEnabled && dragAxis === 'horizontal' && showActionTag && !isExiting && (
              <div className="absolute inset-x-0 top-24 z-10 flex px-4">
                <div className={`rounded-full border px-4 py-1 text-xs font-black uppercase tracking-[0.25em] ${dragX > 0 ? 'ml-auto border-emerald-400 text-emerald-300' : 'mr-auto border-rose-400 text-rose-300'}`}>
                  {dragX > 0 ? 'support' : 'skip'}
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-4 pt-16">
              <div className="space-y-3 pr-16">
                <Link href={resolvedDetailHref} className="block">
                  <h2 className="max-w-[85%] text-3xl font-black leading-[1.02] tracking-tight text-white sm:text-4xl">
                    {pact.title}
                  </h2>
                </Link>

                <p className="text-lg font-black text-white">
                  {formatCompactCount(supportCount)} supporting this pact
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {supporterStack.length > 0 ? (
                      supporterStack.map((supporter: any) => (
                        <div key={supporter.id} className="relative h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/10">
                          {supporter.avatar_url ? (
                            <Image src={supporter.avatar_url} alt={supporter.username} fill sizes="36px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-black text-white">
                              {String(supporter.username || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex -space-x-2">
                        <div className="h-9 w-9 rounded-full border border-white/20 bg-white/12" />
                        <div className="h-9 w-9 rounded-full border border-white/20 bg-white/10" />
                        <div className="h-9 w-9 rounded-full border border-white/20 bg-white/8" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">
                    recent supporters
                  </p>
                </div>

                {joinAllowed && (
                  <button
                    type="button"
                    onClick={handleJoinPact}
                    disabled={isJoining}
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {isJoining ? 'joining...' : 'join pact'}
                  </button>
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
                    <p className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${voteStatusLabel === 'supported' ? 'border-emerald-400/70 bg-emerald-400/18 text-emerald-100' : 'border-rose-400/70 bg-rose-500/15 text-rose-200'}`}>
                      {voteStatusLabel}
                    </p>
                  </div>
                )}

                {voteActionsVisible && !voteStatusLabel && (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void completeVote('skip')}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${displayVote === 'skip' ? 'border-rose-400/70 bg-rose-500/15 text-rose-200' : 'border-white/12 bg-white/8 text-white hover:bg-white/12'}`}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      skip
                    </button>
                    <button
                      type="button"
                      onClick={() => void completeVote('support')}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${displayVote === 'support' ? 'border-emerald-400/70 bg-emerald-400/20 text-emerald-100' : 'border-emerald-400/50 bg-emerald-400/12 text-emerald-200 hover:bg-emerald-400/18'}`}
                    >
                      support
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {uploadAllowed && (
        <ProofUploadModal
          isOpen={proofUploadModal}
          onClose={() => setProofUploadModal(false)}
          pactId={pact.id}
          onUpload={(pactId, proof) => onProofUpload?.(pactId, proof)}
        />
      )}

      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        pact={pact}
      />

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
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-left transition hover:border-red-400/40 hover:bg-white/8"
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