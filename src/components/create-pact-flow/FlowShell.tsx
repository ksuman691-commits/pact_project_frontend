'use client';

import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import ProgressDots from './ProgressDots';
import LiveTitleStrip from './LiveTitleStrip';

interface FlowShellProps {
  children: React.ReactNode;
  onExit?: () => void;
}

export default function FlowShell({ children, onExit }: FlowShellProps) {
  const { stepIndex, resolvedSteps, canGoBack, goBack, currentStep } = useCreatePactFlow();

  const showChrome = currentStep !== 'success';

  return (
    <div className="pact-flow flex min-h-dvh flex-col">
      {showChrome && (
        <header className="flex items-center gap-3 px-5 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--pact-text)] disabled:opacity-0"
            style={{ background: canGoBack ? 'var(--pact-surface)' : 'transparent' }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <ProgressDots current={stepIndex} total={resolvedSteps.length - 1} />
          </div>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--pact-surface)' }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>
      )}

      {showChrome && (
        <div className="px-5 pt-6">
          <LiveTitleStrip />
        </div>
      )}

      <main className="flex flex-1 flex-col px-5 pb-10 pt-6">{children}</main>
    </div>
  );
}
