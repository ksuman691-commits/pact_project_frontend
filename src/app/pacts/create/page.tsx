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

  return (
    <CreatePactFlow
      onExit={() => router.back()}
      initialCircleId={Number.isFinite(initialCircleId) ? initialCircleId : null}
      initialDescription={initialDescription}
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
