'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuthStore } from '@/store/auth';
import type { DareDraft } from '@/types/createDareFlow';

/**
 * The dare as it will land: the yellow "I dare you" card the other person
 * gets. It fills in as you tap through, so the flow feels like building the
 * thing rather than answering a form.
 */
export default function DarePreviewTile({ draft }: { draft: DareDraft }) {
  const { user } = useAuthStore();
  const me = (user?.full_name || user?.username || 'you').split(' ')[0];
  const names = draft.recipients.map((r) => (r.full_name || r.username).split(' ')[0]);
  const to = names.length === 0 ? null : names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]} and ${names.length - 1} others`;
  const title = draft.title.trim();
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[var(--dare)] p-4 text-[var(--ink)]" aria-live="polite" aria-label="Preview of your dare">
      <Zap className="pointer-events-none absolute -bottom-9 -right-8 h-40 w-40 opacity-[0.07]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      <p className="relative flex items-center gap-1.5 text-[13px] font-bold">
        <Zap className="cp-zap h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        {to ? `I dare you, ${to}` : 'I dare you'}
      </p>
      <p className={`relative mt-2.5 line-clamp-3 text-balance text-[26px] font-bold leading-[1.08] tracking-[-0.03em] ${title ? '' : 'opacity-45'}`}>
        {title || 'What will you dare them to do?'}
      </p>
      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-[13px] font-semibold">
          <Avatar name={user?.full_name || user?.username || 'You'} avatarUrl={user?.avatar_url} size={22} />
          from {me}
        </span>
        <span className="rounded-full bg-[var(--ink)] px-2 py-[3px] text-[11.5px] font-bold text-[var(--dare)]">{draft.respondByHours}h to answer</span>
        <span className="rounded-full bg-[var(--ink)] px-2 py-[3px] text-[11.5px] font-bold text-[var(--dare)]">{draft.completeByHours}h to do it</span>
        {draft.rewardAmount ? <span className="rounded-full border-[1.5px] border-[var(--ink)] px-2 py-[2px] text-[11.5px] font-bold">₹{draft.rewardAmount}</span> : null}
      </div>
    </div>
  );
}
