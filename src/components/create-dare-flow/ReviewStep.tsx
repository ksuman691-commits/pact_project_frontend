'use client';

import React from 'react';
import { useCreateDareFlow } from '@/context/CreateDareFlowContext';

export default function ReviewStep() {
  const { draft, isSubmitting, submit } = useCreateDareFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-[var(--pact-text)] text-balance">Review the dare</h1>

      <div className="mt-6 space-y-3 rounded-[28px] p-4" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
        <div>
          <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Title</p>
          <p className="font-semibold text-[var(--pact-text)]">{draft.title}</p>
        </div>
        <div>
          <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Description</p>
          <p className="text-[var(--pact-text-dim)]">{draft.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-[var(--pact-hairline)] pt-3">
          <div>
            <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Respond By</p>
            <p className="pact-mono text-[var(--pact-text)]">{draft.respondByHours} hours</p>
          </div>
          <div>
            <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Complete By</p>
            <p className="pact-mono text-[var(--pact-text)]">{draft.completeByHours} hours</p>
          </div>
        </div>
        <div>
          <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Visibility</p>
          <p className="capitalize text-[var(--pact-text)]">{draft.visibility}</p>
        </div>
        {draft.recipients.length > 0 && (
          <div>
            <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Recipients</p>
            <p className="text-[var(--pact-text)]">{draft.recipients.map((r) => `@${r.username}`).join(', ')}</p>
          </div>
        )}
        <div>
          <p className="pact-mono text-xs font-semibold uppercase text-[var(--pact-text-faint)]">Verification</p>
          <p className="capitalize text-[var(--pact-text)]">{draft.verificationMethod}</p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          className="pact-btn-glow w-full rounded-full py-3 font-bold disabled:opacity-60"
          style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
        >
          {isSubmitting ? 'Creating...' : 'Create Dare'}
        </button>
      </div>
    </div>
  );
}
