'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Camera, CheckCircle2, Crown, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import DetailPageHeader from '@/components/DetailPageHeader';
import FeedPactCard from '@/components/FeedPactCard';
import ProofsSection from '@/components/ProofsSection';
import UserAvatarLink from '@/components/UserAvatarLink';
import CheerButton from '@/components/CheerButton';
import CheerGallery from '@/components/CheerGallery';
import PremiumJoinButton from '@/components/PremiumJoinButton';
import PactJoinRequestsModal from '@/components/PactJoinRequestsModal';
import PactDetailCarousel, { type DetailCarouselPanel } from '@/components/PactDetailCarousel';
import { usePact, usePactProofs, usePactCheers } from '@/hooks/usePacts';
import { useSkipPact } from '@/hooks/usePactActions';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';

function PactDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 pb-16 pt-6">
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError, refetch: refetchPact } = usePact(pactId);
  const { data: proofsData, refetch: refetchProofs } = usePactProofs(pactId, 50);
  const { data: cheersData } = usePactCheers(pactId, 50);
  const skipMutation = useSkipPact();

  const pact = pactData?.data;
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

  const handleJoinRequest = async () => {
    try {
      await pactService.join(pactId);
      toast.success('Joined pact');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to join pact');
    }
  };

  const detailPanels: DetailCarouselPanel[] = pact
    ? [
        {
          key: 'proofs',
          label: 'Proofs',
          icon: Camera,
          count: proofs.length,
          content: (
            <>
              <ProofsSection proofs={proofs} title="Proof gallery" variant="immersive" />
              {cheers.length > 0 && (
                <div className="mt-6">
                  <CheerGallery cheers={cheers} />
                </div>
              )}
            </>
          ),
        },

      ]
    : [];

  if (isLoading) {
    return <PactDetailSkeleton />;
  }

  if (isError || !pact) {
    return (
      <div className="pact-flow min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
        <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-4 text-xl font-black">Pact not found</h2>
          <p className="mt-2 text-sm text-white/70">This pact could not be loaded or is no longer available.</p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-6 rounded-full bg-[#EDE9FE]0 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A78BFA]"
          >
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DetailPageHeader title={pact.title || 'Pact'} maxWidthClassName="max-w-md" />
      <div className="pact-flow min-h-screen bg-slate-950 pb-16 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="mx-auto max-w-md space-y-6 px-4"
        >
          <FeedPactCard
            pact={{ ...pact, proofClips: proofs }}
            userVote={(pact as any).user_vote || (pact as any).userVote}
            onVote={handleVote}
            onProofUpload={async () => {
              await Promise.all([refetchProofs(), refetchPact()]);
            }}
            dismissOnVote={false}
            enableGestures={true}
            showVoteActions={true}
            canUploadProof={isParticipant}
            detailHref={`/pacts/${pact.id}`}
            canReport={pact.creator_id !== user?.id}
            hasCheered={hasCheered}
          />

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

          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm">
            <div className="border-b border-white/10 px-4 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Pact detail</p>
                <span className="text-xs text-white/30">· swipe to browse</span>
              </div>
            </div>
            <PactDetailCarousel panels={detailPanels} activeIndex={activeIndex} onIndexChange={setActiveIndex} />
            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Participants</p>
                <span className="text-xs text-white/40">{participants.length}</span>
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
                <p className="mt-2 text-sm text-white/50">No participant data yet.</p>
              )}
            </div>
          </section>
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
