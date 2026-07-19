'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader, Users } from 'lucide-react';
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

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError } = usePact(pactId);
  const { data: proofsData, refetch: refetchProofs } = usePactProofs(pactId, 50);
  const supportMutation = useSupportPact();
  const skipMutation = useSkipPact();
  const [comments, setComments] = useState([
    { id: 1, user: 'circle_runner', text: 'This streak is looking solid.', timestamp: '2h ago', likes: 12 },
    { id: 2, user: 'habit_journal', text: 'The recent uploads make this feel real.', timestamp: '45m ago', likes: 8 },
  ]);

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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-3 text-sm text-white/70">Loading pact...</p>
        </div>
      </div>
    );
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
        <div className="mx-auto max-w-md space-y-6 px-4">
          <FeedPactCard
            pact={{ ...pact, proofClips: proofs }}
            userVote={(pact as any).user_vote || (pact as any).userVote}
            onVote={handleVote}
            onProofUpload={async () => {
              await refetchProofs();
            }}
            dismissOnVote={false}
            enableGestures={true}
            showVoteActions={true}
            canUploadProof={isParticipant}
            detailHref={`/pacts/${pact.id}`}
            canReport={pact.creator_id !== user?.id}
          />

          {!isParticipant && pact.status === 'active' && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Join this pact</p>
              <p className="mt-2 text-sm text-white/75">Join this pact to upload proof updates from the camera or your gallery.</p>
              <button
                onClick={handleJoinRequest}
                className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Join pact
              </button>
            </div>
          )}

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

          <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
            <ProofsSection proofs={proofs} title="All proof updates" variant="immersive" />
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-black text-slate-900">Verification status</h2>
            </div>
            <VerificationResults pactId={pact.id} />
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-900">Discussion</h2>
            <CommentSection
              pactId={pact.id}
              comments={comments}
              onAddComment={(_pactId, text) => {
                setComments((prev) => [
                  {
                    id: Date.now(),
                    user: 'You',
                    text,
                    timestamp: 'now',
                    likes: 0,
                  },
                  ...prev,
                ]);
              }}
            />
          </section>
        </div>
      </div>
    </>
  );
}
