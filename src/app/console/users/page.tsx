'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import PersonStatusPill from '@/components/console/PersonStatusPill';
import { PageHeader, RED, ago, shortDate } from '@/components/console/ui';
import Avatar from '@/components/Avatar';
import { consoleApi, errorText, type Person } from '@/lib/console/api';

function Users() {
  const member = useConsoleMember();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = member?.role === 'moderator' || member?.role === 'owner';

  useEffect(() => {
    const text = q.trim();
    if (!allowed || text.replace(/^@/, '').length < 2) {
      setRows(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        setRows(await consoleApi.findPeople(text));
        setError(null);
      } catch (e) {
        setError(errorText(e));
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, allowed]);

  if (!member) return null;
  if (!allowed) return <NotYours />;

  return (
    <>
      <PageHeader title="Users" sub="Find someone by name, @username or email." />
      <label className="mt-4 flex h-12 items-center gap-2.5 rounded-[14px] border-[1.5px] border-[var(--ink)] bg-white px-3.5">
        <Search className="size-4 text-[var(--muted)]" aria-hidden="true" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, @username or email" aria-label="Find someone" className="h-full flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none" />
        {rows && <span className="text-[12.5px] text-[var(--muted)]">{rows.length === 25 ? '25+ found' : `${rows.length} found`}</span>}
      </label>
      {error && <p className="mt-3 text-[13.5px] font-semibold" style={{ color: RED }}>{error}</p>}
      {rows && rows.length === 0 && <div className="mt-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-5 py-8 text-center text-[14.5px] text-[var(--muted)]">Nobody matches “{q.trim()}”.</div>}
      {rows && rows.length > 0 && (
        <div className="mt-3.5 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                <th className="px-3.5 py-2.5">Person</th>
                <th className="px-3.5 py-2.5">Joined</th>
                <th className="px-3.5 py-2.5">Last seen</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-[#E6DFD0] hover:bg-[#F6F1E6]">
                  <td className="px-3.5 py-2.5">
                    <Link href={`/console/users/${p.id}`} className="flex items-center gap-2.5">
                      <Avatar name={p.name} avatarUrl={p.avatar_url} size={32} />
                      <span className="min-w-0">
                        <b className="block">{p.name}</b>
                        <span className="block text-[12.5px] text-[var(--muted)]">
                          @{p.username} · {p.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[var(--muted)]">{shortDate(p.joined_at)}</td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[var(--muted)]">{p.last_seen_at ? ago(p.last_seen_at) : '–'}</td>
                  <td className="px-3.5 py-2.5">
                    <PersonStatusPill status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-[12.5px]" style={{ color: p.reported_dares ? RED : 'var(--muted)' }}>
                    {p.reported_dares ? `${p.reported_dares} reported ${p.reported_dares === 1 ? 'dare' : 'dares'}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2.5 text-[12.5px] text-[var(--muted)]">
        {member.role === 'owner' ? 'You see full emails; moderators see them partly hidden.' : 'Emails are partly hidden. Only the owner sees them in full.'} Every profile you open is written to the activity log.
      </p>
    </>
  );
}

export default function UsersPage() {
  return (
    <ConsoleFrame>
      <Users />
    </ConsoleFrame>
  );
}
