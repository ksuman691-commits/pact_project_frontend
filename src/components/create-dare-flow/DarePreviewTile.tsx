'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import SparkRing from '@/components/dares/SparkRing';
import type { DareDraft } from '@/types/createDareFlow';

/**
 * The dare as it will land: a small version of the card the other person
 * gets. It fills in as you tap through, so the flow feels like building the
 * thing rather than answering a form.
 */
export default function DarePreviewTile({ draft }: { draft: DareDraft }) {
  const who = draft.recipients[0];
  const name = who ? who.full_name || `@${who.username}` : null;
  const title = draft.title.trim();
  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-4 py-4 text-white"
      style={{ background: 'radial-gradient(120% 110% at 85% 0%, #2F4486 0%, #141A2E 55%, #0C0D11 100%)' }}
      aria-live="polite"
      aria-label="Preview of your dare"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {name ? `Dare for ${name}` : 'Your dare'}
          </p>
          <p
            className="mt-1 line-clamp-3 text-balance text-[24px] font-extrabold leading-[1.05] tracking-[-0.03em]"
            style={title ? undefined : { color: 'rgba(255,255,255,0.4)' }}
          >
            {title || 'What will you dare them to do?'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-[9px] px-2 py-[3px] text-[11.5px] font-extrabold" style={{ background: 'rgba(255,255,255,0.18)' }}>
              {draft.respondByHours}h to answer
            </span>
            <span className="rounded-[9px] px-2 py-[3px] text-[11.5px] font-extrabold" style={{ background: 'rgba(255,255,255,0.18)' }}>
              {draft.completeByHours}h to do it
            </span>
            {draft.rewardAmount ? (
              <span className="rounded-[9px] px-2 py-[3px] text-[11.5px] font-extrabold text-[#17181D]" style={{ background: '#FFD84D' }}>
                ₹{draft.rewardAmount}
              </span>
            ) : null}
          </div>
        </div>
        <SparkRing size={88} tone="dark" duration="28s">
          <Zap className="size-7" strokeWidth={2.2} fill="#FFD84D" color="#FFD84D" />
        </SparkRing>
      </div>
    </div>
  );
}
