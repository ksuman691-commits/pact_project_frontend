'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreatePactFlow from '@/components/create-pact-flow/CreatePactFlow';

function CreatePactPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const circleIdParam = searchParams.get('circleId');
  const initialCircleId = circleIdParam ? Number(circleIdParam) : null;
  // Carries over free text from the Dare flow's "switch to a Pact" nudge.
  const initialDescription = searchParams.get('note');
  // Arrives from a specific user's "Create a Pact with [Name]" CTA (e.g. a
  // shared-circle profile) — the target user context is already known, so
  // the flow must skip its generic audience-picker step and show them as an
  // already-attached participant instead of asking again.
  const participantIdParam = searchParams.get('participantId');
  const initialParticipantId = participantIdParam ? Number(participantIdParam) : null;

  return (
    <CreatePactFlow
      onExit={() => router.back()}
      initialCircleId={Number.isFinite(initialCircleId) ? initialCircleId : null}
      initialDescription={initialDescription}
      initialParticipantId={Number.isFinite(initialParticipantId) ? initialParticipantId : null}
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
