'use client';

import Link from 'next/link';
import DetailPageHeader from '@/components/DetailPageHeader';
import { SUPPORT_EMAIL } from '@/lib/paused';

export interface TakenDown {
  at: string;
  reason: string | null;
  reason_label: string;
  note: string | null;
}

/** What a creator sees when the team took their pact down. Nobody else can open it. */
export default function TakenDownPact({ title, takenDown }: { title: string; takenDown: TakenDown }) {
  const subject = encodeURIComponent(`My pact “${title}” was taken down`);
  return (
    <>
      <DetailPageHeader title={title} backHref="/feed" maxWidthClassName="max-w-md" />
      <main className="mx-auto min-h-[calc(100dvh-60px)] max-w-md bg-[var(--paper)] px-4 pb-10 pt-3">
        <div className="flex h-[260px] flex-col items-center justify-center rounded-[20px] bg-[#D9D6CF] px-6 text-center">
          <svg width="44" height="44" viewBox="0 0 512 512" aria-hidden="true">
            <path fill="#8A8C93" d="M256 256L300.45 3.89A256 256 0 1 0 465.7 109.16Z" />
          </svg>
          <h2 className="mt-3 text-[22px] font-bold tracking-[-0.03em]">Taken down</h2>
          <p className="mt-1 text-[14px] leading-[1.45] text-[var(--muted)]">Only you can see this pact now.</p>
        </div>
        <h1 className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
        <div className="mt-2 rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] p-3.5 text-[14px] leading-[1.5]">
          <b>Why:</b> {takenDown.reason_label}
          {takenDown.note && <span className="mt-0.5 block">“{takenDown.note}”</span>}
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.5] text-[var(--muted)]">
          Our team took this pact down for breaking the community rules. Your moments are kept, not deleted, and the people watching can no longer see it.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}
          className="mt-4 flex h-12 items-center justify-center rounded-full border border-[var(--hairline)] bg-white text-[15px] font-bold text-[var(--ink)]"
        >
          Think this is wrong? Write to us
        </a>
        <p className="mt-2 text-center text-[12.5px] text-[var(--muted)]">{SUPPORT_EMAIL}</p>
        <Link href="/pacts/create" className="mt-5 flex h-12 items-center justify-center rounded-full bg-[var(--navy)] text-[15px] font-bold text-white">
          Start a new pact
        </Link>
      </main>
    </>
  );
}
