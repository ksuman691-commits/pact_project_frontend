'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Flame,
  Home,
  ImageIcon,
  Inbox,
  Play,
  UserPlus,
  X,
} from 'lucide-react';
import DetailPageHeader from '@/components/DetailPageHeader';
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory';
import { useSmartBack } from '@/hooks/useSmartBack';
import FeedPactCard from '@/components/FeedPactCard';
import PactProgressRing, { getPactProgress } from '@/components/PactProgressRing';
import UserAvatarLink from '@/components/UserAvatarLink';
import CheerButton from '@/components/CheerButton';
import SponsoredCard from '@/components/SponsoredCard';
import ProofUploadModal from '@/components/ProofUploadModal';
import { useSponsor } from '@/hooks/useSponsor';
import PremiumJoinButton from '@/components/PremiumJoinButton';
import PactJoinRequestsModal from '@/components/PactJoinRequestsModal';
import { usePact, usePactProofs, usePactCheers } from '@/hooks/usePacts';
import { useSkipPact } from '@/hooks/usePactActions';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { hasPactMomentum, wasProofSubmittedToday } from '@/lib/pactMomentum';

function PactDetailSkeleton() {
  return (
    <div className="pact-flow min-h-screen pb-36">
      <div className="pact-shimmer aspect-[4/5] w-full" />
      <div className="mx-auto max-w-md space-y-6 px-4 pt-6">
        <div className="pact-card rounded-[28px] p-5">
          <div className="pact-shimmer h-4 w-32 rounded-full" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="pact-shimmer h-16 rounded-[24px]" />
            <div className="pact-shimmer h-16 rounded-[24px]" />
            <div className="pact-shimmer h-16 rounded-[24px]" />
          </div>
        </div>
        <div className="pact-card rounded-[28px] p-5">
          <div className="pact-shimmer h-4 w-40 rounded-full" />
          <div className="mt-4 space-y-3">
            <div className="pact-shimmer h-28 rounded-[24px]" />
            <div className="pact-shimmer h-28 rounded-[24px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [isJoiningPact, setIsJoiningPact] = useState(false);
  const [proofUploadOpen, setProofUploadOpen] = useState(false);
  // Which proof-wall tile is open in the full-screen viewer — an index into
  // `proofs`, not a proof id, since tapping any tile should always be able
  // to open its neighbors regardless of id gaps.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError, refetch: refetchPact } = usePact(pactId);
  const { data: proofsData, refetch: refetchProofs } = usePactProofs(pactId, 50);
  const { data: cheersData } = usePactCheers(pactId, 50);
  const skipMutation = useSkipPact();

  const pact = pactData?.data;
  const sponsor = useSponsor(pact?.category);
  // Undefined (don't seed yet) while still loading, since the pact's
  // circle_id — the real hierarchical parent — isn't known yet; seeding
  // too early with a placeholder would get permanently locked in by
  // useSeedBackHistory's de-dupe guard once the real value arrives.
  const pactFallbackHref = pact ? (pact.circle_id ? `/circles/${pact.circle_id}` : '/feed') : isLoading ? undefined : '/feed';
  useSeedBackHistory(pactFallbackHref);
  const handleBack = useSmartBack(pactFallbackHref || '/feed');
  // Most-recent-first regardless of what order the backend happens to
  // return proofs in — both the hero photo pick and the proof wall grid
  // below depend on this being reliably freshest-first.
  const proofs = useMemo(
    () =>
      (proofsData?.data || [])
        .map((proof: any) => ({
          id: proof.id,
          url: proof.proof_url || proof.file_url,
          type: proof.proof_type === 'video' ? 'video' : 'image',
          description: proof.caption || 'Proof submission',
          day: proof.day_number,
          uploadedAt: proof.uploaded_at || proof.created_at,
          uploader: pact?.creator_id === user?.id ? 'You' : pact?.creator_username || 'Pact member',
        }))
        .sort((a: any, b: any) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()),
    [pact?.creator_id, pact?.creator_username, proofsData?.data, user?.id]
  );

  const participants = useMemo(() => pact?.participants || [], [pact?.participants]);
  const isCreator = Boolean(user && pact?.creator_id === user.id);
  const progress = pact ? getPactProgress(pact) : null;
  const categoryTheme = getCategoryTheme(pact?.category);
  // Same "Uppercase, underscores → spaces" formatting FeedPactCard uses for
  // its category chip, so the hero's overlaid tag reads identically to
  // every other category label in the app rather than inventing a second
  // formatting rule.
  const categoryLabel = pact?.category
    ? String(pact.category).replace(/_/g, ' ').replace(/^./, (char: string) => char.toUpperCase())
    : null;
  const heroProof = proofs.find((proof: any) => proof.type === 'image') || proofs[0];

  // Deep-linked from a "so-and-so wants to join" notification
  // (?joinRequests=1) — opens the requests modal automatically once the
  // pact has loaded and confirmed the current user is the creator.
  useEffect(() => {
    if (!pact || !isCreator) return;
    if (searchParams.get('joinRequests') === '1') {
      setShowJoinRequestsModal(true);
    }
  }, [pact, isCreator, searchParams]);
  const isParticipant = Boolean(
    user && (isCreator || participants.some((participant: any) => participant.id === user.id || participant.user_id === user.id))
  );
  // UI-side gating only: hides the action for non-members/creators. The real
  // authorization must happen server-side once a backend-owned route exists
  // to enforce it — see BACKEND_HANDOFF_CHEER_DEDUP.md for the handoff spec.
  const canCheer = isParticipant && !isCreator;
  const cheers = useMemo(() => cheersData?.data || [], [cheersData?.data]);
  // UI-side guard only: the backend currently has no per-user-per-pact
  // uniqueness constraint on cheers (see BACKEND_HANDOFF_CHEER_DEDUP.md), so
  // this only stops honest double-taps from this client — it does not stop
  // a second device, a replayed request, or a modified client. Do not treat
  // this as the real fix.
  const hasCheered = Boolean(user && cheers.some((cheer: any) => cheer.sender_id === user.id));
  const canUploadToday = isParticipant && pact && !wasProofSubmittedToday(pact);

  const handleVote = async (_pactId: number, _vote: 'skip') => {
    await skipMutation.mutateAsync(pactId);
  };

  // Mirrors FeedPactCard's handleCopyShareLink (same clipboard-with-fallback
  // approach and the same private-visibility heads-up) so the Participants
  // "Invite others" nudge does something real rather than being purely
  // decorative.
  const handleInvite = async () => {
    const url = `${window.location.origin}/pacts/${pact.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (pact.visibility === 'private') {
        toast('Link copied — heads up, this pact is private so only people with access can open it', { icon: '🔒' });
      } else {
        toast.success('Invite link copied');
      }
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleJoinRequest = async () => {
    if (isJoiningPact || !pact?.can_join) return;
    setIsJoiningPact(true);
    try {
      await pactService.join(pactId);
      toast.success('Joined pact');
      // router.refresh() re-runs Server Components — a no-op here since
      // `pact` comes entirely from usePact's React Query cache, not an
      // RSC. That's why the button kept showing "Join": can_join/
      // is_joined_by_me/participants never actually updated, so a second
      // tap hit the backend's already-joined rejection. Refetching the
      // query this page actually reads is the real fix.
      await refetchPact();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
    } finally {
      setIsJoiningPact(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <DetailPageHeader title="Loading pact…" maxWidthClassName="max-w-md" />
        <PactDetailSkeleton />
      </>
    );
  }

  if (isError || !pact) {
    return (
      <>
        <DetailPageHeader title="Pact not found" backHref="/feed" maxWidthClassName="max-w-md" />
        <div className="pact-flow flex min-h-screen items-center justify-center px-4">
          <div className="pact-card max-w-sm rounded-[28px] p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
            <h2 className="mt-4 text-xl font-black text-[var(--pact-text)]">Pact not found</h2>
            <p className="mt-2 text-sm text-[var(--pact-text-muted)]">This pact could not be loaded or is no longer available.</p>
            <button
              onClick={() => router.push('/feed')}
              className="pact-btn-glow mt-6 rounded-full px-5 py-3 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-bg)' }}
            >
              Back to feed
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* pb-40: clears both the floating BottomNav AND the sticky "Upload
          today's proof" pill this page adds above it when canUploadToday. */}
      <div className="pact-flow min-h-screen pb-40">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
          {/* Hero: cover photo (freshest proof) or a category-colored
              placeholder when there's no proof yet, with the back/home
              chevrons overlaid on top of it and category + title overlaid
              at the bottom via a gradient scrim — replaces the old bare
              header bar + standalone progress ring that repeated this same
              information twice in two different, disconnected layouts. */}
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            {heroProof ? (
              <Image src={heroProof.url} alt="" fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ background: categoryTheme.gradient }}>
                <span className="text-6xl opacity-90">{categoryTheme.emoji}</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/feed')}
                aria-label="Go to feed"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
              >
                <Home className="h-5 w-5" />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
              {categoryLabel && (
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{categoryLabel}</p>
              )}
              <h1 className="mt-1 text-2xl font-black leading-tight text-white text-balance">{pact.title}</h1>
            </div>
          </div>

          <div className="mx-auto max-w-md space-y-6 px-4 pt-5">
            {/* Progress row: ring on the left, day count + days-left copy on
                the right — one fact stated once, not the ring's percentage
                and a separate "X of Y days" headline repeating each other. */}
            {progress && (
              <section className="pact-card flex items-center gap-4 rounded-[28px] p-5">
                <PactProgressRing
                  completed={progress.completed}
                  total={progress.total}
                  missed={progress.missed}
                  size={76}
                  strokeWidth={7}
                  momentum={hasPactMomentum(pact)}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-base font-black text-[var(--pact-text)]">
                    Day {progress.completed} of {progress.total}
                    {hasPactMomentum(pact) && <Flame className="h-4 w-4 text-[var(--pact-gold)]" />}
                  </p>
                  <p className="mt-1 text-sm text-[var(--pact-text-muted)]">{pact.timeRemaining || 'Ends soon'}</p>
                </div>
              </section>
            )}

            {/* Stat row: Members / Days done / Cheers — all three are real
                fields already loaded on this page (participants, the same
                progress.completed the ring above uses, and the cheers list
                fetched for the Cheer button below). No fabricated "group
                average" style stat that doesn't exist in the data. */}
            <section className="grid grid-cols-3 gap-3">
              <div className="pact-card rounded-[22px] px-3 py-4 text-center">
                <p className="text-xl font-black text-[var(--pact-text)]">{participants.length}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Members</p>
              </div>
              <div className="pact-card rounded-[22px] px-3 py-4 text-center">
                <p className="text-xl font-black text-[var(--pact-text)]">{progress ? progress.completed : 0}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Days done</p>
              </div>
              <div className="pact-card rounded-[22px] px-3 py-4 text-center">
                <p className="text-xl font-black text-[var(--pact-text)]">{cheers.length}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pact-text-faint)]">Cheers</p>
              </div>
            </section>

            {/* Avatar row: participant avatars + a real Invite action (same
                copy-link flow as FeedPactCard's share button). */}
            <section className="flex items-center justify-between gap-3">
              {participants.length > 0 ? (
                <div className="flex items-center -space-x-2">
                  {participants.slice(0, 6).map((participant: any, index: number) => (
                    <UserAvatarLink
                      key={participant.id || participant.user_id || participant.username}
                      name={participant.full_name || participant.name || participant.username}
                      avatarUrl={participant.avatar_url || participant.avatar}
                      username={participant.username}
                      size={34}
                      className={`border-2 border-[var(--pact-bg)] ${index === 0 ? '' : ''}`}
                    />
                  ))}
                  {participants.length > 6 && (
                    <span className="ml-3 text-xs font-bold text-[var(--pact-text-faint)]">+{participants.length - 6}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--pact-text-faint)]">No participants yet</p>
              )}
              <button
                type="button"
                onClick={() => void handleInvite()}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[var(--pact-hairline)] px-3.5 py-2 text-xs font-bold text-[var(--pact-text-dim)] transition hover:border-[var(--pact-violet)]/40 hover:text-[var(--pact-text)]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </button>
            </section>

            {pact.description && (
              <p className="text-sm leading-relaxed text-[var(--pact-text-muted)]">{pact.description}</p>
            )}

            {/* Proof wall: a grid of every proof photo/video for this pact,
                most recent first — reuses the same `proofs` list the hero
                and the "Days done" stat above already derive from, so the
                wall can never show a different set of photos than the rest
                of the page implies exists. */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pact-text-faint)]">Proof wall</h2>
              {proofs.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {proofs.map((proof: any, index: number) => (
                    <button
                      key={proof.id}
                      type="button"
                      onClick={() => setViewerIndex(index)}
                      className="relative aspect-square overflow-hidden rounded-xl bg-[var(--pact-surface-2)]"
                      aria-label={`Open proof from day ${proof.day ?? index + 1}`}
                    >
                      {proof.type === 'video' ? (
                        <>
                          <video src={proof.url} className="h-full w-full object-cover" muted playsInline />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="h-6 w-6 text-white" fill="white" />
                          </span>
                        </>
                      ) : (
                        <Image src={proof.url} alt="" fill sizes="150px" className="object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] py-10 text-[var(--pact-text-faint)]">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm font-semibold">No proof yet</span>
                </div>
              )}
            </section>

            {/* Secondary content: creator identity, cheer/comment/share
                actions, and the discover-match strip — the parts of
                FeedPactCard the hero above doesn't already cover. */}
            <section className="pact-card overflow-hidden rounded-[28px]">
              <FeedPactCard
                pact={{ ...pact, proofClips: proofs }}
                userVote={(pact as any).user_vote || (pact as any).userVote}
                onVote={handleVote}
                onProofUpload={async () => {
                  await Promise.all([refetchProofs(), refetchPact()]);
                }}
                dismissOnVote={false}
                showVoteActions={true}
                canUploadProof={isParticipant}
                detailHref={`/pacts/${pact.id}`}
                canReport={pact.creator_id !== user?.id}
                hasCheered={hasCheered}
                galleryProofs={proofs}
                galleryCheers={cheers}
                chromeless
                hideHeroAndTitle
              />

              <div className="border-t border-[var(--pact-hairline)] px-4 py-4">
                <div className="rounded-2xl border border-[var(--pact-hairline)] bg-[var(--pact-surface-2)] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pact-text-faint)]">Participants</p>
                    <span className="text-xs text-[var(--pact-text-faint)]">{participants.length}</span>
                  </div>
                  {participants.length > 0 ? (
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                      {participants.map((participant: any) => (
                        <UserAvatarLink
                          key={participant.id || participant.user_id || participant.username}
                          name={participant.full_name || participant.name || participant.username}
                          avatarUrl={participant.avatar_url || participant.avatar}
                          username={participant.username}
                          size={36}
                          className="shrink-0"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--pact-text-faint)]">No participant data yet.</p>
                  )}
                </div>
              </div>
            </section>

            {sponsor && <SponsoredCard sponsor={sponsor} />}

            {isCreator && (
              <button
                type="button"
                onClick={() => setShowJoinRequestsModal(true)}
                className="pact-card flex w-full items-center justify-between gap-3 rounded-[24px] px-5 py-4 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <Inbox className="h-5 w-5 text-[var(--pact-text-muted)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--pact-text)]">Join requests</p>
                    <p className="text-xs text-[var(--pact-text-muted)]">Review who&apos;s asked to join this pact.</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pact-text-faint)]">Manage</span>
              </button>
            )}

            {canCheer && (
              <div className="pact-card flex items-center justify-between gap-3 rounded-[24px] px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--pact-text)]">Cheer this pact on</p>
                  <p className="text-xs text-[var(--pact-text-muted)]">
                    {hasCheered
                      ? "You've already sent a cheer for this pact."
                      : `Post an encouragement photo for ${pact.creator_username || 'the creator'}.`}
                  </p>
                </div>
                <CheerButton pactId={pact.id} canCheer={canCheer} hasCheered={hasCheered} />
              </div>
            )}

            {!isParticipant && (
              <div className="pact-card rounded-[28px] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--pact-text-faint)]">Join this pact</p>
                {pact.can_join ? (
                  <>
                    <p className="mt-2 text-sm text-[var(--pact-text-muted)]">Join this pact to upload proof updates from the camera or your gallery.</p>
                    <div className="mt-4">
                      <PremiumJoinButton onClick={handleJoinRequest} loading={isJoiningPact} size="md" />
                    </div>
                  </>
                ) : pact.join_block_reason === 'already_joined' ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Joined
                  </span>
                ) : pact.join_block_reason === 'creator' ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                    <Crown className="h-3.5 w-3.5" />
                    Creator
                  </span>
                ) : (
                  <p className="mt-2 text-sm text-[var(--pact-text-muted)]">
                    {pact.join_block_reason === 'full'
                      ? 'This pact is full.'
                      : pact.join_block_reason === 'not_active'
                        ? 'This pact is no longer active.'
                        : "Joining isn't available right now."}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sticky "Upload today's proof" pill — floats above BottomNav (which
          is a centered ~76px-tall pill of its own, not an edge-to-edge bar)
          rather than overlapping it. Only rendered for a participant who
          hasn't already posted today; everyone else either isn't allowed to
          upload or already has, so there's nothing for this button to do. */}
      {canUploadToday && (
        <div className="fixed inset-x-0 z-30 flex justify-center px-6" style={{ bottom: 'calc(max(1.25rem, env(safe-area-inset-bottom)) + 84px)' }}>
          <button
            type="button"
            onClick={() => setProofUploadOpen(true)}
            className="pact-btn-glow flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-bg)' }}
          >
            <Camera className="h-4 w-4" />
            Upload today&apos;s proof
          </button>
        </div>
      )}

      <ProofUploadModal
        isOpen={proofUploadOpen}
        onClose={() => setProofUploadOpen(false)}
        pactId={pact.id}
        onUpload={async () => {
          await Promise.all([refetchProofs(), refetchPact()]);
        }}
      />

      {/* Full-screen proof-wall viewer — a plain image/video view with
          prev/next, not a second copy of PactGallery's swipe carousel
          (that one drives the feed hero + the "no proof yet" upload CTA;
          reusing it here for a simple tap-to-view grid would drag in state
          it doesn't need). */}
      {viewerIndex !== null && proofs[viewerIndex] && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-sm font-semibold text-white/80">
              {viewerIndex + 1} / {proofs.length}
            </p>
            <button
              type="button"
              onClick={() => setViewerIndex(null)}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            {proofs[viewerIndex].type === 'video' ? (
              <video src={proofs[viewerIndex].url} className="max-h-[70vh] w-full rounded-2xl" controls autoPlay playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary aspect ratio in a fixed-height viewer; next/image's fill needs a sized ancestor this modal doesn't have.
              <img src={proofs[viewerIndex].url} alt="" className="max-h-[70vh] w-full rounded-2xl object-contain" />
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-6">
            <button
              type="button"
              onClick={() => setViewerIndex((index) => Math.max(0, (index ?? 0) - 1))}
              disabled={viewerIndex === 0}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setViewerIndex((index) => Math.min(proofs.length - 1, (index ?? 0) + 1))}
              disabled={viewerIndex === proofs.length - 1}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isCreator && (
        <PactJoinRequestsModal
          pactId={pact.id}
          isOpen={showJoinRequestsModal}
          onClose={() => setShowJoinRequestsModal(false)}
          onRequestHandled={() => {
            void Promise.all([refetchPact()]);
          }}
        />
      )}
    </>
  );
}
