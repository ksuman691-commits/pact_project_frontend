'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DetailPageHeader from '@/components/DetailPageHeader';
import PactMomentsDetail from '@/components/PactMomentsDetail';
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet';
import { usePact, usePactCheers, usePactProofs } from '@/hooks/usePacts';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';
import { getPactProgress } from '@/components/PactProgressRing';

function PactDetailSkeleton() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5">
      <div className="mx-auto flex h-[calc(100vh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
        <div className="h-1 w-full animate-pulse rounded-full bg-[var(--card-muted)]" />
        <div className="flex h-11 items-center gap-3">
          <div className="size-11 animate-pulse rounded-full bg-[var(--card-muted)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--card-muted)]" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--card-muted)]" />
          </div>
        </div>
        <div className="flex-1 animate-pulse rounded-[24px] bg-[var(--card-muted)]" />
      </div>
    </main>
  );
}

export default function PactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [storyCaptureOpen, setStoryCaptureOpen] = useState(false);
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError, refetch: refetchPact } = usePact(pactId);
  const { data: momentsData } = usePactProofs(pactId, 50);
  const { data: cheersData } = usePactCheers(pactId, 50);

  const pact = pactData?.data;
  const moments = useMemo(
    () =>
      (momentsData?.data || [])
        .map((moment: any) => ({
          id: moment.id,
          url: moment.proof_url || moment.file_url || undefined,
          type: moment.proof_type === 'video' ? 'video' : 'image',
          description: moment.caption || "Today's moment",
          day: moment.day_number,
          uploadedAt: moment.uploaded_at || moment.created_at,
          userId: moment.submitted_by || moment.user_id,
          username: moment.username || moment.submitted_by_username,
        }))
        .sort((left: any, right: any) => new Date(right.uploadedAt || 0).getTime() - new Date(left.uploadedAt || 0).getTime()),
    [momentsData?.data],
  );
  const participants = useMemo(() => pact?.participants || [], [pact?.participants]);
  const cheers = useMemo(() => cheersData?.data || [], [cheersData?.data]);
  const progress = pact ? getPactProgress(pact, moments) : { completed: 0, total: 7, missed: 0 };
  const isCreator = Boolean(user && pact?.creator_id === user.id);
  const isParticipant = Boolean(
    user && (isCreator || participants.some((participant: any) => participant.id === user.id || participant.user_id === user.id)),
  );
  const canCheer = isParticipant && !isCreator;
  const hasCheered = Boolean(user && cheers.some((cheer: any) => cheer.sender_id === user.id));
  const cheerCount = Number(pact?.active_cheer_count ?? cheersData?.pagination?.total ?? cheers.length);
  const isEnded = pact?.status !== 'active';

  const handleInvite = async () => {
    if (!pact) return;
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
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-[var(--paper)] px-4">
          <div className="max-w-sm rounded-[28px] border border-[var(--hairline)] bg-[var(--card)] p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <h2 className="mt-4 text-xl font-black text-[var(--ink)]">Pact not found</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">This pact could not be loaded or is no longer available.</p>
            <button
              type="button"
              onClick={() => router.push('/feed')}
              className="mt-6 rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--navy-hover)]"
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
      <PactMomentsDetail
        pact={pact}
        moments={moments}
        participants={participants}
        progress={progress}
        cheerCount={cheerCount}
        isEnded={isEnded}
        canCheer={canCheer}
        hasCheered={hasCheered}
        onInvite={() => void handleInvite()}
        onAddMoment={() => setStoryCaptureOpen(true)}
      />
      <StoryCaptureSheet
        isOpen={storyCaptureOpen && !isEnded}
        onClose={() => setStoryCaptureOpen(false)}
        pactId={pact.id}
        pactTitle={pact.title}
      />
    </>
  );
}
