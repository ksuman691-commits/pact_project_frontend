'use client';

import React from 'react';
import { Camera, Video, CheckCircle2, Activity as ActivityIcon } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { PROOF_FREQUENCIES } from '@/lib/createPactFlow/content';
import type { ProofMethod } from '@/types/createPactFlow';

const PROOF_ICONS: Record<ProofMethod, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Photo: Camera,
  Video: Video,
  'Check-in': CheckCircle2,
  'Activity data': ActivityIcon,
};

const PROOF_METHOD_LIST: ProofMethod[] = ['Photo', 'Video', 'Check-in', 'Activity data'];

export default function ProofStep() {
  const { draft, selectProofMethod, selectProofFrequency } = useCreatePactFlow();

  return (
    <div className="pact-step-enter flex flex-1 flex-col">
      <h1 className="text-2xl font-bold">How will you prove it?</h1>
      <p className="mt-1 text-sm">Pick how you&apos;ll check in.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PROOF_METHOD_LIST.map((method) => {
          const Icon = PROOF_ICONS[method];
          const selected = draft.proofMethod === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => selectProofMethod(method)}
              className={`pact-tile flex flex-col items-start gap-2 rounded-2xl p-4 text-left ${selected ? 'selected' : ''}`}
            >
              <Icon className="h-5 w-5" style={{ color: 'var(--pact-gold)' }} />
              <span className="font-semibold">{method}</span>
              {method === 'Activity data' && (
                <span className="text-xs" style={{ color: 'var(--pact-text-muted)' }}>
                  Synced automatically
                </span>
              )}
            </button>
          );
        })}
      </div>

      {draft.proofMethod && draft.proofMethod !== 'Activity data' && (
        <div className="pact-step-enter mt-6">
          <p className="text-sm font-semibold" style={{ color: 'var(--pact-text)' }}>
            How often?
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {PROOF_FREQUENCIES.map((freq) => {
              const selected = draft.proofFrequency === freq;
              return (
                <button
                  key={freq}
                  type="button"
                  onClick={() => selectProofFrequency(freq)}
                  className={`pact-tile rounded-2xl p-4 text-left font-semibold ${selected ? 'selected' : ''}`}
                >
                  {freq}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
