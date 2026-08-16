'use client';

import React from 'react';

interface LiveTitleStripProps {
  text: string;
  placeholder: string;
  /** Small flow-specific icon (e.g. a target for Pact, people for Circle)
   * rendered ahead of the text, tinted with the current flow's accent. */
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

/**
 * The signature element of every tap-flow (Pact/Circle/Dare): writes a
 * live-building summary progressively as the user taps through, so the
 * final result can never contradict what's actually been configured.
 * Generic by design — each flow computes its own `text` from its own draft
 * and passes it in, rather than this component reaching into flow-specific
 * context. The left accent border and optional icon pick up whichever
 * flow's --flow-accent is active (set by FlowShell), so this one component
 * reads as visually distinct between Pact and Circle without any
 * flow-specific logic living here.
 */
export default function LiveTitleStrip({ text, placeholder, icon: Icon }: LiveTitleStripProps) {
  return (
    <div
      className="pact-mono flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed"
      style={{
        background: 'var(--pact-surface)',
        border: '1px solid var(--pact-hairline)',
        borderLeft: '3px solid var(--flow-accent, var(--pact-pink))',
        color: text ? 'var(--pact-text)' : 'var(--pact-text-muted)',
      }}
    >
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--flow-accent, var(--pact-pink))' }} />}
      <span>{text || placeholder}</span>
    </div>
  );
}
