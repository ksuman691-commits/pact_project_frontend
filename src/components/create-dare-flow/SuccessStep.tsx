'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

export default function SuccessStep({ onDone }: { onDone: () => void }) {
  const { createdDare, reset } = useCreateDareFlow();
  const router = useRouter();

  return (
    <div className="pact-spring-pop flex flex-1 flex-col items-center justify-center text-center">
      <div
        className="pact-stamp-ring flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
      >
        <Zap className="h-9 w-9" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-[var(--pact-text)] text-balance">Dare sent</h1>
      <p className="mt-2 max-w-xs text-sm text-[var(--pact-text-dim)]">
        {createdDare?.title ? `"${createdDare.title}" is live.` : 'Your dare is live.'} They&apos;ll know what to do next.
      </p>

      <div className="mt-10 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            onDone();
            router.push('/feed');
          }}
          className="pact-btn-glow w-full rounded-full py-3 font-bold"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          Back to Feed
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-full border px-6 py-3 text-sm font-semibold"
          style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text)' }}
        >
          Create another dare
        </button>
      </div>
    </div>
  );
}
