'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DetailPageHeader from '@/components/DetailPageHeader';
import PactMomentsDetail from '@/components/PactMomentsDetail';
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet';
import CommentsBottomSheet from '@/components/CommentsBottomSheet';
import { usePact, usePactProofs } from '@/hooks/usePacts';
import { useAuthStore } from '@/store/auth';
import { pactService } from '@/services/api';
import { getPactProgress } from '@/components/PactProgressRing';
import { resolvePactCompletionViewState } from '@/lib/pactCompletionState';

function PactDetailSkeleton() {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[var(--paper)] px-[14px] pb-3 pt-5">
      <div className="mx-auto flex h-[calc(100dvh-92px)] max-w-[390px] flex-col gap-[14px] rounded-[32px] border border-[var(--hairline)] bg-[var(--card)] p-[18px_16px_16px]">
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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [storyCaptureOpen, setStoryCaptureOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsAboveViewer, setCommentsAboveViewer] = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null);
  const [joinedLocally, setJoinedLocally] = useState(false);
  const [joining, setJoining] = useState(false);
  const pactId = Number(params.id);
  const { data: pactData, isLoading, isError, refetch: refetchPact } = usePact(pactId);
  const { data: momentsData } = usePactProofs(pactId, 50);

  const pact = pactData?.data;
  const moments = useMemo(
    () =>
      (momentsData?.data || [])
        .map((moment: any) => ({
          id: moment.id,
          url: moment.proof_url || moment.file_url || undefined,
          type: moment.proof_type === 'video' ? 'video' : 'image',
          description: moment.caption || '',
          day: moment.day_number,
          uploadedAt: moment.uploaded_at || moment.created_at,
          userId: moment.submitted_by || moment.user_id,
          username: moment.username || moment.submitted_by_username,
          authorName: moment.full_name || moment.name || moment.username || moment.submitted_by_username,
          avatarUrl: moment.avatar_url || undefined,
        }))
        .sort((left: any, right: any) => new Date(right.uploadedAt || 0).getTime() - new Date(left.uploadedAt || 0).getTime()),
    [momentsData?.data],
  );
  const participants = useMemo(() => pact?.participants || [], [pact?.participants]);
  const progress = pact ? getPactProgress(pact, moments) : { completed: 0, total: 7, missed: 0 };
  const completionView = pact ? resolvePactCompletionViewState(pact, new Date(), progress.completed) : null;
  const isCreator = Boolean(user && pact?.creator_id === user.id);
  const isParticipant = Boolean(user && (joinedLocally || pact?.is_joined_by_me || isCreator || participants.some((participant: any) => participant.id === user.id || participant.user_id === user.id)));
  const isEnded = pact?.status !== 'active' || completionView !== null;

  const joinPact = async (): Promise<boolean> => {
    if (!pact || joining || !pact.can_join) return false;
    setJoining(true);
    try {
      await pactService.join(pact.id);
      setJoinedLocally(true);
      await Promise.all([
        refetchPact(),
        queryClient.invalidateQueries({ queryKey: ['my-pacts'] }),
      ]);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not join this pact');
      return false;
    } finally {
      setJoining(false);
    }
  };

  const handleJoinAndAddMoment = async () => {
    if (await joinPact()) {
      setStoryCaptureOpen(true);
    }
  };

  const handleStartOwnVersion = () => {
    if (!pact) return;
    const params = new URLSearchParams();
    const goalText = pact.description || pact.title;
    if (goalText) params.set('note', goalText);
    if (pact.category) params.set('category', pact.category);
    params.set('pactId', String(pact.id));
    router.push(`/pacts/create?${params.toString()}`);
  };

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

  const handleShareRecap = async () => {
    if (!pact) return;
    const url = `${window.location.origin}/pacts/${pact.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pact.title} — CirclePact`, url });
        return;
      } catch {
        // Native sharing may be unavailable or dismissed; use clipboard fallback.
      }
    }
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
      toast.success('Recap link copied');
    } catch {
      toast.error('Could not share the recap');
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
        <div className="flex min-h-[calc(100dvh-60px)] items-center justify-center bg-[var(--paper)] px-4">
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
        isEnded={isEnded}
        viewerId={user?.id}
        isParticipant={isParticipant}
        canJoin={Boolean(pact.can_join)}
        joinBlockReason={pact.join_block_reason}
        isJoining={joining}
        onJoin={() => void handleJoinAndAddMoment()}
        onStartOwnVersion={handleStartOwnVersion}
        onInvite={() => void handleInvite()}
        onAddMoment={() => setStoryCaptureOpen(true)}
        onRestart={() => router.push(`/pacts/create?pactId=${pact.id}`)}
        onShareRecap={() => void handleShareRecap()}
        onComment={(aboveViewer = false) => { setCommentsAboveViewer(aboveViewer); setCommentsOpen(true) }}
      />
      <StoryCaptureSheet
        isOpen={storyCaptureOpen && !isEnded}
        onClose={() => setStoryCaptureOpen(false)}
        pactId={pact.id}
        pactTitle={pact.title}
        canJoin={Boolean(pact.can_join)}
        onJoin={joinPact}
      />
      <CommentsBottomSheet
        pactId={pact.id}
        commentCount={liveCommentCount ?? Number(pact.comment_count ?? 0)}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setLiveCommentCount}
        aboveViewer={commentsAboveViewer}
      />
    </>
  );
}
