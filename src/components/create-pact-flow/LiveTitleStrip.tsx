'use client';

import React from 'react';

interface LiveTitleStripProps {
  text: string;
  placeholder: string;
}

/**
 * The signature element of every tap-flow (Pact/Circle/Dare): writes a
 * live-building summary progressively as the user taps through, so the
 * final result can never contradict what's actually been configured.
 * Generic by design — each flow computes its own `text` from its own draft
 * and passes it in, rather than this component reaching into flow-specific
 * context.
 */
export default function LiveTitleStrip({ text, placeholder }: LiveTitleStripProps) {
  return (
    <div
      className="pact-mono rounded-2xl px-4 py-3 text-sm leading-relaxed"
      style={{
        background: 'var(--pact-surface)',
        border: '1px solid var(--pact-hairline)',
        color: text ? 'var(--pact-text)' : 'var(--pact-text-muted)',
      }}
    >
      {text || placeholder}
    </div>
  );
}
