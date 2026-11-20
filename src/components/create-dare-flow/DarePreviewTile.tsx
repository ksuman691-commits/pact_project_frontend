'use client';

import React from 'react';
import { Camera, Clock, Video, Zap } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuthStore } from '@/store/auth';
import type { DareDraft } from '@/types/createDareFlow';

/**
 * The dare as a ticket, the same ink card as the "Dare sent." screen. It
 * fills in as you answer, so there's nothing left to review at the end.
 */
export default function DarePreviewTile({ draft }: { draft: DareDraft }) {
  const { user } = useAuthStore();
  const names = draft.recipients.map((r) => (r.full_name || r.username).split(' ')[0]);
  const to = draft.circle ? draft.circle.name : names.length === 0 ? null : names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]} and ${names.length - 1} others`;
  const title = draft.title.trim();
  const chip = 'flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-bold';
  return (
    <div
      className="relative overflow-hidden rounded-[22px] bg-[var(--ink)] px-4 py-3.5 text-white"
      style={{ boxShadow: '0 3px 0 rgba(23,24,29,0.35)' }}
      aria-live="polite"
      aria-label="Preview of your dare"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--dare)]">
        <Zap className="cp-zap h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        <span key={to ?? ''} className="cp-pop-in truncate">{to ? `I dare you, ${to}` : 'I dare you'}</span>
        {draft.rewardAmount ? (
          <span key={draft.rewardAmount} className="cp-pop-in ml-auto shrink-0 rounded-full bg-[var(--dare)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--ink)]">for ₹{draft.rewardAmount}</span>
        ) : null}
      </p>
      <p className={`mt-1.5 line-clamp-3 text-balance text-[24px] font-bold leading-[1.1] tracking-[-0.03em] ${title ? '' : 'text-white/40'}`}>
        {title || 'What will you dare them to do?'}
      </p>
      {draft.description.trim() && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#C9C8CF]">{draft.description.trim()}</p>}
      <div className="my-3 h-px" style={{ background: 'repeating-linear-gradient(90deg, #46454D 0 6px, transparent 6px 12px)' }} />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#C9C8CF]">
          <Avatar name={user?.full_name || user?.username || 'You'} avatarUrl={user?.avatar_url} size={20} />
          from you
        </span>
        <span key={`r${draft.respondByHours}`} className={`${chip} cp-pop-in`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          <Clock className="size-3" strokeWidth={2.6} aria-hidden="true" />
          {draft.respondByHours}h to say yes
        </span>
        <span key={`c${draft.completeByHours}`} className={`${chip} cp-pop-in`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          {draft.completeByHours}h to do it
        </span>
        <span key={draft.verificationMethod} className={`${chip} cp-pop-in`} style={{ background: 'rgba(255,255,255,0.1)' }}>
          {draft.verificationMethod === 'video' ? <Video className="size-3" strokeWidth={2.6} aria-hidden="true" /> : <Camera className="size-3" strokeWidth={2.6} aria-hidden="true" />}
          {draft.verificationMethod === 'video' ? 'Video' : 'Photo'} proof
        </span>
      </div>
    </div>
  );
}
