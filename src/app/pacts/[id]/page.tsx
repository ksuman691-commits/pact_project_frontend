'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Camera, CheckCircle2, Clock3, MessageSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import TopNav from '@/components/TopNav';
import FeedPactCard from '@/components/FeedPactCard';
import ProofsSection from '@/components/ProofsSection';
import CommentSection from '@/components/CommentSection';
import VerificationResults from '@/components/VerificationResults';
import { usePact, usePactProofs } from '@/hooks/usePacts';
import { useSkipPact, useSupportPact } from '@/hooks/usePactActions';
import { useAuthStore } from '@/store/auth';
import { joinRequestService, pactService } from '@/services/api';

function PactDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 pb-16 pt-24">
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
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-44 animate-pulse rounded-2xl bg-white/10" />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 space-y-3">
            <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-14 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

type DetailTab = 'proofs' | 'timeline' | 'participants' | 'comments';

function DetailTabButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
        active
          ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.12)]'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-slate-950/10 text-slate-700' : 'bg-white/10 text-white/60'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ProofTimeline({ proofs }: { proofs: any[] }) {
  if (proofs.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-900">No proof updates yet</p>
        <p className="mt-2 text-sm text-slate-600">Proof updates will appear here as soon as members start posting them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proofs.map((proof) => (
        <div key={proof.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {proof.day ? `Day ${proof.day}` : 'Proof update'}
              </p>
              <p className="mt-1 text-sm text-slate-600">{proof.description || 'Proof submission'}</p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {proof.type === 'video' ? 'video' : 'photo'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{proof.uploader ? `Uploaded by ${proof.uploader}` : 'Uploaded by a member'}</span>
            {proof.uploadedAt && <span>{new Date(proof.uploadedAt).toLocaleString()}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DetailTab>('proofs');
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError, refetch: refetchPact } = usePact(pactId);
  const { data: proofsData, refetch: refetchProofs } = usePactProofs(pactId, 50);
  const supportMutation = useSupportPact();
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
  const isParticipant = Boolean(
    user && (pact?.creator_id === user.id || participants.some((participant: any) => participant.id === user.id || participant.user_id === user.id))
  );

  const handleVote = async (_pactId: number, vote: 'support' | 'skip') => {
    if (vote === 'support') {
      await supportMutation.mutateAsync(pactId);
      return;
    }
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

  if (isLoading) {
    return <PactDetailSkeleton />;
  }

  if (isError || !pact) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
        <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-4 text-xl font-black">Pact not found</h2>
          <p className="mt-2 text-sm text-white/70">This pact could not be loaded or is no longer available.</p>
          <button
            onClick={() => router.push('/feed')}
            className="mt-6 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav showBack={true} showCategories={false} />
      <div className="min-h-screen bg-slate-950 pb-16 pt-24">
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
          />

          {!isParticipant && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Join this pact</p>
              {pact.can_join ? (
                <>
                  <p className="mt-2 text-sm text-white/75">Join this pact to upload proof updates from the camera or your gallery.</p>
                  <button
                    onClick={handleJoinRequest}
                    className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Join pact
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-white/75">
                  {pact.join_block_reason === 'full'
                    ? 'This pact is full.'
                    : pact.join_block_reason === 'not_active'
                      ? 'This pact is no longer active.'
                      : pact.join_block_reason === 'creator'
                        ? 'You created this pact.'
                        : pact.join_block_reason === 'already_joined'
                          ? "You're already part of this pact."
                          : "Joining isn't available right now."}
                </p>
              )}
            </div>
          )}

          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm">
            <div className="border-b border-white/10 px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">Pact detail</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <DetailTabButton
                  active={activeTab === 'proofs'}
                  icon={Camera}
                  label="Proofs"
                  count={proofs.length}
                  onClick={() => setActiveTab('proofs')}
                />
                <DetailTabButton
                  active={activeTab === 'timeline'}
                  icon={Clock3}
                  label="Timeline"
                  count={proofs.length}
                  onClick={() => setActiveTab('timeline')}
                />
                <DetailTabButton
                  active={activeTab === 'participants'}
                  icon={Users}
                  label="Participants"
                  count={participants.length}
                  onClick={() => setActiveTab('participants')}
                />
                <DetailTabButton
                  active={activeTab === 'comments'}
                  icon={MessageSquare}
                  label="Comments"
                  onClick={() => setActiveTab('comments')}
                />
              </div>
            </div>

            <div className="px-4 py-5">
              <AnimatePresence mode="wait">
                {activeTab === 'proofs' && (
                  <motion.div
                    key="proofs"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ProofsSection proofs={proofs} title="Proof gallery" variant="immersive" />
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-5"
                  >
                    <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-slate-700" />
                        <h2 className="text-lg font-black text-slate-900">Verification status</h2>
                      </div>
                      <VerificationResults pactId={pact.id} />
                    </section>

                    <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <Clock3 className="h-5 w-5 text-slate-700" />
                        <h2 className="text-lg font-black text-slate-900">Proof timeline</h2>
                      </div>
                      <ProofTimeline proofs={proofs} />
                    </section>
                  </motion.div>
                )}

                {activeTab === 'participants' && (
                  <motion.div
                    key="participants"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-700" />
                        <h2 className="text-lg font-black text-slate-900">Pact members</h2>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {participants.length > 0 ? (
                          participants.map((participant: any) => (
                            <div key={participant.id || participant.user_id} className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                                <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-700">
                                  {String(participant.username || '?').charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">@{participant.username}</p>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{participant.status || 'active'}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No participant data yet.</p>
                        )}
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'comments' && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
                      <h2 className="mb-4 text-lg font-black text-slate-900">Discussion</h2>
                      <CommentSection pactId={pact.id} />
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </div>
    </>
  );
}
