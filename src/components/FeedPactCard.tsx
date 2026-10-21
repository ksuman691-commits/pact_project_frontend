'use client';

import TipButton from '@/components/tips/TipButton';
import LockedMedia from '@/components/private/LockedMedia';
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
  Check,
  Camera,
  Heart,
  MoreVertical,
  Flame,
  Play,
} from 'lucide-react';
import ProofUploadModal from './ProofUploadModal';
import CommentsBottomSheet from './CommentsBottomSheet';
import Avatar from './Avatar';
import UserAvatarLink from './UserAvatarLink';
import GoalMatchStrip from './GoalMatchStrip';
import PactGallery, { buildGalleryTiles } from './PactGallery';
import { useReportPact } from '@/hooks/usePactActions';
import { useGoalMatches } from '@/hooks/usePactMatches';
import { useAuthStore } from '@/store/auth';
import { usePactStoriesToday } from '@/hooks/useStories';
import { postedAgo } from '@/lib/stories';
import { getDisplayName } from '@/lib/displayName';
import { hasPactMomentum } from '@/lib/pactMomentum';
import { pactService, socialService } from '@/services/api';
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
  onAddMoment?: () => void;
  onJoined?: () => void | Promise<void>;
  onStartOwnVersion?: () => void;
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
   * The pact detail page renders its own dedicated hero (cover photo,
   * category/title overlay, progress ring) above this card, so showing the
   * carousel + category/title/caption/avatar-streak row here too would
   * duplicate that exact content a second time. When true, only the
   * creator row, action row (cheer/comment/share), and discover-match
   * strip render — the parts the detail page doesn't build itself.
   */
  hideHeroAndTitle?: boolean;
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
          // Was `?? index + 1`: recent_proofs is newest-first, so any proof
          // missing a real day_number (the upload flow didn't send one
          // until this was fixed — see ProofUploadModal) silently got
          // labeled "Day 1" regardless of which day it actually landed on.
          // Leaving it undefined instead falls through to PactGallery's
          // generic "Proof" tag — an honest unknown beats a fabricated,
          // often-wrong one.
          day: proof?.day_number ?? proof?.day ?? undefined,
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
        day: clip?.day ?? undefined,
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
    day: undefined,
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

/** "6:12 am" today, "Yesterday", otherwise "17 Oct". */
function formatPostedAt(raw?: string | null) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (dayDiff === 0) return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  if (dayDiff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** One segment per day for short pacts (10 days or fewer), a plain bar for longer ones. */
function DayBar({ day, total }: { day: number; total: number }) {
  const filled = Math.max(0, Math.min(total, day));
  if (total <= 10) {
    return (
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-[3px]" style={{ background: i < filled ? 'var(--navy)' : 'var(--hairline)' }} />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-[3px]" style={{ background: 'var(--hairline)' }} aria-hidden="true">
      <div className="h-full rounded-[3px]" style={{ width: `${Math.round((filled / total) * 100)}%`, background: 'var(--navy)' }} />
    </div>
  );
}

/** Small progress ring for the no-proof-yet strip. */
function MiniRing({ percent, label }: { percent: number; label: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--hairline)" strokeWidth="5" />
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--navy)" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-[var(--ink)]">{label}</span>
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
  onAddMoment,
  onJoined,
  onStartOwnVersion,
  canReport = true,
  hasCheered = false,
  chromeless = false,
  hideHeroAndTitle = false,
  galleryProofs,
  galleryCheers,
  }: FeedPactCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const reportMutation = useReportPact(pact.id);
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
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [isLikeBouncing, setIsLikeBouncing] = useState(false);
  const likeInFlightRef = useRef(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeProofIndex, setActiveProofIndex] = useState(0);
  // Local "have I joined" state, synced from the server flags below but also
  // flipped optimistically the moment a join succeeds — without this, the
  // Join button stayed rendered as "Join" after a successful join (nothing
  // ever re-derived joinAllowed/isParticipant, since both were computed
  // straight from the now-stale pact.can_join / pact.is_joined_by_me props,
  // and no refetch happens on this card), so a second tap hit the backend's
  // "already joined" rejection instead of being a no-op.
  const [displayJoined, setDisplayJoined] = useState(false);

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
    setLikeCount(Number(pact.like_count ?? 0));
    setLiked(Boolean(pact.is_liked_by_me));
  }, [pact.like_count, pact.is_liked_by_me, pact.id]);

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
  // Circle name only — NOT category. category is already shown as its own
  // label directly above the title; falling back to it here duplicated the
  // same text as a second line (e.g. "Startup" under "Startup · Save
  // ₹50,000 in 30 Days") for any pact that isn't scoped to a circle.
  const circleLabel = pact.circle || pact.circle_name || null;
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

  // Single top-right slot in the title row: personal progress ring for
  // members with valid duration dates, a plain status badge for members
  // without them (pact missing start/end dates), or a Join CTA for everyone
  // else who's allowed to join. Consolidates what used to be a corner-badge
  // ring on the photo PLUS a separate "Joined"/"Creator" badge down in the
  // action row into one place.
  const showRing = (isParticipant || isCreator) && Boolean(progressInfo);
  const showStatusBadgeOnly = (isParticipant || isCreator) && !progressInfo;
  const showJoinCta = !isParticipant && !isCreator && (joinAllowed || showJoinedState);
  const joinBlockMessage: Record<string, string> = {
    unauthenticated: 'Sign in to join this pact',
    not_active: 'Joining is closed',
    full: 'This pact is full',
  };
  // Pact category is a plain lowercase enum value ("fitness", "coding",
  // etc.) with no emoji/label mapping anywhere in the frontend today — just
  // capitalize it for display rather than inventing icons that don't exist
  // elsewhere in the app.
  const pactCategoryLabel = pact.category
    ? String(pact.category).replace(/_/g, ' ').replace(/^./, (char: string) => char.toUpperCase())
    : null;
  // Real avatars of people who've engaged with this pact (recent_supporters,
  // mapped from the backend's RecentSupporterResponse list on every pact
  // payload). Deliberately NOT presented as "who's in this pact" — no
  // caller of this card actually passes a real participants array (the pact
  // detail page fetches and renders its own separate Participants section
  // outside this component), so claiming membership here would be
  // fabricating data. See GoalMatchStrip's own comment for the same
  // "don't let these avatars get mistaken for participants" principle.
  const supporterAvatars = Array.isArray(pact.recent_supporters) ? pact.recent_supporters : [];
  // Header subline: circle and when the latest photo went up. Category is the
  // fallback for pacts that aren't scoped to a circle.
  const postedAt = formatPostedAt(activeProof?.uploadedAt);
  // No photo on the pact, but someone may have posted a video moment today.
  // Show the newest one as the card's media instead of an empty strip.
  const todayStories = usePactStoriesToday(Number(pact.id), tiles.length === 0 && !hideHeroAndTitle);
  const momentStory =
    tiles.length === 0 && Array.isArray(todayStories.data) && todayStories.data.length > 0
      ? todayStories.data[todayStories.data.length - 1]
      : null;
  const headerSub = momentStory
    ? [circleLabel, postedAgo(momentStory.created_at)].filter(Boolean).join(' · ')
    : [circleLabel, postedAt].filter(Boolean).join(' · ') || pactCategoryLabel;
  const dayNo = progressInfo ? Math.min(progressInfo.totalDays, Math.max(1, progressInfo.elapsedDays)) : 0;
  const showMomentum = showRing && hasPactMomentum(pact);
  // The Add moment pill replaces the old in-carousel "+ Add today" tile. With no
  // photo yet the dashed strip is the prompt, so the pill stays out of the way.
  const showAddPill = uploadAllowed && !hideHeroAndTitle && tiles.length > 0;

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

  // Like toggles instantly and reverts if the server rejects it. The ref
  // stops rapid double-taps from racing two requests for the same pact.
  const handleLikeTap = async () => {
    if (likeInFlightRef.current) return;
    likeInFlightRef.current = true;
    const wasLiked = liked;
    setLikeError(null);
    setLiked(!wasLiked);
    setLikeCount((count) => Math.max(0, count + (wasLiked ? -1 : 1)));
    if (!wasLiked) {
      setIsLikeBouncing(true);
      window.setTimeout(() => setIsLikeBouncing(false), 150);
    }
    try {
      const response: any = wasLiked ? await socialService.unlikePact(pact.id) : await socialService.likePact(pact.id);
      const server = response?.data;
      if (server && typeof server.like_count === 'number') {
        setLikeCount(server.like_count);
        setLiked(Boolean(server.liked));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
      setLikeError('Could not update your like. Try again.');
    } finally {
      likeInFlightRef.current = false;
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
      toast.error('Join this pact to share a moment');
      return;
    }
    if (onAddMoment) onAddMoment();
    else setProofUploadModal(true);
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
      await onJoined?.();
      const creatorName = creatorLabel || 'this creator';
      toast.success(`You joined ${creatorName}'s pact`);
      didCelebrateRef.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.68 },
        colors: ['#1F3A93', '#17181D', '#A29C8D', '#D9CFBA'],
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

  // Immersive layout: the photo IS the card. Header, title and actions float
  // on it. Cards without a photo (or the detail page, which renders its own
  // hero) fall back to a compact plain layout.
  // Private pact the viewer hasn't been let into: the server sent no media.
  const lockedForMe = !hideHeroAndTitle && Boolean(pact.media_locked) && pact.can_view_media === false;
  const immersive = !lockedForMe && !hideHeroAndTitle && (tiles.length > 0 || momentStory !== null);
  const momentAuthor = momentStory ? (user?.id != null && momentStory.user_id === user.id ? 'You' : momentStory.name || 'Member') : null;
  const likeLabelCount = likeCount > 0 ? formatCompactCount(likeCount) : null;
  const chatLabelCount = commentCount > 0 ? formatCompactCount(commentCount) : null;

  const kebab = (onPhoto: boolean) => (
    <div className="pointer-events-auto relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setMoreMenuOpen((open) => !open)}
        aria-label="more options"
        aria-haspopup="menu"
        aria-expanded={moreMenuOpen}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition ${onPhoto ? 'text-white drop-shadow' : 'text-[var(--muted)] hover:bg-[var(--card-muted)]'}`}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {moreMenuOpen && <>
        <button type="button" aria-label="close more options menu" onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-40 cursor-default" />
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface)] py-1.5 shadow-xl">
          {uploadAllowed && <button type="button" role="menuitem" onClick={() => { setMoreMenuOpen(false); handleProofUploadClick(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[var(--pact-text)] transition hover:bg-white/5"><FileImage className="h-4 w-4" />{onAddMoment ? 'Add a moment' : 'Upload proof'}{proofCount > 0 && <span className="ml-auto text-xs text-[var(--pact-text-faint)]">{formatCompactCount(proofCount)}</span>}</button>}
          {canReport && <button type="button" role="menuitem" onClick={() => { setMoreMenuOpen(false); setReportSheetOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[var(--warn-text)] transition hover:bg-white/5"><Flag className="h-4 w-4" />Report pact</button>}
        </div>
      </>}
    </div>
  );

  const identity = (onPhoto: boolean) => (
    <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2.5" onClick={(event) => event.stopPropagation()}>
      <span className={`inline-flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full ${onPhoto ? 'ring-2 ring-white/70' : ''}`}>
        {momentStory ? (
          <Avatar name={momentAuthor} avatarUrl={momentStory.avatar_url} size={34} />
        ) : creatorProfileHref ? (
          <UserAvatarLink name={creatorLabel} avatarUrl={creatorAvatarUrl} username={creatorUsername} size={34} stopPropagation />
        ) : (
          <Avatar name={creatorLabel} avatarUrl={creatorAvatarUrl} size={34} />
        )}
      </span>
      <div className="min-w-0" style={onPhoto ? { color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.45)' } : undefined}>
        <div className={`truncate text-[14.5px] font-bold ${onPhoto ? '' : 'text-[var(--ink)]'}`}>{momentStory ? momentAuthor : creatorLabel === 'You' ? 'You' : `@${creatorLabel}`}</div>
        {headerSub && <div className={`truncate text-[12px] ${onPhoto ? '' : 'text-[var(--muted)]'}`} style={onPhoto ? { opacity: 0.92 } : undefined}>{headerSub}</div>}
      </div>
    </div>
  );

  const actionBar = (floating: boolean) => (
    <div
      className={`flex items-center ${floating ? 'absolute inset-x-2.5 bottom-2.5 h-[50px] rounded-full pl-0.5 pr-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.25)]' : 'px-1 py-0.5'}`}
      style={floating ? { backgroundColor: 'rgba(251,248,241,0.96)' } : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => void handleLikeTap()}
        aria-label={liked ? 'unlike this pact' : 'like this pact'}
        aria-pressed={liked}
        className={`flex h-11 items-center gap-1.5 px-2.5 text-[14px] font-bold text-[var(--navy)] transition ${isLikeBouncing ? 'scale-110' : 'scale-100'}`}
        style={{ transitionDuration: '150ms' }}
      >
        <Heart className="h-6 w-6" strokeWidth={1.8} fill={liked ? 'var(--navy)' : 'none'} />
        {likeLabelCount}
      </button>
      <button type="button" onClick={() => setCommentSheetOpen(true)} aria-label="open chat" className="flex h-11 items-center gap-1.5 px-2.5 text-[14px] font-bold text-[var(--navy)] transition active:scale-95">
        <MessageCircle className="h-[23px] w-[23px]" strokeWidth={1.8} />
        {chatLabelCount}
      </button>
      <button type="button" onClick={() => void handleCopyShareLink()} aria-label="share pact" className="flex h-11 w-11 items-center justify-center text-[var(--navy)] transition active:scale-95">
        <Share2 className="h-[22px] w-[22px]" strokeWidth={1.8} />
      </button>
      {!isCreator && (
        <TipButton
          variant="row"
          creatorId={pact.creator_id ?? pact.user_id ?? pact.creator?.id}
          creatorName={pact.creator_full_name || creatorLabel}
          creatorAvatarUrl={creatorAvatarUrl}
          context={pact.title}
          count={Number(pact.tip_count ?? 0)}
          pactId={Number(pact.id)}
          tipsEnabled={typeof pact.creator_tips_enabled === 'boolean' ? pact.creator_tips_enabled : undefined}
        />
      )}
      <div className="ml-auto flex items-center">
        {showAddPill && (
          <button type="button" onClick={handleProofUploadClick} aria-label={onAddMoment ? 'Add a moment' : "Add today's proof photo"} className="group flex h-11 items-center">
            <span className="flex h-[34px] items-center gap-1.5 rounded-full bg-[var(--navy)] px-3.5 text-[13px] font-bold text-white transition group-hover:bg-[var(--navy-hover)] group-active:scale-95">
              <Camera className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Add moment
            </span>
          </button>
        )}
        {!showAddPill && showJoinCta && (
          <button type="button" onClick={handleJoinPact} disabled={showJoinedState || isJoining} aria-label={showJoinedState ? 'Joined' : 'Join pact'} className="group flex h-11 items-center">
            <span className={`flex h-[34px] items-center gap-1.5 rounded-full px-5 text-[13px] font-bold transition group-active:scale-95 ${showJoinedState ? 'border border-[var(--hairline)] bg-[var(--card-muted)] text-[var(--muted)]' : 'bg-[var(--navy)] text-white group-hover:bg-[var(--navy-hover)]'} ${isJoining ? 'opacity-70' : ''}`}>
              {showJoinedState && <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />}
              {showJoinedState ? 'Joined' : isJoining ? 'Joining…' : 'Join'}
            </span>
          </button>
        )}
        {!showAddPill && !showJoinCta && !joinAllowed && !showJoinedState && voteActionsVisible && canSkip && (
          <button type="button" onClick={() => void completeVote('skip')} disabled={isVoting} className="flex h-11 items-center px-3 text-[13px] font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-50">Skip</button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={handleCardNavigate}
        className={`${chromeless ? '' : 'pact-card'} group relative mx-2 cursor-pointer transition-colors hover:border-[var(--pact-violet)]/60 sm:mx-0 ${
          chromeless ? '' : 'rounded-[24px]'
        } ${moreMenuOpen ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        {lockedForMe ? (
          <>
            <div className="flex items-center gap-2.5 pb-2 pl-3.5 pr-0.5 pt-2">
              {identity(false)}
              {kebab(false)}
            </div>
            <div className="line-clamp-2 px-4 pb-2.5 text-[18px] font-extrabold leading-[1.2] tracking-[-0.02em]" style={{ color: 'var(--ink)' }}>{pact.title}</div>
            <div className="relative mx-3 overflow-hidden rounded-[18px]">
              <LockedMedia pact={pact} variant="card" />
            </div>
            {actionBar(false)}
          </>
        ) : immersive ? (
          /* The photo fills the card. Gradients are pointer-events-none so
             horizontal swipes reach PactGallery; tapping the photo opens the viewer. */
          <>
          <div className="relative w-full" onClick={handleMediaTap} style={transformStyle}>
            {tiles.length > 0 ? (
              <PactGallery
                proofs={galleryProofs ?? proofs}
                cheers={galleryCheers ?? []}
                interactive
                aspectClassName="aspect-[3/4]"
                dotsPosition="none"
                hideProofBadge
                onActiveIndexChange={setActiveProofIndex}
              />
            ) : (
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--ink)]">
                {/* First frame doubles as the thumbnail; muted so it never makes noise. */}
                <video src={`${momentStory!.video_url}#t=0.1`} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" />
                <span className="pointer-events-none absolute right-3 top-14 flex size-8 items-center justify-center rounded-full bg-black/55 text-white">
                  <Play className="size-4 fill-current" aria-hidden="true" />
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2.5 pl-3.5 pr-0.5 pt-2">
              {identity(true)}
              {kebab(true)}
            </div>

            <div className="pointer-events-none absolute inset-x-3.5 bottom-3.5" style={{ color: '#fff' }}>
              <div className="flex items-center gap-2">
                {showRing && progressInfo && (
                  <span className="rounded-[10px] px-2.5 py-0.5 text-[12px] font-extrabold" style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.28)' }}>
                    {showMomentum ? '🔥 ' : ''}Day {dayNo}
                  </span>
                )}
                {tiles.length > 1 && (
                  <span className="ml-auto text-[12px] font-bold" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{Math.min(activeProofIndex + 1, tiles.length)} / {tiles.length}</span>
                )}
              </div>
              <h2 className="mt-1.5 text-balance text-[21px] font-extrabold leading-[1.2] tracking-[-0.02em]" style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{pact.title}</h2>
            </div>

          </div>
            {actionBar(false)}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 pb-1 pl-3.5 pr-0.5 pt-2">
              {identity(false)}
              {kebab(false)}
            </div>
            {!hideHeroAndTitle && (
              <div className="px-3.5 pb-2" onClick={handleMediaTap} style={transformStyle}>
                {uploadAllowed ? (
                  <button
                    type="button"
                    onClick={handleProofUploadClick}
                    aria-label={onAddMoment ? 'Add a moment' : "Add today's proof photo"}
                    className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-[var(--seat-border)] bg-[var(--card-muted)] p-3.5 text-left transition active:scale-[0.99]"
                  >
                    {progressInfo ? <MiniRing percent={progressInfo.percent} label={`D${dayNo}`} /> : <Camera className="h-6 w-6 shrink-0 text-[var(--navy)]" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-[var(--ink)]">{pact.title}</span>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--muted)]">{onAddMoment ? 'No moment yet today' : 'Nothing posted today'}</span>
                    </span>
                    <Camera className="h-5 w-5 shrink-0 text-[var(--navy)]" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-[var(--seat-border)] bg-[var(--card-muted)] p-3.5">
                    {progressInfo ? <MiniRing percent={progressInfo.percent} label={`D${dayNo}`} /> : <Camera className="h-6 w-6 shrink-0 text-[var(--muted)]" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-[var(--ink)]">{pact.title}</span>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--muted)]">{onAddMoment ? 'No moment yet' : 'Nothing posted yet'}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
            {actionBar(false)}
          </>
        )}
        {likeError && (
          <div role="status" aria-live="polite" className="px-3.5 pb-2 pt-1 text-xs text-[var(--warn-text)]">
            {likeError}
          </div>
        )}

        {!isParticipant && !isCreator && onStartOwnVersion && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 pb-3 pt-2" onClick={(event) => event.stopPropagation()}>
            {!joinAllowed && <span className="text-[11px] text-[var(--pact-text-faint)]">{joinBlockMessage[pact.join_block_reason] || 'Joining is unavailable'}</span>}
            <button type="button" onClick={() => onStartOwnVersion()} className="text-[11px] font-semibold text-[var(--pact-text-dim)] underline underline-offset-2">Start my own version</button>
          </div>
        )}

        {/* Mutual-goal matching only where people are browsing for company
            (Discover). Kept off the main feed card to keep it quiet. */}
        {!isCreator && isPublicPact && (
          <div className="px-3 pb-2.5 pt-2">
            <GoalMatchStrip
              matches={goalMatches}
              totalCount={goalMatchesTotal}
              category={pact.category}
              variant="discover"
              onStartCircle={handleStartCircleWithMatches}
            />
          </div>
        )}
      </motion.div>

      {uploadAllowed && !onAddMoment && (
        <ProofUploadModal
          isOpen={proofUploadModal}
          onClose={() => setProofUploadModal(false)}
          pactId={pact.id}
          pactStartDate={pact.start_date || pact.created_at}
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

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[28px] border border-white/10 bg-[var(--ink)] text-white shadow-2xl">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="px-5 pb-5 pt-4">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-white/50">Report this pact</p>
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
                    className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4 text-left transition hover:border-[var(--line)] hover:bg-white/8"
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
