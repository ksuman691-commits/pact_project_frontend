'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';

/** The console's front door sends each role to its own work. */
function Home() {
  const member = useConsoleMember();
  const router = useRouter();
  useEffect(() => {
    if (!member) return;
    router.replace(member.role === 'moderator' ? '/console/reports' : '/console/studio');
  }, [member, router]);
  return null;
}

export default function ConsoleHome() {
  return (
    <ConsoleFrame>
      <Home />
    </ConsoleFrame>
  );
}
