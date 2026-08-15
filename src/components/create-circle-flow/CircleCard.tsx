'use client';

import React from 'react';
import { useCreateCircleFlow } from '@/context/CreateCircleFlowContext';
import { PRIVACY_OPTIONS, CIRCLE_VIBE_TAGLINES } from '@/lib/createCircleFlow/content';

export default function CircleCard() {
  const { draft } = useCreateCircleFlow();
  const privacyOption = PRIVACY_OPTIONS.find((p) => p.id === draft.privacy);
  const description = draft.tagline.trim() || (draft.vibeId ? CIRCLE_VIBE_TAGLINES[draft.vibeId] : '');

  return (
    <div className="pact-surface rounded-3xl p-6">
      <span className="pact-mono text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pact-gold)' }}>
        Your Circle
      </span>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-3xl">{draft.emoji}</span>
        <h2 className="text-2xl font-bold leading-snug">{draft.name || 'Untitled Circle'}</h2>
      </div>
      {description && <p className="mt-2 text-sm italic">&ldquo;{description}&rdquo;</p>}

      <div className="mt-5 flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--pact-hairline)' }}>
        <MetaRow label="Privacy" value={privacyOption ? `${privacyOption.emoji} ${privacyOption.label}` : '—'} />
        <MetaRow
          label="Invites"
          value={draft.inviteUserIds.length > 0 ? `${draft.inviteUserIds.length} people` : 'None yet'}
        />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--pact-text-muted)' }}>{label}</span>
      <span className="pact-mono font-medium">{value}</span>
    </div>
  );
}
