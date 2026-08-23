'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Flag,
  MessageCircle,
  Share2,
  FileImage,
  ArrowLeft,
  ArrowRight,
  Camera,
  PartyPopper,
  Loader2,
  MoreVertical,
  Check,
  Crown,
} from 'lucide-react';
import ProofUploadModal from './ProofUploadModal';
import CommentsBottomSheet from './CommentsBottomSheet';
import Avatar from './Avatar';
import UserAvatarLink from './UserAvatarLink';
import PremiumJoinButton from './PremiumJoinButton';
import GoalMatchStrip from './GoalMatchStrip';
import PactGallery, { buildGalleryTiles } from './PactGallery';
import { useReportPact } from '@/hooks/usePactActions';
import { useCreateCheer } from '@/hooks/usePactMutations';
import { useGoalMatches } from '@/hooks/usePactMatches';
import { useAuthStore } from '@/store/auth';
import { getDisplayName } from '@/lib/displayName';
import { pactService } from '@/services/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

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
  /** When nested in a detail-page shell, remove the card's outer chrome. */
  chromeless?: boolean;
  /**
   * Full proof/cheer lists fetched separately by the detail page (which has
   * more data than the compact feed embeds on the pact object). When
   * omitted, the card falls back to `pact.proofClips`/no cheers — same hero
   * strip either way, just a richer photo set on the detail page.
   */
  galleryProofs?: any[];
  galleryCheers?: any[];
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
  // Feed list responses only ever embedded a single latest proof
  // (`proof_url`), so the feed hero never had more than one photo to
  // swipe/page through — not a gesture bug, a data gap. `recent_proofs` is a
  // capped array the list endpoint can add (see
  // BACKEND_SPEC_FEED_GALLERY_PROOFS.md) with the same per-proof shape as
  // the detail page's `/pacts/{id}/proofs`; prefer it the moment it's
  // present, and fall back to the single-photo behavior below until then.
  const recentProofs = Array.isArray(pact.recent_proofs) ? pact.recent_proofs : [];
  if (recentProofs.length > 0) {
    const normalized = recentProofs
      .map((proof: any, index: number) => {
        const url = proof?.proof_url || proof?.url || proof?.file_url || '';
        if (!url) return null;
        const type = (proof?.proof_type || proof?.type || 'image').toString().toLowerCase();
        return {
          id: proof?.id ?? `${pact.id ?? 'proof'}-${index}`,
          url,
          type: type === 'video' ? 'video' : 'image',
          description: proof?.caption || proof?.description || '',
          uploadedAt: proof?.uploaded_at || proof?.created_at || null,
          uploader: proof?.uploader || proof?.username || null,
          day: proof?.day_number ?? proof?.day ?? index + 1,
        };
      })
      .filter(Boolean);
    if (normalized.length > 0) return normalized;
  }

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

/**
 * Days-elapsed-vs-pact-duration progress, used as the hero visual whenever
 * a pact has no proof photo yet. Falls back to null (rendering the older
 * avatar/camera placeholder instead) when the pact is missing the dates
 * needed to compute a meaningful percentage.
 */
function getDurationProgress(pact: any) {
  const startRaw = pact.start_date || pact.created_at;
  const endRaw = pact.end_date || pact.deadline;
  if (!startRaw || !endRaw) return null;

  const startMs = new Date(startRaw).getTime();
  const endMs = new Date(endRaw).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null;

  const totalDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((Date.now() - startMs) / (1000 * 60 * 60 * 24))));
  const percent = Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));

  return { percent, elapsedDays, totalDays };
}

/** Gradient-stroke circular progress ring — the hero visual for pacts with no proof photo yet. */
function PactProgressRing({
  percent,
  elapsedDays,
  totalDays,
  gradientId,
}: {
  percent: number;
  elapsedDays: number;
  totalDays: number;
  gradientId: string;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative flex h-[150px] w-[150px] items-center justify-center">
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="var(--pact-pink)" />
            <stop offset="100%" stopColor="var(--pact-violet)" />
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={9} />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold text-[var(--pact-text)]"
          style={{ fontFamily: 'var(--font-pact-mono), monospace' }}
        >
          {percent}%
        </span>
        <span className="mt-0.5 text-[10.5px] text-[var(--pact-text-faint)]">
          {elapsedDays}/{totalDays} days
        </span>
      </div>
    </div>
  );
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
  chromeless = false,
  galleryProofs,
  galleryCheers,
  }: FeedPactCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const reportMutation = useReportPact(pact.id);
  const createCheer = useCreateCheer(pact.id);
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
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
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedRef = useRef(false);
  // The hero carries pointer handlers (real drag tracking) AND onClick/
  // onDoubleClick (tap-to-open, double-tap-to-vote) on the SAME element.
  // Every browser fires a synthesized click on pointerup/touchend in
  // addition to the manual pointer events above — including right after a
  // real drag — so without this flag every swipe (paging photos or an
  // in-progress skip/cheer/join drag) was immediately followed by its own
  // "ghost tap": handleMediaTap/onDoubleClick ran their full tap logic a
  // moment later as if nothing but a tap had happened. Set true the instant
  // real movement is seen, checked (and left alone) by the click handlers
  // below, and only cleared on the next pointerdown — this is what actually
  // isolates "browsing photos" from "tapping/voting on the card", not the
  // page-vs-vote pixel thresholds those handlers separately use.
  const didDragRef = useRef(false);
  // Tracks whether this specific card fired the join confetti, so the
  // unmount cleanup below only resets the (shared, global) confetti canvas
  // when it's actually this card's own celebration still in flight.
  const didCelebrateRef = useRef(false);
  const [displayVote, setDisplayVote] = useState<string | null>(null);
  const [displayCheerCount, setDisplayCheerCount] = useState(0);
  const [optimisticCheer, setOptimisticCheer] = useState(false);
  const [cheerError, setCheerError] = useState<string | null>(null);
  const [isCheerBouncing, setIsCheerBouncing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheering, setIsCheering] = useState(false);
  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const cheerInputRef = useRef<HTMLInputElement>(null);
  // Kept for backwards-compatible rendering of any explicit join prompt
  // state; swipe-right now joins directly and no longer opens this nudge.
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
    setMoreMenuOpen(false);
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
  }, [pact.id]);

  // Guard against navigating after the card has unmounted (e.g. dismissed
  // via a vote) while a single-tap-to-open timer is still pending.
  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      // canvas-confetti's default confetti() call attaches one shared,
      // full-viewport canvas straight to document.body with its own
      // requestAnimationFrame loop — independent of this component's
      // lifecycle. If the user navigates away while the join celebration is
      // still animating (particles take a couple seconds to fully settle),
      // that canvas keeps rendering right on top of whatever screen they
      // land on next. reset() immediately halts the loop and removes the
      // canvas. Only calling it when THIS card actually fired the
      // celebration avoids one feed card's unmount (e.g. a virtualized list
      // recycling an off-screen card) from cutting off a different card's
      // still-playing celebration, since the canvas is shared globally.
      if (didCelebrateRef.current) {
        confetti.reset();
      }
    };
  }, []);

  useEffect(() => {
    setDisplayVote(userVote === 'doubt' ? 'skip' : userVote ?? null);
  }, [userVote]);

  useEffect(() => {
    setDisplayCheerCount(Number(pact.active_cheer_count ?? 0));
  }, [pact.active_cheer_count, pact.id]);

  const creatorLabel = getDisplayName(
    pact.creator_id ?? pact.user_id ?? pact.creator?.id,
    pact.creator || pact.creator_username || 'creator',
  );
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
  const progressInfo = useMemo(() => getDurationProgress(pact), [pact]);
  // Single source of truth for "what photos does this pact have" — the
  // detail page passes its separately-fetched proofs+cheers through
  // galleryProofs/galleryCheers; the compact feed card (no such fetch) falls
  // back to the proofs already embedded on the pact object. Either way this
  // is the ONLY tile list rendered — there is no second, separate gallery.
  const tiles = useMemo(
    () => buildGalleryTiles(galleryProofs ?? proofs, galleryCheers ?? []),
    [galleryProofs, galleryCheers, proofs],
  );
  const canPageMedia = tiles.length > 1;
  const activeProof = tiles[activeProofIndex] ?? tiles[0] ?? null;
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
  // Mutual-goal matching: same query for both placements below, just gated
  // on the pact actually having a category to match against. See
  // GoalMatchStrip / useGoalMatches / BACKEND_SPEC_MUTUAL_GOAL_MATCHING.md.
  const isPublicPact = Boolean(pact.is_public || pact.visibility === 'public');
  const goalMatchesQuery = useGoalMatches(pact.id, { enabled: Boolean(pact.category) });
  const goalMatches = goalMatchesQuery.data?.matches ?? [];
  const goalMatchesTotal = goalMatchesQuery.data?.total_count ?? 0;
  const handleStartCircleWithMatches = () => {
    const ids = goalMatches.map((match) => match.user_id).join(',');
    if (!ids) return;
    // Carry the shared goal context along too — without this, the circle
    // wizard has no idea why these people were grouped together and starts
    // from a blank slate. category seeds the vibe step (skipped entirely);
    // pactId lets the eventual "create a matching pact" prompt look up the
    // originating pact's duration as a bonus prefill.
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('circle-match-invitees', JSON.stringify(goalMatches));
    }
    const params = new URLSearchParams({ inviteUserId: ids, confirmInvites: '1' });
    if (pact.category) params.set('category', pact.category);
    params.set('pactId', String(pact.id));
    router.push(`/circles/create?${params.toString()}`);
  };
  // Swipe-right (and its double-tap shortcut) branches on membership instead
  // of performing a vote: participants get the Cheer flow, while a
  // non-participant joins immediately. The join action uses the same backend
  // endpoint as the explicit Join button, then celebrates in place so the
  // user stays in the feed and can continue browsing.
  const rightAction: RightAction = isCreator
    ? null
    : isParticipant
      ? (hasCheered ? null : 'cheer')
      : joinAllowed
        ? 'join'
        : null;
  // Skip is a "should I join this?" decision for non-members only — once a
  // user has joined, there's nothing left to skip. Without the `!isParticipant`
  // guard here, a joined pact still showed a "Skip" button next to the
  // "Joined" badge (including on ended pacts, since join state and end state
  // are independent). The Joined badge alone is the source of truth for
  // status once a member; cheering remains available via the persistent
  // action-row cheer button below, so nothing is lost by hiding this row.
  const canSkip = Boolean(onVote) && !isCreator && !isParticipant && displayVote !== 'skip';
  const gesturesEnabled = (enableGestures ?? true) && (canSkip || rightAction !== null);
  // Live per-pixel offset fed into PactGallery so the photo strip tracks the
  // finger in real time during a paging drag (Instagram-style) instead of
  // only jumping once the gesture commits on release.
  const isPagingDrag = isDragging && dragAxis === 'horizontal' && canPageMedia;
  const galleryDragOffsetPx = isPagingDrag ? dragX : 0;
  const voteActionsVisible = (showVoteActions ?? Boolean(onVote)) && !isCreator && !isParticipant;
  const voteStatusLabel = displayVote === 'skip' ? 'skipped' : null;

  const transformStyle = useMemo(() => {
    if (isExiting) {
      // Only "skip" ever exits the card off-screen — cheering or getting
      // nudged to join both leave the card in place in the feed.
      return { transform: 'translateX(-115%) rotate(-12deg)', opacity: 0, transition: 'transform 260ms ease, opacity 260ms ease' };
    }

    if (isDragging) {
      // The tilt AND the horizontal shift are both a vote-swipe affordance
      // (this whole card being flicked away to skip/cheer/join) — neither
      // has any business appearing while the drag is just flipping through
      // photos. When paging owns the gesture, the photo strip inside
      // PactGallery tracks the finger itself (via dragOffsetPx below); this
      // wrapper staying put avoids double-shifting the same drag twice, and
      // avoids revealing empty space next to the (stationary) strip.
      const rotate = canPageMedia ? 0 : Math.max(Math.min(dragX / 18, 10), -10);
      const translateX = canPageMedia ? 0 : dragX;
      return { transform: `translate3d(${translateX}px, ${dragY}px, 0) rotate(${rotate}deg)`, transition: 'none' };
    }

    return { transform: 'translate3d(0, 0, 0)', transition: 'transform 240ms ease, opacity 240ms ease' };
  }, [canPageMedia, dragX, dragY, exitDirection, isDragging, isExiting]);

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
      void handleJoinPact();
    }
  };

  const handleCheerTap = () => {
    if (isCheering || optimisticCheer) return;
    setCheerError(null);
    setOptimisticCheer(true);
    setDisplayCheerCount((count) => count + 1);
    setIsCheerBouncing(true);
    window.setTimeout(() => setIsCheerBouncing(false), 150);
    cheerInputRef.current?.click();
  };

  const handleCheerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    committedRef.current = false;
    if (!file) {
      setOptimisticCheer(false);
      setDisplayCheerCount((count) => Math.max(0, count - 1));
      return;
    }

    setIsCheering(true);
    try {
      await createCheer.mutateAsync(file);
      setOptimisticCheer(false);
    } catch {
      setOptimisticCheer(false);
      setDisplayCheerCount((count) => Math.max(0, count - 1));
      setCheerError('Could not send cheer. Try again.');
    } finally {
      setIsCheering(false);
    }
  };

  // Advances/retreats the active photo (wrapping, same as the old tap-zone
  // carousel) — shared by the drag gesture below.
  const pageMedia = (direction: 'next' | 'prev') => {
    if (!canPageMedia) return;
    setActiveProofIndex((index) => {
      if (direction === 'next') return index === tiles.length - 1 ? 0 : index + 1;
      return index === 0 ? tiles.length - 1 : index - 1;
    });
  };

  // A drag below the vote-commit threshold pages through photos instead of
  // doing nothing — this is what makes the hero's photo strip swipeable
  // directly in the feed, without stealing the gesture surface reserved for
  // the decisive skip/cheer/join swipe (which still wins once the drag
  // crosses MEDIA_PAGE_VOTE_THRESHOLD_PX below).
  const MEDIA_PAGE_THRESHOLD_PX = 40;
  const MEDIA_PAGE_VOTE_THRESHOLD_PX = 90;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled && !canPageMedia) return;
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;
    if (isVoting || isExiting) return;
    activePointerId.current = event.pointerId;
    startPoint.current = { x: event.clientX, y: event.clientY };
    didDragRef.current = false;
    setDragAxis(null);
    setIsDragging(false);
    setShowActionTag(false);
    committedRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled && !canPageMedia) return;
    // Once a gesture has committed (skip/cheer/join fired), the pointer is
    // very likely still down and still moving — without this check, this
    // handler kept re-entering on every subsequent move tick and re-set
    // isDragging/dragX from scratch, "reviving" the drag transform right
    // after triggerRightAction's snapBack() had just cleared it. That's what
    // produced the frozen, stuck-at-an-angle card: the reset only ever held
    // for a single frame before being overwritten by the next move event of
    // the same still-active gesture. isVoting already covers the skip/vote
    // path (completeVote sets it before its await), but the cheer/join path
    // never sets any flag this handler checks — committedRef is that flag.
    if (activePointerId.current !== event.pointerId || isVoting || isExiting || committedRef.current) return;

    const dx = event.clientX - startPoint.current.x;
    const dy = event.clientY - startPoint.current.y;

    // Same 8px sensitivity already used below to decide which axis this
    // gesture belongs to — anything past it is a real drag, on either axis,
    // and must never also be treated as a tap once the click fires.
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      didDragRef.current = true;
    }

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

      // Photo paging owns the horizontal drag entirely whenever there's more
      // than one photo to look through. Previously the vote/cheer/join swipe
      // could fire mid-drag (as soon as dx crossed the threshold, before the
      // finger even lifted) on TOP of an in-progress "flip through the
      // photos" gesture — a normal swipe easily travels past 90px before
      // release, so photo browsing on any un-joined pact kept getting
      // hijacked into a "Join to cheer this pact" overlay covering the
      // photos entirely (reported as an unwanted "Submit Proof"-style
      // prompt), and the feed never actually paged because the vote gesture
      // always won the race. Voting/cheering/joining remain fully available
      // via their dedicated buttons below the hero — only the ambiguous
      // drag shortcut is scoped to pacts with nothing to page through.
      // A rightward swipe is the explicit Join/Cheer gesture, even on cards
      // that also have multiple photos. Only a leftward drag remains available
      // for photo paging, so the right swipe cannot stop at a tilt and never
      // invoke the action.
      if (canPageMedia && dx < 0) {
        setShowActionTag(false);
        return;
      }

      setShowActionTag(gesturesEnabled && Math.abs(dx) >= MEDIA_PAGE_VOTE_THRESHOLD_PX);

      if (gesturesEnabled && dx <= -MEDIA_PAGE_VOTE_THRESHOLD_PX && canSkip) {
        void completeVote('skip');
      } else if (gesturesEnabled && dx >= MEDIA_PAGE_VOTE_THRESHOLD_PX && rightAction) {
        triggerRightAction();
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gesturesEnabled && !canPageMedia) return;
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;

    if (isVoting || isExiting) return;

    // Same defensive check as handlePointerMove above — if the gesture
    // already committed mid-drag, drag state was already reset by
    // snapBack()/resetDrag() and there's nothing left to do here.
    if (committedRef.current) {
      resetDrag();
      return;
    }

    if (!canPageMedia && dragAxis === 'horizontal' && gesturesEnabled && Math.abs(dragX) >= MEDIA_PAGE_VOTE_THRESHOLD_PX) {
      if (dragX < 0 && canSkip) {
        void completeVote('skip');
        return;
      }
      if (dragX > 0 && rightAction) {
        triggerRightAction();
        return;
      }
    }

    // Didn't cross the vote-commit threshold (or gestures are off entirely,
    // e.g. the pact detail page) — a confident-enough drag pages the photo
    // strip instead of just snapping back to center.
    if (dragAxis === 'horizontal' && canPageMedia && Math.abs(dragX) >= MEDIA_PAGE_THRESHOLD_PX) {
      pageMedia(dragX < 0 ? 'next' : 'prev');
      resetDrag();
      return;
    }

    resetDrag();
  };

  // Single tap anywhere on the hero (image / progress ring / placeholder)
  // opens the pact detail, same as tapping the rest of the card — it used to
  // always stopPropagation() and swallow the tap here, which made most of
  // the card's visible area dead to a single tap. A short delay lets a fast
  // follow-up tap still be caught below as the double-tap-to-cheer/join
  // gesture instead of navigating away immediately.
  const handleMediaTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;

    // This click is the browser's own ghost-tap follow-up to a real drag
    // (see didDragRef above), not an actual tap — swallow it before it can
    // navigate to the detail page or register as half of a double-tap vote.
    if (didDragRef.current) {
      event.stopPropagation();
      return;
    }

    if (isVoting || isExiting) {
      event.stopPropagation();
      return;
    }

    const now = Date.now();
    const tappedTwice = now - lastTapAt.current < 300;
    lastTapAt.current = now;
    event.stopPropagation();

    if (tappedTwice) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      if (gesturesEnabled && rightAction) {
        triggerRightAction();
      }
      return;
    }

    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      handleCardNavigate();
    }, 300);
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
      const creatorName = creatorLabel || 'this creator';
      toast.success(`You joined ${creatorName}'s pact`);
      didCelebrateRef.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.68 },
        colors: ['#10b981', '#fbbf24', '#f472b6', '#8b5cf6'],
      });
      setShowJoinNudge(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
    } finally {
      setIsJoining(false);
    }
  };

  // Card-wide navigation: everything outside the hero (header text, title,
  // description, and blank space) bubbles up to this. Avatar, overflow menu,
  // the hero itself, the action row, and "view all comments" each stop
  // propagation and handle their own tap instead — same pattern already used
  // for avatar links elsewhere in the app.
  const handleCardNavigate = () => {
    router.push(resolvedDetailHref);
  };

  // Unified action-row Cheer icon: unchanged from the existing Cheer feature.
  // Eligible members trigger the same fast single-photo flow as swipe-right /
  // double-tap; everyone else (creator, already-cheered, non-participants)
  // gets a "view cheers" tap-through to the detail page, matching the old
  // rail icon's passive count+link behavior.
  const handleCheerIconClick = () => {
    if (rightAction === 'cheer') {
      triggerRightAction();
    } else {
      router.push(resolvedDetailHref);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={handleCardNavigate}
        className={`${chromeless ? '' : 'pact-card'} group relative mx-2 cursor-pointer transition-colors hover:border-[var(--pact-violet)]/60 sm:mx-0 ${
          chromeless ? '' : 'rounded-[28px]'
        } ${moreMenuOpen ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        {/* Header row: avatar + creator name + category tag + time-left badge + overflow menu */}
        <div className="flex min-w-0 items-center gap-3 px-4 py-3">
          <div className="flex-shrink-0" onClick={(event) => event.stopPropagation()}>
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

          <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--pact-text)]">{creatorLabel === 'You' ? 'You' : `@${creatorLabel}`}</p>
            {circleLabel && (
              <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-[var(--pact-surface-3)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pact-text-dim)]">
                {circleLabel}
              </span>
            )}
          </div>

          <span
            className="max-w-[35%] shrink-0 truncate rounded-full bg-[var(--pact-surface-3)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--pact-gold)]"
            style={{ fontFamily: 'var(--font-pact-mono), monospace' }}
          >
            {timeRemaining}
          </span>

          <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((open) => !open)}
              aria-label="more options"
              aria-haspopup="menu"
              aria-expanded={moreMenuOpen}
              className="rounded-full p-1.5 text-[var(--pact-text-faint)] transition hover:bg-white/5 hover:text-[var(--pact-text)]"
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </button>

            {moreMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="close more options menu"
                  onClick={() => setMoreMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] py-1.5 shadow-[0_12px_28px_rgba(2,6,23,0.5)]"
                >
                  {uploadAllowed && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleProofUploadClick();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[var(--pact-text)] transition hover:bg-white/5"
                    >
                      <FileImage className="h-4 w-4" />
                      Upload proof
                      {proofCount > 0 && (
                        <span className="ml-auto text-xs text-[var(--pact-text-faint)]">{formatCompactCount(proofCount)}</span>
                      )}
                    </button>
                  )}
                  {canReport && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setReportSheetOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-300 transition hover:bg-white/5"
                    >
                      <Flag className="h-4 w-4" />
                      Report pact
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hero: the single unified photo/cheer strip (proofs + cheers, swipeable
            via drag or dots), else a duration-progress ring, else the old
            empty-state placeholder. Swipe-left (skip) / swipe-right (cheer or
            join) / double-tap-cheer share this surface with photo paging —
            a decisive swipe still wins the vote gesture; a shorter drag pages
            through photos instead, so the same swipeable strip works here in
            the feed and, unchanged, on the pact detail page. */}
        <div
          className="relative isolate aspect-[4/5] w-full select-none touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={resetDrag}
          onDoubleClick={(event) => {
            if ((event.target as HTMLElement | null)?.closest('button,a')) return;
            // Same ghost-event concern as handleMediaTap above — a real
            // drag must never also read as (half of) a double-tap vote.
            if (didDragRef.current) return;
            if (rightAction) triggerRightAction();
          }}
          onClick={handleMediaTap}
          style={transformStyle}
        >
          {tiles.length > 0 ? (
            <PactGallery
              proofs={galleryProofs ?? proofs}
              cheers={galleryCheers ?? []}
              interactive={false}
              fillHeight
              dotsPosition="overlay"
              activeIndex={activeProofIndex}
              onActiveIndexChange={setActiveProofIndex}
              dragOffsetPx={galleryDragOffsetPx}
              isDragging={isPagingDrag}
            />
          ) : progressInfo ? (
            <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,var(--pact-surface-3),var(--pact-surface-2))]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,79,135,0.18), transparent 55%)' }}
              />
              <PactProgressRing
                percent={progressInfo.percent}
                elapsedDays={progressInfo.elapsedDays}
                totalDays={progressInfo.totalDays}
                gradientId={`pact-ring-gradient-${pact.id}`}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#EDE9FE_0%,#C4B5FD_40%,#A78BFA_100%)]">
              <div className="relative h-full w-full overflow-hidden">
                {/* Soft large letter watermark */}
                <div className="absolute inset-0 flex items-center justify-center text-[140px] font-black text-violet-300/20 select-none">
                  {creatorLabel.charAt(0).toUpperCase()}
                </div>
                {/* Anchored to the upper portion of the media area so it never collides with content below */}
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

          {gesturesEnabled &&
            dragAxis === 'horizontal' &&
            showActionTag &&
            !isExiting &&
            (dragX < 0 ? canSkip : Boolean(rightAction)) && (
              <div className="absolute inset-x-0 top-6 z-10 flex px-4">
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

          {/* Swipe-right on a pact the user hasn't joined used to bounce
              them out to a blocking "must be a participant" error toast —
              a dead end right when they showed positive intent. This
              slides up an inline join prompt over the hero instead. */}
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
                  onClick={(event) => {
                    event.stopPropagation();
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

        {/* Body: title + description, then the join/cheer/skip CTAs, then the unified action row */}
        <div className="px-4 py-3.5">
          <h2
            className="text-lg font-black leading-snug text-[var(--pact-text)]"
            style={{ fontFamily: 'var(--font-pact-display), sans-serif' }}
          >
            {pact.title}
          </h2>

          {(activeProof?.description || media.caption) && (
            <p className="mt-1.5 text-[13px] italic leading-relaxed text-[var(--pact-text-dim)]">
              &ldquo;{activeProof?.description || media.caption}&rdquo;
            </p>
          )}

          <div className="mt-2.5 space-y-2" onClick={(event) => event.stopPropagation()}>
            <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--pact-text)]">
              <PartyPopper className="h-3.5 w-3.5 text-[var(--pact-gold)]" />
              {formatCompactCount(cheerCount)} cheering this pact
            </p>

            {!joinAllowed && pact.join_block_reason === 'already_joined' && (
              <span
                title="You're already part of this pact"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300"
              >
                <Check className="h-3.5 w-3.5" />
                Joined
              </span>
            )}

            {!joinAllowed && pact.join_block_reason === 'creator' && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  title="You created this pact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-300"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Creator
                </span>
                {uploadAllowed && (
                  <button
                    type="button"
                    onClick={handleProofUploadClick}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pact-violet)]/50 bg-[var(--pact-violet)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--pact-violet)] transition hover:bg-[var(--pact-violet)]/25"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    Submit Proof
                  </button>
                )}
              </div>
            )}

            {!joinAllowed && pact.join_block_reason && pact.join_block_reason !== 'already_joined' && pact.join_block_reason !== 'creator' && (
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--pact-text-faint)]">
                {JOIN_MESSAGES[pact.join_block_reason] ?? 'Joining is not available'}
                {pact.join_block_reason === 'full' && pact.max_participants
                  ? ` — ${pact.max_participants}/${pact.max_participants} joined`
                  : ''}
              </p>
            )}

            {voteStatusLabel && (
              <p className="inline-flex items-center rounded-full border border-rose-400/70 bg-rose-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-200">
                {voteStatusLabel}
              </p>
            )}

            {!voteStatusLabel && (voteActionsVisible || joinAllowed) && (
              <div className="flex items-center gap-2">
                {voteActionsVisible && canSkip && (
                  <button
                    type="button"
                    onClick={() => void completeVote('skip')}
                    disabled={isVoting}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--pact-hairline)] bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--pact-text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Skip
                  </button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {joinAllowed && <PremiumJoinButton onClick={handleJoinPact} loading={isJoining} size="sm" />}
                  {!joinAllowed && voteActionsVisible && rightAction === 'cheer' && (
                    <button
                      type="button"
                      onClick={triggerRightAction}
                      disabled={isCheering}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--pact-gold)]/50 bg-[var(--pact-gold)]/12 px-4 py-2 text-sm font-semibold text-[var(--pact-gold)] transition hover:bg-[var(--pact-gold)]/18 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCheering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cheer'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified action row: same stroke-icon size/style for all three, muted at rest, accented only on hover/active */}
          <div className="mt-3 flex items-center gap-6" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={handleCheerTap}
              disabled={isCheering || optimisticCheer}
              aria-label="cheer this pact"
              className={`flex items-center gap-1.5 text-[var(--pact-text-dim)] transition hover:text-[var(--pact-gold)] disabled:opacity-60 ${isCheerBouncing ? 'scale-125' : 'scale-100'}`}
              style={{ transitionDuration: '150ms' }}
            >
              {isCheering ? <Loader2 className="h-5 w-5 animate-spin" /> : <PartyPopper className={`h-5 w-5 ${optimisticCheer ? 'text-[var(--pact-gold)]' : ''}`} />}
              <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>
                {formatCompactCount(cheerCount)}
              </span>
            </button>
            {cheerError && (
              <span role="status" className="text-xs text-rose-300" aria-live="polite">
                {cheerError}
              </span>
            )}

            <button
              type="button"
              onClick={() => setCommentSheetOpen(true)}
              aria-label="view comments"
              className="flex items-center gap-1.5 text-[var(--pact-text-dim)] transition hover:text-[var(--pact-violet)]"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>
                {formatCompactCount(commentCount)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyShareLink()}
              aria-label="share pact"
              className="flex items-center gap-1.5 text-[var(--pact-text-dim)] transition hover:text-[var(--pact-mint)]"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Placement A: this is the viewer's own pact — surface who else
              shares the same goal category, right below the action row. */}
          {isCreator && (
            <GoalMatchStrip
              matches={goalMatches}
              totalCount={goalMatchesTotal}
              category={pact.category}
              variant="feed"
              onStartCircle={handleStartCircleWithMatches}
            />
          )}

          {!isCreator && isPublicPact && (
            <GoalMatchStrip
              matches={goalMatches}
              totalCount={goalMatchesTotal}
              category={pact.category}
              variant="discover"
              onStartCircle={handleStartCircleWithMatches}
            />
          )}

        </div>

        {/* "View all N comments" — opens the same comment sheet as the comment icon */}
        {commentCount > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setCommentSheetOpen(true);
            }}
            className="block w-full px-4 pb-3 text-left text-xs text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text-dim)]"
          >
            View all {formatCompactCount(commentCount)} comments
          </button>
        )}
      </motion.div>

      {/* Hidden file input backing the fast single-photo cheer flow
          triggered by swipe-right / double-tap / the cheer icon. */}
      <input
        ref={cheerInputRef}
        type="file"
        accept="image/*"
        capture="user"
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

      <CommentsBottomSheet
        pactId={pact.id}
        commentCount={commentCount}
        isOpen={commentSheetOpen}
        onClose={() => setCommentSheetOpen(false)}
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">Report this pact</p>
                  <h3 className="mt-2 text-2xl font-black">Report this pact</h3>
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
