'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewPactFlow from '@/components/new-pact/NewPactFlow';
import { useSmartBack } from '@/hooks/useSmartBack';
import { useRouter } from 'next/navigation';

function CreatePactPageContent() {
  const smartBack = useSmartBack('/pacts');
  const router = useRouter();
  const searchParams = useSearchParams();
  // A brand-new person after sign-up: closing goes to Home, not back through the sign-up screens.
  const firstRun = searchParams.get('first') === '1';
  const exitFlow = firstRun ? () => router.replace('/feed') : smartBack;
  const circleIdParam = searchParams.get('circleId');
  const initialCircleId = circleIdParam ? Number(circleIdParam) : null;
  // Carries over free text from the Dare flow's "switch to a Pact" nudge.
  const initialDescription = searchParams.get('note');
  // "Start a pact with [Name]": that person is shown on the card, and the
  // live screen's invite button goes to them.
  const participantIdParam = searchParams.get('participantId');
  const withUserId = participantIdParam ? Number(participantIdParam) : null;

  return (
    <NewPactFlow
      onExit={exitFlow}
      initialCircleId={Number.isFinite(initialCircleId) ? initialCircleId : null}
      initialText={initialDescription}
      sprint={searchParams.get('sprint') === '1'}
      first={firstRun}
      withUserId={Number.isFinite(withUserId) ? withUserId : null}
    />
  );
}

export default function CreatePactPage() {
  return (
    <Suspense fallback={null}>
      <CreatePactPageContent />
    </Suspense>
  );
}
