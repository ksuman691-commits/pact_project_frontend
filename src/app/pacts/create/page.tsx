'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CreatePactFlow from '@/components/create-pact-flow/CreatePactFlow';
import { useSmartBack } from '@/hooks/useSmartBack';

function CreatePactPageContent() {
  const exitFlow = useSmartBack('/pacts');
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
  // Carried over from a goal-match "Create a matching pact for this circle"
  // CTA (see the Create Circle flow's SuccessStep) — seeds the vibe from
  // category and skips the vibe step; pactId is a best-effort duration
  // prefill only (see CreatePactFlowContext).
  const category = searchParams.get('category');
  const matchPactIdParam = searchParams.get('pactId');
  const initialMatchPactId = matchPactIdParam ? Number(matchPactIdParam) : null;

  return (
    <CreatePactFlow
      onExit={exitFlow}
      initialCircleId={Number.isFinite(initialCircleId) ? initialCircleId : null}
      initialDescription={initialDescription}
      initialParticipantId={Number.isFinite(initialParticipantId) ? initialParticipantId : null}
      initialCategory={category}
      initialPactId={Number.isFinite(initialMatchPactId) ? initialMatchPactId : null}
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
