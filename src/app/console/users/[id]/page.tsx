'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import ConsoleFrame, { useConsoleMember } from '@/components/console/ConsoleFrame';
import NotYours from '@/components/console/NotYours';
import PersonStatusPill from '@/components/console/PersonStatusPill';
import { Pill, RED, ago, shortDate } from '@/components/console/ui';
import Avatar from '@/components/Avatar';
import { consoleApi, errorText, type PersonPage } from '@/lib/console/api';

const REASON: Record<string, string> = { scam: 'Scam', unsafe: 'Harmful', mean: 'Mean', spam: 'Spam', other: 'Other' };
const LENGTHS: { days: 1 | 7 | 30 | null; label: string }[] = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: null, label: 'Until lifted' },
];

function endsAt(days: number | null): string {
  if (!days) return 'It lasts until someone lifts it from this page.';
  const end = new Date(Date.now() + days * 86_400_000);
  const day = end.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = end.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `Ends ${day}, ${time}. You can lift it earlier from this page.`;
}

function SuspendDialog({ person, onClose, onDone }: { person: PersonPage; onClose: () => void; onDone: () => void }) {
  const [days, setDays] = useState<1 | 7 | 30 | null>(7);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const label = LENGTHS.find((l) => l.days === days)!.label;
  const submit = async () => {
    setBusy(true);
    try {
      await consoleApi.suspend(person.id, days, reason.trim());
      toast.success(`@${person.username} is suspended`);
      onDone();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="suspend-title">
      <div className="w-full max-w-[500px] rounded-[22px] bg-[var(--paper)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="suspend-title" className="text-[22px] font-bold tracking-[-0.03em]">
            Suspend @{person.username}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-[var(--muted)]">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-[14px] text-[var(--muted)]">They can&apos;t sign in, and their profile, pacts and dares are hidden until it ends.</p>
        <div className="mt-4 text-[13px] font-bold">For how long</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LENGTHS.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => setDays(l.days)}
              aria-pressed={days === l.days}
              className={`h-[38px] rounded-full px-3.5 text-[14px] font-bold ${days === l.days ? 'bg-[var(--ink)] text-white' : 'border border-[var(--hairline)] bg-white'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-[13px] font-bold">Reason (they see this)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Sent dares that could hurt people, after a warning."
            className="mt-2 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[14.5px]"
          />
        </label>
        <div className="mt-3 rounded-[12px] border border-[var(--hairline)] bg-white px-3 py-2.5 text-[13px] text-[var(--muted)]">{endsAt(days)}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-[var(--hairline)] bg-white px-4 text-[14.5px] font-bold">
            Cancel
          </button>
          <button type="button" disabled={reason.trim().length < 5 || busy} onClick={() => void submit()} className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white disabled:opacity-40" style={{ background: RED }}>
            {busy ? 'Suspending…' : days ? `Suspend for ${label}` : 'Suspend until lifted'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] text-[var(--muted)]">{label}</div>
      <div className="text-[18px] font-bold">{value}</div>
    </div>
  );
}

function Person() {
  const member = useConsoleMember();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [person, setPerson] = useState<PersonPage | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [busy, setBusy] = useState(false);
  const allowed = member?.role === 'moderator' || member?.role === 'owner';

  const load = useCallback(async () => {
    if (!allowed || !id) return;
    try {
      setPerson(await consoleApi.person(id));
    } catch (error) {
      toast.error(errorText(error, "Couldn't open this person. Try again."));
    }
  }, [allowed, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!member) return null;
  if (!allowed) return <NotYours />;

  const lift = async () => {
    if (!person) return;
    setBusy(true);
    try {
      await consoleApi.lift(person.id);
      toast.success('Suspension lifted');
      void load();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link href="/console/users" className="text-[13.5px] font-bold text-[var(--navy)]">
        ‹ Users
      </Link>
      {!person ? (
        <div className="mt-3 h-[320px] animate-pulse rounded-[18px] bg-[var(--card)]" aria-busy="true" />
      ) : (
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px]">
              <Avatar name={person.name} avatarUrl={person.avatar_url} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] font-bold tracking-[-0.03em]">{person.name}</h1>
                <p className="text-[13.5px] text-[var(--muted)]">
                  @{person.username} · {person.email} · joined {shortDate(person.joined_at)} · last seen {person.last_seen_at ? ago(person.last_seen_at) : '–'}
                </p>
              </div>
              <PersonStatusPill status={person.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] px-[18px] py-4 sm:grid-cols-5">
              <Stat label="Live pacts" value={person.stats.live_pacts} />
              <Stat label="Circles" value={person.stats.circles} />
              <Stat label="Dares sent" value={person.stats.dares_sent} />
              <Stat label="Dares done" value={person.stats.dares_done} />
              <Stat label="Streak" value={`${person.stats.streak_days} ${person.stats.streak_days === 1 ? 'day' : 'days'}`} />
            </div>

            <h2 className="mt-5 text-[13px] font-bold text-[var(--muted)]">Reports on their dares</h2>
            {person.reports.length === 0 ? (
              <p className="mt-2 text-[14px] text-[var(--muted)]">None.</p>
            ) : (
              <div className="mt-2.5 overflow-x-auto rounded-[18px] border border-[var(--hairline)] bg-[var(--card)]">
                <table className="w-full border-collapse text-[14px]">
                  <thead>
                    <tr className="bg-[#F6F1E6] text-left text-[12px] font-semibold text-[var(--muted)]">
                      <th className="px-3.5 py-2.5">Dare</th>
                      <th className="px-3.5 py-2.5">Reports</th>
                      <th className="px-3.5 py-2.5">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.reports.map((r) => (
                      <tr key={r.dare_id} className="border-t border-[#E6DFD0]">
                        <td className="px-3.5 py-3">
                          <b>{r.title}</b>
                          <span className="block text-[12.5px] text-[var(--muted)]">{ago(r.created_at)}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          {r.count} ·{' '}
                          {Object.entries(r.reasons)
                            .map(([k, v]) => `${REASON[k] ?? k}${v > 1 ? ` ×${v}` : ''}`)
                            .join(', ')}
                        </td>
                        <td className="px-3.5 py-3">
                          {r.outcome === 'open' ? (
                            <Pill bg="#FFF6D6" fg="var(--ink)">Open</Pill>
                          ) : r.outcome === 'removed' ? (
                            <Pill bg="#FBEAE8" fg={RED}>Removed{r.resolved_by ? ` by ${r.resolved_by}` : ''}</Pill>
                          ) : (
                            <Pill bg="#E6E1D6" fg="#5A5C63">Dismissed{r.resolved_by ? ` by ${r.resolved_by}` : ''}</Pill>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="mt-5 text-[13px] font-bold text-[var(--muted)]">History</h2>
            <ul className="mt-2.5 space-y-1 rounded-[16px] border border-[var(--hairline)] bg-[var(--card)] px-4 py-3 text-[13.5px] leading-[1.6]">
              {person.history.map((h, i) => (
                <li key={i}>
                  <span className="text-[var(--muted)]">{shortDate(h.at)} ·</span> {h.summary}
                </li>
              ))}
            </ul>
          </div>

          <aside className="w-full rounded-[18px] border border-[var(--hairline)] bg-[var(--card)] p-[18px] lg:w-[300px] lg:shrink-0">
            <b className="text-[16px]">Account actions</b>
            {person.status.state === 'suspended' ? (
              <>
                <p className="mb-3.5 mt-1.5 text-[13px] leading-[1.5] text-[var(--muted)]">
                  Suspended {person.status.until ? `until ${shortDate(person.status.until)}` : 'until lifted'}. They were told: “{person.status.reason}”
                </p>
                <button type="button" disabled={busy} onClick={() => void lift()} className="h-11 rounded-full bg-[var(--ink)] px-4 text-[14.5px] font-bold text-white disabled:opacity-40">
                  {busy ? 'Lifting…' : 'Lift suspension'}
                </button>
              </>
            ) : person.status.state === 'active' ? (
              <>
                <p className="mb-3.5 mt-1.5 text-[13px] leading-[1.5] text-[var(--muted)]">
                  Suspending signs them out everywhere and hides their profile, pacts and dares until it ends. Nothing is deleted.
                </p>
                <button type="button" onClick={() => setSuspending(true)} className="h-11 rounded-full px-4 text-[14.5px] font-bold text-white" style={{ background: RED }}>
                  Suspend…
                </button>
              </>
            ) : (
              <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--muted)]">They asked to delete their account, so it&apos;s already hidden.</p>
            )}
            <p className="mt-2.5 text-[12px] text-[#8A8C93]">Asks for your authenticator code. They&apos;re told why, and when it ends.</p>
          </aside>
        </div>
      )}
      {suspending && person && (
        <SuspendDialog
          person={person}
          onClose={() => setSuspending(false)}
          onDone={() => {
            setSuspending(false);
            void load();
          }}
        />
      )}
    </>
  );
}

export default function PersonPageRoute() {
  return (
    <ConsoleFrame>
      <Person />
    </ConsoleFrame>
  );
}
