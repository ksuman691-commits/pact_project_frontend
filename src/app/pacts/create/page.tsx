'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreatePactFlow from '@/components/create-pact-flow/CreatePactFlow';

function CreatePactPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const circleIdParam = searchParams.get('circleId');
  const initialCircleId = circleIdParam ? Number(circleIdParam) : null;

  return (
    <CreatePactFlow
      onExit={() => router.back()}
      initialCircleId={Number.isFinite(initialCircleId) ? initialCircleId : null}
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
