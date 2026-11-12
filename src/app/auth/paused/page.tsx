'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CircleMark from '@/components/brand/CircleMark';
import { readPaused, SUPPORT_EMAIL, type PausedInfo } from '@/lib/paused';

function untilText(iso: string | null): string {
  if (!iso) return 'Until our team lifts it.';
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `Until ${day}, ${time}.`;
}

/** What someone sees when they try to sign in while a moderator has paused their account. */
export default function PausedPage() {
  const [info, setInfo] = useState<PausedInfo | null>(null);
  useEffect(() => setInfo(readPaused()), []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-7 py-10 text-center text-[var(--ink)]">
      <CircleMark size={56} />
      <h1 className="mt-5 text-[28px] font-extrabold tracking-[-0.04em]">Your account is paused</h1>
      <p className="mt-1.5 text-[15px] text-[var(--muted)]">{untilText(info?.until ?? null)}</p>
      {info?.reason && (
        <div className="mt-5 w-full max-w-[380px] rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3.5 text-left text-[14px] leading-[1.5]">
          <b>Why</b>
          <br />
          {info.reason}
        </div>
      )}
      <p className="mt-4 max-w-[340px] text-[13.5px] leading-[1.5] text-[var(--muted)]">Nothing has been deleted. Your pacts and moments come back when the pause ends.</p>
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('My CirclePact account is paused')}`}
        className="mt-5 flex h-12 items-center rounded-full border border-[var(--hairline)] bg-white px-6 text-[15px] font-bold"
      >
        Think this is wrong? Write to us
      </a>
      <Link href="/auth/login" className="mt-3 text-[14px] font-semibold text-[var(--navy)]">
        Back to sign in
      </Link>
    </main>
  );
}
