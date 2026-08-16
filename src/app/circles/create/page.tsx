'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import CreateCircleFlow from '@/components/create-circle-flow/CreateCircleFlow';

function CreateCirclePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteUserIdParam = searchParams.get('inviteUserId');
  const inviteUserId = inviteUserIdParam ? Number(inviteUserIdParam) : null;
  const { user, isInitialized } = useRequireAuth();

  if (!isInitialized) {
    return (
      <div className="pact-flow min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--pact-pink)]" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return <CreateCircleFlow onExit={() => router.back()} initialInviteUserId={Number.isFinite(inviteUserId) ? inviteUserId : null} />;
}

export default function CreateCirclePage() {
  return (
    <Suspense fallback={null}>
      <CreateCirclePageContent />
    </Suspense>
  );
}
