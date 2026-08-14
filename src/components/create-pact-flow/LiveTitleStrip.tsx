'use client';

import React from 'react';
import { useCreatePactFlow } from '@/context/CreatePactFlowContext';
import { generateTitle, LIVE_TITLE_PLACEHOLDER } from '@/lib/createPactFlow/generate';

/**
 * The signature element of the flow: writes the pact's title progressively
 * as the user taps through, so the final title can never contradict the
 * actually-configured target/duration.
 */
export default function LiveTitleStrip() {
  const { draft, activity } = useCreatePactFlow();
  const title = generateTitle(draft, activity);

  return (
    <div
      className="pact-mono rounded-2xl px-4 py-3 text-sm leading-relaxed"
      style={{
        background: 'var(--pact-surface)',
        border: '1px solid var(--pact-hairline)',
        color: title ? 'var(--pact-text)' : 'var(--pact-text-muted)',
      }}
    >
      {title || LIVE_TITLE_PLACEHOLDER}
    </div>
  );
}
