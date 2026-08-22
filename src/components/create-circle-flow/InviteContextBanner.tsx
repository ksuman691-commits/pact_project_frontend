'use client';

import { useEffect, useState } from 'react';
import Avatar from '@/components/Avatar';

type Invitee = { user_id: number; full_name?: string | null; username?: string | null; avatar_url?: string | null };

export default function InviteContextBanner() {
  const [invitees, setInvitees] = useState<Invitee[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('circle-match-invitees');
      setInvitees(raw ? JSON.parse(raw) : []);
    } catch {
      setInvitees([]);
    }
  }, []);

  if (!invitees.length) return null;
  const names = invitees.slice(0, 2).map((person) => person.full_name || person.username || 'Member');
  const remainder = invitees.length - names.length;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--pact-violet)]/30 bg-[var(--pact-violet)]/10 px-3 py-2">
      <div className="flex -space-x-2">
        {invitees.slice(0, 3).map((person) => <Avatar key={person.user_id} name={person.full_name || person.username || 'Member'} avatarUrl={person.avatar_url} size={24} />)}
      </div>
      <p className="min-w-0 truncate text-xs font-semibold text-[var(--pact-text-dim)]">
        Creating a circle with <span className="text-[var(--pact-text)]">{names.join(', ')}{remainder > 0 ? ` + ${remainder} other${remainder === 1 ? '' : 's'}` : ''}</span>
      </p>
    </div>
  );
}
