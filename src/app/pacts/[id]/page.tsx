'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Crown, Inbox, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import DetailPageHeader from '@/components/DetailPageHeader';
import { useSeedBackHistory } from '@/hooks/useSeedBackHistory';
import FeedPactCard from '@/components/FeedPactCard';
import PactProgressRing, { getPactProgress } from '@/components/PactProgressRing';
import UserAvatarLink from '@/components/UserAvatarLink';
import CheerButton from '@/components/CheerButton';
import SponsoredCard from '@/components/SponsoredCard';
import { useSponsor } from '@/hooks/useSponsor';
import PremiumJoinButton from '@/components/PremiumJoinButton';
import PactJoinRequestsModal from '@/components/PactJoinRequestsModal';
import { usePact, usePactProofs, usePactCheers } from '@/hooks/usePacts';
import { useSkipPact } from '@/hooks/usePactActions';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';

function PactDetailSkeleton() {
  return (
    // pb-36: the earlier pb-24 pass just copied circles/[id]/page.tsx's
    // value without measuring the nav's actual footprint. Measured against
    // the real BottomNav (fixed pill + its own safe-area-aware bottom
    // padding), 96px of clearance leaves only ~20px of breathing room in a
    // best case (no iOS home-indicator inset) and goes negative once
    // env(safe-area-inset-bottom) is non-zero on a real device — which is
    // exactly the "still overlapping" repeat report. 144px (pb-36) matches
    // profile/page.tsx's clearance for the same reason: this page's last
    // section also sits directly against the bottom padding with no
    // trailing whitespace of its own.
    <div className="min-h-screen bg-slate-950 pb-36 pt-6">
      <div className="mx-auto max-w-md space-y-6 px-4">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.45)]">
          <div className="aspect-[4/5] animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="h-16 animate-pulse rounded-[24px] bg-white/10" />
            <div className="h-16 animate-pulse rounded-[24px] bg-white/10" />
            <div className="h-16 animate-pulse rounded-[24px] bg-white/10" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-28 animate-pulse rounded-[24px] bg-white/10" />
            <div className="h-28 animate-pulse rounded-[24px] bg-white/10" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-44 animate-pulse rounded-[24px] bg-white/10" />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-14 animate-pulse rounded-[24px] bg-white/10" />
            <div className="h-14 animate-pulse rounded-[24px] bg-white/10" />
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
  const proofs = useMemo(
    () =>
      (proofsData?.data || []).map((proof: any) => ({
        id: proof.id,
        url: proof.proof_url || proof.file_url,
        type: proof.proof_type === 'video' ? 'video' : 'image',
        description: proof.caption || 'Proof submission',
        day: proof.day_number,
        uploadedAt: proof.uploaded_at || proof.created_at,
        uploader: pact?.creator_id === user?.id ? 'You' : pact?.creator_username || 'Pact member',
      })),
    [pact?.creator_id, pact?.creator_username, proofsData?.data, user?.id]
  );

  const participants = useMemo(() => pact?.participants || [], [pact?.participants]);
  const isCreator = Boolean(user && pact?.creator_id === user.id);
  const progress = pact ? getPactProgress(pact) : null;

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
    try {
      await pactService.join(pactId);
      toast.success('Joined pact');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
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
        <div className="pact-flow min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
          <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
            <h2 className="mt-4 text-xl font-black text-white">Pact not found</h2>
            <p className="mt-2 text-sm text-white/70">This pact could not be loaded or is no longer available.</p>
            <button
              onClick={() => router.push('/feed')}
              className="mt-6 rounded-full bg-[#EDE9FE]0 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A78BFA]"
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
      <DetailPageHeader title={pact.title || 'Pact'} fallbackHref={pactFallbackHref || '/feed'} maxWidthClassName="max-w-md" />
      {/* pb-36 (not pb-24): the floating pill BottomNav sits fixed at the
          bottom of the viewport and was clipping/overlapping the last
          section here (the "Join requests" / MANAGE row, or the join CTA
          for non-participants). The prior pb-24 pass copied
          circles/[id]/page.tsx's clearance without measuring the nav's real
          height — it only nets ~20px of margin with no iOS safe-area inset,
          and disappears entirely once env(safe-area-inset-bottom) kicks in
          on a real device, which is why this kept coming back. Matches
          profile/page.tsx's pb-36 for the same "content ends right at the
          bottom, no natural trailing space" situation. */}
      <div className="pact-flow min-h-screen bg-slate-950 pb-36 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="mx-auto max-w-md space-y-6 px-4"
        >
          {progress && (
            <section className="flex flex-col items-center border-b border-[var(--pact-hairline)] pb-7 text-center">
              {/* Size reduced from 168 to 132, and the ring now leads with
                  the day count (percentage as its secondary line) so it
                  carries the "X of Y days" fact itself — removes the need
                  for the separate large headline that used to repeat the
                  same number right underneath it. */}
              <PactProgressRing completed={progress.completed} total={progress.total} missed={progress.missed} size={132} strokeWidth={9} emphasizeDays />
              <div className="mt-4 min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/50">Pact progress</p>
                <p className="mt-1 text-sm italic text-white/60">Keep the circle moving, one proof at a time.</p>
                {/* Red/danger styling only makes sense once there's an
                    actual miss — at 0 it was a warning color describing a
                    non-warning state ("Missed 0 days" in red reads as
                    alarming when nothing has actually gone wrong yet). */}
                <div className="mt-3 flex items-center gap-3 text-xs"><span className={`font-semibold ${progress.missed > 0 ? 'text-[var(--pact-danger)]' : 'text-emerald-400'}`}>{progress.missed > 0 ? `Missed ${progress.missed} ${progress.missed === 1 ? 'day' : 'days'}` : 'No missed days'}</span><span className="text-white/50">Next proof due today</span></div>
                {participants.length > 0 && (
                  <div className="mt-4 flex items-center pl-2">
                    {participants.slice(0, 5).map((participant: any, index: number) => <UserAvatarLink key={participant.id || participant.user_id || participant.username} name={participant.full_name || participant.name || participant.username} avatarUrl={participant.avatar_url || participant.avatar} username={participant.username} size={30} className={`-ml-2 border-2 border-[var(--pact-bg)] ${index === 0 ? 'ml-0' : ''}`} />)}
                    {participants.length > 5 && <span className="ml-2 text-xs font-bold text-white/50">+{participants.length - 5}</span>}
                  </div>
                )}
              </div>
            </section>
          )}
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm">
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
            />

            <div className="border-t border-white/10 px-4 py-4">
              {/* Card treatment matching the Discover match strip rendered
                  just above (inside FeedPactCard) — a rounded, bordered,
                  softly-backed box — so Participants doesn't read as bare
                  text floating on the outer card while Discover next to it
                  looks like a distinct, intentional element. */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Participants</p>
                  <span className="text-xs text-white/40">{participants.length}</span>
                </div>
                {participants.length > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                    {/* Turns the otherwise-empty rest of the row into a
                        nudge instead of dead space when the pact still has
                        few participants. Reuses the same copy-link share
                        action FeedPactCard's share button uses. */}
                    {participants.length < 3 && (
                      <button
                        type="button"
                        onClick={() => void handleInvite()}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-2 text-xs font-semibold text-white/50 transition hover:border-white/30 hover:text-white/75"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Invite others to join
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/50">No participant data yet.</p>
                )}
              </div>
            </div>
          </section>

          {sponsor && <SponsoredCard sponsor={sponsor} />}

          {isCreator && (
            <button
              type="button"
              onClick={() => setShowJoinRequestsModal(true)}
              className="flex w-full items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-left backdrop-blur-sm transition hover:bg-white/8"
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-white/70" />
                <div>
                  <p className="text-sm font-semibold text-white">Join requests</p>
                  <p className="text-xs text-white/60">Review who&apos;s asked to join this pact.</p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Manage</span>
            </button>
          )}

          {canCheer && (
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-sm font-semibold text-white">Cheer this pact on</p>
                <p className="text-xs text-white/60">
                  {hasCheered
                    ? "You've already sent a cheer for this pact."
                    : `Post an encouragement photo for ${pact.creator_username || 'the creator'}.`}
                </p>
              </div>
              <CheerButton pactId={pact.id} canCheer={canCheer} hasCheered={hasCheered} />
            </div>
          )}

          {!isParticipant && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Join this pact</p>
              {pact.can_join ? (
                <>
                  <p className="mt-2 text-sm text-white/75">Join this pact to upload proof updates from the camera or your gallery.</p>
                  <div className="mt-4">
                    <PremiumJoinButton onClick={handleJoinRequest} size="md" />
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
                <p className="mt-2 text-sm text-white/75">
                  {pact.join_block_reason === 'full'
                    ? 'This pact is full.'
                    : pact.join_block_reason === 'not_active'
                      ? 'This pact is no longer active.'
                      : "Joining isn't available right now."}
                </p>
              )}
            </div>
          )}


        </motion.div>
      </div>

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
