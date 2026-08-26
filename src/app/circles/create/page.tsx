'use client';

import { Suspense, useEffect, useState } from 'react';
import InviteConfirmation from '@/components/create-circle-flow/InviteConfirmation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import CreateCircleFlow from '@/components/create-circle-flow/CreateCircleFlow';
import { useSmartBack } from '@/hooks/useSmartBack';
import LogoSpinner from '@/components/LogoSpinner';

function CreateCirclePageContent() {
  const router = useRouter();
  const exitFlow = useSmartBack('/circles');
  const searchParams = useSearchParams();
  const inviteUserIdParam = searchParams.get('inviteUserId');
  // Supports both a single id (existing deep links, e.g. from a profile's
  // "Add to a Circle" CTA) and multiple comma-separated ids (e.g.
  // "?inviteUserId=12,45,88" from GoalMatchStrip's "Start a circle with
  // them" — one invite per person on the same goal, not just one).
  const inviteUserIds = inviteUserIdParam
    ? inviteUserIdParam
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id))
    : [];
  // Carried over from a goal-match "Start a circle with them" CTA — see
  // FeedPactCard.handleStartCircleWithMatches.
  const category = searchParams.get('category');
  const pactIdParam = searchParams.get('pactId');
  const pactId = pactIdParam ? Number(pactIdParam) : null;
  const { user, isInitialized } = useRequireAuth();
  const [matchInvitees, setMatchInvitees] = useState<any[]>([]);
  const [inviteesReady, setInviteesReady] = useState(false);
  const needsConfirmation = searchParams.get('confirmInvites') === '1';

  useEffect(() => {
    if (!needsConfirmation) {
      setInviteesReady(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem('circle-match-invitees');
      setMatchInvitees(raw ? JSON.parse(raw) : []);
    } catch {
      setMatchInvitees([]);
    } finally {
      setInviteesReady(true);
    }
  }, [needsConfirmation]);

  const cancelConfirmation = () => {
    sessionStorage.removeItem('circle-match-invitees');
    router.back();
  };

  // Takes the (possibly edited — someone removed or added on the
  // confirmation screen) final invitee list rather than reusing the
  // original inviteUserIds from the URL, so add/remove on that screen
  // actually changes who the circle gets created with.
  const confirmInvites = (finalInvitees: { user_id: number }[]) => {
    const finalIds = finalInvitees.map((invitee) => invitee.user_id);
    sessionStorage.removeItem('circle-match-invitees');
    router.replace(`/circles/create?inviteUserId=${finalIds.join(',')}${category ? `&category=${encodeURIComponent(category)}` : ''}${pactId ? `&pactId=${pactId}` : ''}`);
  };

  if (!isInitialized || !inviteesReady) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <LogoSpinner size={48} color="var(--pact-pink)" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (needsConfirmation) {
    return <InviteConfirmation invitees={matchInvitees} onConfirm={confirmInvites} onCancel={cancelConfirmation} />;
  }

  return (
    <CreateCircleFlow
      onExit={exitFlow}
      initialInviteUserId={inviteUserIds.length > 0 ? inviteUserIds : null}
      initialCategory={category}
      initialPactId={Number.isFinite(pactId) ? pactId : null}
    />
  );
}

export default function CreateCirclePage() {
  return (
    <Suspense fallback={null}>
      <CreateCirclePageContent />
    </Suspense>
  );
}
