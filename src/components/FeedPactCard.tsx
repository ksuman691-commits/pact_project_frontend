'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Flag,
  MessageCircle,
  Share2,
  FileImage,
  ArrowLeft,
  Camera,
  PartyPopper,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import ProofUploadModal from './ProofUploadModal';
import CommentsBottomSheet from './CommentsBottomSheet';
import Avatar from './Avatar';
import UserAvatarLink from './UserAvatarLink';
import PremiumJoinButton from './PremiumJoinButton';
import GoalMatchStrip from './GoalMatchStrip';
import PactGallery, { buildGalleryTiles } from './PactGallery';
import ActivePactFireBadge from './ActivePactFireBadge';
import { useReportPact } from '@/hooks/usePactActions';
import { useCreateCheer } from '@/hooks/usePactMutations';
import { useGoalMatches } from '@/hooks/usePactMatches';
import { useAuthStore } from '@/store/auth';
import { getDisplayName } from '@/lib/displayName';
import { hasPactMomentum } from '@/lib/pactMomentum';
import { pactService } from '@/services/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Support (the old swipe-right vote-support action) has been removed —
// Cheer and Join now cover that ground, so "skip" is the only remaining
// vote direction. Swiping the hero ONLY pages through photos, and that
// paging is native CSS scroll-snap inside PactGallery — voting, cheering,
// and joining are button-only actions (see the action row below).
type VoteDirection = 'skip';

interface FeedPactCardProps {
  pact: any;
  userVote?: string | null;
  onVote?: (pactId: number, vote: VoteDirection) => Promise<void> | void;
  onDismiss?: (pactId: number) => void;
  onProofUpload?: (pactId: number, proof?: any) => void;
  detailHref?: string;
  dismissOnVote?: boolean;
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
  compact = false,
  mutedGlow = false,
  momentum = false,
}: {
  percent: number;
  elapsedDays: number;
  totalDays: number;
  gradientId: string;
  compact?: boolean;
  /**
   * The corner-badge ring's ambient glow was tuned against a busy photo
   * background, where a big soft blob reads as a halo. On the flat, dark
   * no-photo placeholder there's no texture to blend into, so the same
   * blob's contrast against solid black made it look like it was taking
   * over the card instead of sitting quietly in the corner. Shrinking the
   * spread/opacity/blur here (rather than for the photo case too) keeps the
   * glow readable as a small badge accent specifically on that background.
   */
  mutedGlow?: boolean;
  /**
   * Fuses a small fire dot onto this ring's bottom-right edge instead of a
   * second free-floating badge next to it (see hasPactMomentum in
   * src/lib/pactMomentum.ts). Callers should not also render
   * ActivePactFireBadge separately — this ring is the single corner badge.
   */
  momentum?: boolean;
}) {
  // Shrunk from 92 — with the fire signal now fused onto the ring itself
  // instead of sitting beside it as a second same-sized badge, the corner
  // no longer needs to reserve room for two elements, so the ring itself
  // can come down a size without anything feeling cramped.
  const size = compact ? 76 : 150;
  const center = size / 2;
  const radius = compact ? 39 : 60;
  const strokeWidth = compact ? 6 : 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className={`relative flex shrink-0 items-center justify-center ${compact ? 'h-[76px] w-[76px]' : 'h-[150px] w-[150px]'}`}>
      {/* Soft ambient glow behind the ring, on its own blurred layer rather
          than an SVG drop-shadow filter — a filter on the whole <svg>
          (as this used to be) shadows the flat circle fills too, which
          mostly just muddies the badge instead of reading as a glow. A
          dedicated pink/violet radial blob behind it, sized larger than
          the ring and blurred, is what actually produces a visible halo
          against the busy diagonal-stripe background. */}
      <div
        className={`pointer-events-none absolute rounded-full ${mutedGlow ? 'inset-[-8%] opacity-35 blur-md' : 'inset-[-30%] opacity-70 blur-xl'}`}
        style={{
          background: 'radial-gradient(circle, var(--pact-pink) 0%, var(--pact-violet) 55%, transparent 75%)',
        }}
      />
      <svg viewBox={`0 0 ${size} ${size}`} className={`relative h-full w-full -rotate-90 ${compact ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`} role="img" aria-label={`Day ${elapsedDays} of ${totalDays}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--pact-pink)" />
            <stop offset="100%" stopColor="var(--pact-violet)" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="rgba(15, 10, 30, 0.68)" stroke="rgba(255,255,255,0.18)" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {compact ? (
          <>
            <span className="text-[23px] font-black tracking-[-0.04em] text-[var(--pact-text)]" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>D{elapsedDays}</span>
            <span className="mt-1 text-[11px] font-bold text-[var(--pact-text-dim)]" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>of {totalDays}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-[var(--pact-text)]" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>{percent}%</span>
            <span className="mt-0.5 text-[10.5px] text-[var(--pact-text-faint)]">{elapsedDays}/{totalDays} days</span>
          </>
        )}
      </div>
      {momentum && (
        <div className="absolute" style={{ bottom: -size * 0.03, right: -size * 0.03 }}>
          <ActivePactFireBadge variant="fused" size={Math.max(16, Math.round(size * 0.32))} />
        </div>
      )}
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
  // The feed/detail list responses don't serialize a live comment count yet
  // (see BACKEND_SPEC_COMMENT_COUNT.md — the `Pact.comment_count` column
  // exists and is kept up to date server-side, it's just never included in
  // the response payload), so `commentCount` below is always 0 from list
  // data. Once the chat sheet has been opened at least once, CommentSection
  // reports back the real total from its own paginated query via this
  // callback, so the badge/label self-correct without a page reload.
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null);
  const [exitDirection, setExitDirection] = useState<VoteDirection | null>(null);
  const [isVoting, setIsVoting] = useState(false);
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
  // Local "have I joined" state, synced from the server flags below but also
  // flipped optimistically the moment a join succeeds — without this, the
  // Join button stayed rendered as "Join" after a successful join (nothing
  // ever re-derived joinAllowed/isParticipant, since both were computed
  // straight from the now-stale pact.can_join / pact.is_joined_by_me props,
  // and no refetch happens on this card), so a second tap hit the backend's
  // "already joined" rejection instead of being a no-op.
  const [displayJoined, setDisplayJoined] = useState(false);
  const cheerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExitDirection(null);
    setIsVoting(false);
    setActiveProofIndex(0);
    setMoreMenuOpen(false);
  }, [pact.id]);

  // canvas-confetti cleanup on unmount.
  useEffect(() => {
    return () => {
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

  // Re-sync from the server whenever fresh pact data actually arrives (e.g.
  // this card gets recycled to a different pact, or a parent list refetches
  // after this one's own optimistic update settles) — join_block_reason is
  // included as a second signal alongside is_joined_by_me since both
  // endpoints set it to 'already_joined' precisely when the viewer has
  // already joined, giving the same answer through an independent field.
  useEffect(() => {
    setDisplayJoined(Boolean(pact.is_joined_by_me) || pact.join_block_reason === 'already_joined');
  }, [pact.id, pact.is_joined_by_me, pact.join_block_reason]);

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
  const commentCount = liveCommentCount ?? Number(pact.comment_count ?? pact.comments?.length ?? 0);
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
  const activeProof = tiles[activeProofIndex] ?? tiles[0] ?? null;
  const isExiting = exitDirection !== null;
  const resolvedDetailHref = detailHref || `/pacts/${pact.id}`;
  // The feed-list endpoint (/api/pacts) never returns a participants array,
  // only an is_joined_by_me flag, unlike the pact detail endpoint. Fall back
  // to that flag here so membership-gated actions (e.g. proof upload) work
  // correctly on feed cards. displayJoined is OR'd in on top so a join that
  // just succeeded this render is reflected immediately, not just once the
  // participants array/is_joined_by_me flag catches up on a future refetch.
  const isParticipant = displayJoined || (Array.isArray(pact.participants)
    ? pact.participants.some((participant: any) => participant.id === user?.id || participant.user_id === user?.id)
    : Boolean(pact.is_joined_by_me));
  const isCreator = Boolean(
    user && (
      pact.creator_id === user.id ||
      pact.user_id === user.id ||
      (pact.creator_username && pact.creator_username === user.username)
    )
  );
  // Use the fuller isCreator check (also covers pact.user_id and
  // creator_username) rather than a bare pact.creator_id comparison —
  // otherwise a creator whose identity on this payload only resolves via
  // one of those other fields saw the passive "Proof photo" viewer empty
  // state instead of their own "Add today's proof photo" upload CTA.
  const uploadAllowed = canUploadProof ?? Boolean(isCreator || isParticipant);
  const joinAllowed = Boolean(pact.can_join) && !displayJoined;
  // Whether to render the button in its disabled "Joined" state instead of
  // hiding it — covers both "just joined this render" (displayJoined) and
  // "server already reported this pact as joined" (join_block_reason),
  // vs. every other block reason (creator, unauthenticated, pact not
  // active, etc.) where no button should render at all, same as before.
  const showJoinedState = displayJoined && (Boolean(pact.can_join) || pact.join_block_reason === 'already_joined');
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
  // Skip is a "should I join this?" decision for non-members only — once a
  // user has joined, there's nothing left to skip. Without the `!isParticipant`
  // guard here, a joined pact still showed a "Skip" button next to the
  // "Joined" badge (including on ended pacts, since join state and end state
  // are independent). The Joined badge alone is the source of truth for
  // status once a member; cheering remains available via the persistent
  // action-row cheer button below, so nothing is lost by hiding this row.
  const canSkip = Boolean(onVote) && !isCreator && !isParticipant && displayVote !== 'skip';
  const voteActionsVisible = (showVoteActions ?? Boolean(onVote)) && !isCreator && !isParticipant;

  // Voting/cheering/joining are button-only actions (see the action row
  // below) — photo paging is native scroll inside PactGallery, so the card
  // itself never tilts or shifts as the user swipes through photos. The
  // only transform the wrapper ever needs is the skip-vote dismiss
  // animation.
  const transformStyle = useMemo(() => {
    if (isExiting) {
      return { transform: 'translateX(-115%) rotate(-12deg)', opacity: 0, transition: 'transform 260ms ease, opacity 260ms ease' };
    }
    return { transform: 'translate3d(0, 0, 0)', transition: 'transform 240ms ease, opacity 240ms ease' };
  }, [isExiting]);

  const completeVote = async (direction: VoteDirection) => {
    if (!canSkip || !onVote || isVoting) return;
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
    } catch {
      setDisplayVote(previousVote);
      setIsVoting(false);
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

  // Single tap anywhere on the hero (image / progress ring / placeholder)
  // opens the pact detail, same as tapping the rest of the card. Photo
  // paging happens via native scroll-snap inside PactGallery, and browsers
  // already distinguish a scroll gesture from a tap before firing (or
  // suppressing) `click` — no manual drag-vs-tap bookkeeping needed here.
  const handleMediaTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement | null)?.closest('button,a')) return;

    if (isVoting || isExiting) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    handleCardNavigate();
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
    // showJoinedState (not just joinAllowed) also guards this — joinAllowed
    // alone flips false the instant displayJoined is set below, but that
    // update and the button re-render aren't perfectly synchronous, so this
    // is the actual belt-and-suspenders guard against a double-tap firing
    // the request twice.
    if (isJoining || !joinAllowed || showJoinedState) return;
    setIsJoining(true);
    try {
      await pactService.join(pact.id);
      // Flip local state immediately so the button reflects "Joined" (and
      // proof upload unlocks) right away — nothing here re-invalidates the
      // various list queries (feed/my-pacts/etc.) this card might be
      // rendered from, so without this the button silently reverted to
      // "Join" until a manual refresh, and a second tap then hit the
      // backend's "already joined" rejection instead of being a no-op.
      setDisplayJoined(true);
      const creatorName = creatorLabel || 'this creator';
      toast.success(`You joined ${creatorName}'s pact`);
      didCelebrateRef.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.68 },
        colors: ['#10b981', '#fbbf24', '#f472b6', '#8b5cf6'],
      });
    } catch (error: any) {
      // The join endpoint's rejection ("You cannot join this pact", 403) is
      // shared across every block reason — already joined, pact full,
      // creator, not active — so it can't be used to infer success here.
      // Genuinely-stale props (this card's pact.can_join was true, but the
      // server independently already has the viewer joined, e.g. a race
      // with another tab/device) are rare now that the button disables
      // itself the instant a join actually succeeds; when it does happen,
      // surface the real rejection rather than guessing at "already joined"
      // from an ambiguous message and risking masking a genuine failure
      // (e.g. the pact just filled up) as a false "Joined".
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
        {/* Hero: the single unified photo/cheer strip (proofs + cheers,
            natively swipeable via CSS scroll-snap inside PactGallery, or
            tap the dots), else a duration-progress ring, else the old
            empty-state placeholder. Swiping the hero ONLY pages through
            photos — voting, cheering, and joining are handled exclusively
            by the buttons in the action row below, so the same swipeable
            strip works here in the feed and, unchanged, on the pact detail
            page. */}
        <div
          className="relative isolate aspect-[4/5] w-full select-none"
          onClick={handleMediaTap}
          style={transformStyle}
        >
          {/* Story bars stay at the very top of the hero, driven by
              activeProofIndex, which PactGallery reports up from real
              scroll position — independent of the gallery's own DOM, so
              photo count/progress remains clear no matter how the user got
              there (swipe or tapping a dot). */}
          {tiles.length > 1 && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex gap-1">
              {tiles.map((tile, index) => (
                <span key={`story-${tile.kind}-${tile.id}`} className={`h-0.5 flex-1 rounded-full ${index === activeProofIndex ? 'bg-white' : 'bg-white/45'}`} />
              ))}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-3 top-7 z-20 flex items-start justify-between gap-3 text-white">
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/30 px-2 py-1.5 backdrop-blur-sm">
              <div className="pointer-events-auto flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                {creatorProfileHref ? <UserAvatarLink name={creatorLabel} avatarUrl={creatorAvatarUrl} username={creatorUsername} size={32} stopPropagation /> : <Avatar name={creatorLabel} avatarUrl={creatorAvatarUrl} size={32} />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{creatorLabel === 'You' ? 'You' : `@${creatorLabel}`}</p>
                {/* Duration ("N days left") used to repeat right next to the
                    ring badge, which already spells out the same day count
                    as "D{elapsedDays} of {totalDays}" — dropped here so it's
                    said once instead of twice in the same header row. When
                    there's no ring (pact missing start/end dates), fall back
                    to showing it here since it's the only place left. */}
                {!progressInfo && <p className="text-[10px] text-white/70">{timeRemaining}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Momentum (proof today, a clean streak, or a recent cheer —
                  see hasPactMomentum) now fuses onto the duration ring's own
                  bottom-right edge instead of sitting beside it as a second
                  badge — a single consolidated corner element. */}
              {progressInfo && <PactProgressRing percent={progressInfo.percent} elapsedDays={progressInfo.elapsedDays} totalDays={progressInfo.totalDays} gradientId={`hero-ring-gradient-${pact.id}`} compact mutedGlow={tiles.length === 0} momentum={hasPactMomentum(pact)} />}
              <div className="pointer-events-auto relative" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => setMoreMenuOpen((open) => !open)} aria-label="more options" aria-haspopup="menu" aria-expanded={moreMenuOpen} className="rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55"><MoreVertical className="h-4 w-4" /></button>
                {moreMenuOpen && <>
                  <button type="button" aria-label="close more options menu" onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                  <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] py-1.5 shadow-xl">
                    {uploadAllowed && <button type="button" role="menuitem" onClick={() => { setMoreMenuOpen(false); handleProofUploadClick(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[var(--pact-text)] transition hover:bg-white/5"><FileImage className="h-4 w-4" />Upload proof{proofCount > 0 && <span className="ml-auto text-xs text-[var(--pact-text-faint)]">{formatCompactCount(proofCount)}</span>}</button>}
                    {canReport && <button type="button" role="menuitem" onClick={() => { setMoreMenuOpen(false); setReportSheetOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-300 transition hover:bg-white/5"><Flag className="h-4 w-4" />Report pact</button>}
                  </div>
                </>}
              </div>
            </div>
          </div>

          {tiles.length > 0 ? (
            <PactGallery
              proofs={galleryProofs ?? proofs}
              cheers={galleryCheers ?? []}
              interactive={false}
              fillHeight
              dotsPosition="none"
              onActiveIndexChange={setActiveProofIndex}
            />
          ) : (
            /* Keep the proof area photo-forward even before the first upload.
               The progress ring is already the compact badge in the top-right
               overlay above; never render the old large standalone ring here.
               When the viewer can actually upload, this placeholder IS the
               empty-state CTA — rendered as a real <button> (not a bare div)
               so it lands inside handleMediaTap's existing
               closest('button,a') exclusion above and opens the upload
               modal directly instead of falling through to card navigation.
               Non-uploaders get the old inert div — nothing to tap into. */
          uploadAllowed ? (
            <button
              type="button"
              onClick={handleProofUploadClick}
              aria-label="Add today's proof photo"
              className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--pact-surface-2)] to-[var(--pact-surface-3)] text-left transition hover:brightness-110"
            >
              <div className="relative z-[1] flex flex-col items-center gap-3 px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pact-violet)]/12 text-[var(--pact-violet)]">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--pact-text-dim)]">Tap to add today&apos;s proof</p>
                  <p className="text-xs text-[var(--pact-text-faint)]">Opens your camera or gallery</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--pact-surface-2)] to-[var(--pact-surface-3)]">
              <div className="relative z-[1] flex flex-col items-center gap-3 px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pact-violet)]/12 text-[var(--pact-violet)]">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--pact-text-dim)]">No proof yet</p>
                </div>
              </div>
            </div>
          )
        )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-20 text-white">
            <h2 className="text-lg font-black leading-tight">{pact.title}</h2>
            {circleLabel && <p className="mt-1 text-xs font-medium text-white/75">{circleLabel}</p>}
          </div>

        </div>

        {/* Body: the photo carries the title/circle context; keep only a
            compact caption and the quiet secondary action row below it. */}
        <div className="px-4 py-3.5">
          {(activeProof?.description || media.caption) && (
            <p className="text-[13px] italic leading-relaxed text-[var(--pact-text-dim)]">
              &ldquo;{activeProof?.description || media.caption}&rdquo;
            </p>
          )}

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
              {/* Hide the count entirely at 0 rather than showing a bare
                  "0" next to the icon — a page full of "0"s next to every
                  icon reads as unused/dead, whereas an icon alone with no
                  number reads as neutral/not-yet-engaged. */}
              {cheerCount > 0 && (
                <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>
                  {formatCompactCount(cheerCount)}
                </span>
              )}
            </button>
            {cheerError && (
              <span role="status" className="text-xs text-rose-300" aria-live="polite">
                {cheerError}
              </span>
            )}

            <button
              type="button"
              onClick={() => setCommentSheetOpen(true)}
              aria-label="open chat"
              className="flex items-center gap-1.5 text-[var(--pact-text-dim)] transition hover:text-[var(--pact-violet)]"
            >
              <MessageCircle className="h-5 w-5" />
              {commentCount > 0 && (
                <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-pact-mono), monospace' }}>
                  {formatCompactCount(commentCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleCopyShareLink()}
              aria-label="share pact"
              className="flex items-center gap-1.5 text-[var(--pact-text-dim)] transition hover:text-[var(--pact-mint)]"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <div className="ml-auto flex items-center gap-2">
              {!isCreator && isParticipant && <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">Joined</span>}
              {isCreator && <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">Creator</span>}
              {(joinAllowed || showJoinedState) && (
                <PremiumJoinButton
                  onClick={handleJoinPact}
                  loading={isJoining}
                  disabled={showJoinedState}
                  label={showJoinedState ? 'Joined' : 'Join'}
                  size="sm"
                />
              )}
              {!joinAllowed && !showJoinedState && voteActionsVisible && canSkip && <button type="button" onClick={() => void completeVote('skip')} disabled={isVoting} className="inline-flex items-center gap-1 rounded-full border border-[var(--pact-hairline)] px-3 py-1.5 text-[11px] font-bold text-[var(--pact-text-dim)] transition hover:text-[var(--pact-text)] disabled:opacity-50"><ArrowLeft className="h-3 w-3" />Skip</button>}
            </div>
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

        {/* "View all N in chat" — opens the same chat sheet as the chat icon */}
        {commentCount > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setCommentSheetOpen(true);
            }}
            className="block w-full px-4 pb-3 text-left text-xs text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text-dim)]"
          >
            View all {formatCompactCount(commentCount)} in chat
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
        onCountChange={setLiveCommentCount}
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
