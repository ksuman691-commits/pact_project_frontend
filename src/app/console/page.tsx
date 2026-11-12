'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConsoleFrame, { ROLE_LABEL, useConsoleMember } from '@/components/console/ConsoleFrame';

const COMING: Record<string, string> = {
  staff: 'the dashboard, approving drafts and scheduling the dare of the day',
  moderator: 'the report queue and looking people up',
  creator: 'writing dare drafts and seeing how they did',
};

function Home() {
  const member = useConsoleMember();
  const router = useRouter();
  useEffect(() => {
    if (member?.role === 'owner') router.replace('/console/team');
  }, [member, router]);
  if (!member || member.role === 'owner') return null;
  return (
    <div className="rounded-[22px] border border-[var(--hairline)] bg-[var(--card)] p-6">
      <h1 className="text-[28px] font-bold tracking-[-0.04em]">Hi {member.name.split(' ')[0]}</h1>
      <p className="mt-2 max-w-[520px] text-[15px] leading-[1.5] text-[var(--muted)]">
        You&apos;re set up as <b className="text-[var(--ink)]">{ROLE_LABEL[member.role]}</b>. Your tools, {COMING[member.role]}, arrive in the next update. You&apos;ll see them here.
      </p>
    </div>
  );
}

export default function ConsoleHome() {
  return (
    <ConsoleFrame>
      <Home />
    </ConsoleFrame>
  );
}
