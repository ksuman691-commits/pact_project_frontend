'use client';

import { PauseCircle } from 'lucide-react';

/** Shown in place of a button when the team has paused that part of the app. */
export default function PausedNote({ text, dark = false, className = '' }: { text: string; dark?: boolean; className?: string }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-[14px] px-3.5 py-3 text-[13.5px] leading-[1.45] ${dark ? 'bg-white/10 text-[#E6E4EA]' : 'border border-[var(--hairline)] bg-[var(--card)] text-[var(--muted)]'} ${className}`}
    >
      <PauseCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
