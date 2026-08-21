'use client';

import { Suspense } from 'react';
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

  if (!isInitialized) {
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
